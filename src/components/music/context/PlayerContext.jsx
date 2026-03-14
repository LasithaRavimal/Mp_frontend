import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useSession } from "../../../components/music/context/SessionContext";
import { showWarningToast } from "../../../utils/notifications";
import apiClient from "../../../api/apiClient";

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
};

export const PlayerProvider = ({ children }) => {

  const audioRef = useRef(null);

  const { isAdmin } = useAuth();
  const session = useSession();

  const {
    startSession,
    trackSongPlay,
    trackSongPause,
    trackSkip,
    trackRepeat,
    trackVolumeChange,
    isAdmin: sessionIsAdmin
  } = session;

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const [songQueue, setSongQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);

  const [shuffleMode, setShuffleMode] = useState(false);
  const [originalQueue, setOriginalQueue] = useState([]);

  const playStartTimeRef = useRef(null);

  const BASE_URL = "https://music-player-col8.onrender.com";

  /* ---------------- QUEUE ---------------- */

  const buildQueue = useCallback(async (initialSong) => {
    try {

      const response = await apiClient.get("/songs");
      const songs = response.data || [];

      const initialIndex = songs.findIndex(s => s.id === initialSong.id);

      setSongQueue(songs);
      setOriginalQueue(songs);
      setCurrentQueueIndex(initialIndex >= 0 ? initialIndex : 0);

    } catch (error) {

      console.error("Queue load failed", error);

      setSongQueue([initialSong]);
      setOriginalQueue([initialSong]);
      setCurrentQueueIndex(0);

    }
  }, []);

  /* ---------------- PLAY SONG ---------------- */

  const onPlaySong = useCallback(async (song) => {

    if (!song) return;

    const isDifferentSong = currentSong && currentSong.id !== song.id;

    if (isDifferentSong && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }

    setSongQueue(prev => {

      if (prev.length === 0) {
        buildQueue(song);
        return prev;
      }

      const index = prev.findIndex(s => s.id === song.id);
      if (index >= 0) setCurrentQueueIndex(index);

      return prev;

    });

    setCurrentSong(song);

    const audio = audioRef.current;

    if (audio) {

      audio.src = BASE_URL + song.audio_url;

      await new Promise(resolve => {

        const handle = () => {
          audio.removeEventListener("canplay", handle);
          resolve();
        };

        audio.addEventListener("canplay", handle);
        audio.load();

      });

      try {
        await audio.play();
      } catch (err) {
        console.error("Audio play error", err);
      }

    }

    let activeSessionId = session.activeSession;

    if (!activeSessionId && !sessionIsAdmin) {
      activeSessionId = await startSession(song.id);
    }

    if (activeSessionId && !sessionIsAdmin) {

      playStartTimeRef.current = 0;

      trackSongPlay(
        song.id,
        song.category || "calm",
        playStartTimeRef.current
      );

    }

    setIsPlaying(true);

  }, [currentSong, startSession, session, sessionIsAdmin, trackSongPlay, buildQueue]);

  /* ---------------- LOAD STATE ---------------- */

  useEffect(() => {

    const savedSong = localStorage.getItem("currentSong");
    const savedVolume = localStorage.getItem("volume");

    if (savedSong) {
      try {
        setCurrentSong(JSON.parse(savedSong));
      } catch {}
    }

    if (savedVolume) {
      const v = parseFloat(savedVolume);
      setVolume(v);

      if (audioRef.current)
        audioRef.current.volume = v;
    }

  }, []);

  useEffect(() => {
    if (currentSong)
      localStorage.setItem("currentSong", JSON.stringify(currentSong));
  }, [currentSong]);

  useEffect(() => {
    localStorage.setItem("volume", volume.toString());
  }, [volume]);

  /* ---------------- AUDIO EVENTS ---------------- */

  useEffect(() => {

    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => setCurrentTime(audio.currentTime);
    const handleMeta = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);

    const handlePause = () => {

      setIsPlaying(false);

      if (currentSong && playStartTimeRef.current !== null) {

        const duration = audio.currentTime - playStartTimeRef.current;

        trackSongPause(currentSong.id, duration);

      }

    };

    const handleEnded = async () => {

      setIsPlaying(false);

      if (songQueue.length > 0) {

        let nextIndex;

        if (shuffleMode) {
          nextIndex = Math.floor(Math.random() * songQueue.length);
        } else {
          nextIndex = currentQueueIndex + 1;
          if (nextIndex >= songQueue.length) nextIndex = 0;
        }

        if (songQueue[nextIndex]) {

          setCurrentQueueIndex(nextIndex);
          await onPlaySong(songQueue[nextIndex]);

        }

      }

    };

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("loadedmetadata", handleMeta);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {

      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("loadedmetadata", handleMeta);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);

    };

  }, [currentSong, songQueue, currentQueueIndex, shuffleMode, onPlaySong, trackSongPause]);

  /* ---------------- CONTROLS ---------------- */

  const handlePlayPause = useCallback(() => {

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) audio.pause();
    else audio.play();

  }, [isPlaying]);

  const handleSkip = useCallback(async () => {

    if (!currentSong || songQueue.length === 0) return;

    trackSkip(currentSong.id);

    let nextIndex = currentQueueIndex + 1;
    if (nextIndex >= songQueue.length) nextIndex = 0;

    setCurrentQueueIndex(nextIndex);

    await onPlaySong(songQueue[nextIndex]);

  }, [songQueue, currentSong, currentQueueIndex, trackSkip, onPlaySong]);

  const handleRepeat = useCallback(() => {

    const audio = audioRef.current;
    if (!audio) return;

    trackRepeat(currentSong.id);

    audio.currentTime = 0;
    audio.play();

  }, [currentSong, trackRepeat]);

  const handleVolumeChange = useCallback((v) => {

    setVolume(v);

    if (audioRef.current)
      audioRef.current.volume = v;

    trackVolumeChange(v);

  }, [trackVolumeChange]);

  const handleShuffle = () => {
    setShuffleMode(!shuffleMode);
  };

  /* ---------------- CONTEXT VALUE ---------------- */

  const value = {

    currentSong,
    setCurrentSong,

    isPlaying,
    setIsPlaying,

    showExpanded,
    setShowExpanded,

    currentTime,
    duration,
    volume,

    audioRef,

    onPlaySong,

    handlePlayPause,
    handleSkip,
    handleRepeat,
    handleVolumeChange,
    handleShuffle,

    shuffleMode,

    activeSession: session.activeSession

  };

  return (

    <PlayerContext.Provider value={value}>

      {children}

      <audio ref={audioRef} preload="metadata" />

    </PlayerContext.Provider>

  );

};

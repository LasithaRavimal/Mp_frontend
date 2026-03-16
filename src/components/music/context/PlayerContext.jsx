import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useSession } from "../../../components/music/context/SessionContext";
import { handleSessionEnd } from "../../../utils/musicSessionEndHandler";
import { showWarningToast } from "../../../utils/notifications";
import apiClient from "../../../api/apiClient";

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};

export const PlayerProvider = ({ children }) => {

  const audioRef = useRef(null);
  const playStartTimeRef = useRef(null);

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showExpanded, setShowExpanded] = useState(false);

  const [songQueue, setSongQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [shuffleMode, setShuffleMode] = useState(false);

  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [prediction, setPrediction] = useState(null);

  /* ---------------- LOAD SONG QUEUE ---------------- */

  const buildQueue = useCallback(async (song) => {

    try {

      const res = await apiClient.get("/songs");
      const songs = res.data || [];

      const index = songs.findIndex(s => s.id === song.id);

      setSongQueue(songs);
      setCurrentQueueIndex(index >= 0 ? index : 0);

    } catch (err) {

      console.error("Queue load failed", err);
      setSongQueue([song]);
      setCurrentQueueIndex(0);

    }

  }, []);

  /* ---------------- PLAY SONG ---------------- */

  const onPlaySong = useCallback(async (song) => {

    if (!song) return;

    // SAVE previous song listening duration
if (audioRef.current && currentSong && playStartTimeRef.current !== null) {

  const listenedDuration =
    audioRef.current.currentTime - playStartTimeRef.current;

  if (listenedDuration > 0) {

    console.log("Saving previous song duration:", listenedDuration);

    trackSongPause(currentSong.id, listenedDuration);

  }

}

    const isDifferent = currentSong && currentSong.id !== song.id;

    if (isDifferent && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }

    setSongQueue(prev => {

      if (!prev.length || !prev.find(s => s.id === song.id)) {
        buildQueue(song);
        return prev;
      }

      const index = prev.findIndex(s => s.id === song.id);
      if (index >= 0) setCurrentQueueIndex(index);

      return prev;

    });

    setCurrentSong(song);

    // important → do NOT autoplay
    setIsPlaying(false);

  }, [currentSong, buildQueue]);

  /* ---------------- LOAD AUDIO ---------------- */

  useEffect(() => {

    if (!currentSong || !audioRef.current) return;

    audioRef.current.src = currentSong.audio_url;
    audioRef.current.load();

  }, [currentSong]);

  /* ---------------- AUDIO EVENTS ---------------- */

  useEffect(() => {

    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const loaded = () => setDuration(audio.duration);

    const ended = async () => {

  if (audioRef.current && currentSong) {

    const listenedDuration =
      audioRef.current.currentTime - playStartTimeRef.current;

    if (listenedDuration > 0) {
      trackSongPause(currentSong.id, listenedDuration);
    }

  }

  setIsPlaying(false);

      if (!songQueue.length) return;

      let next;

      if (shuffleMode) {
        next = Math.floor(Math.random() * songQueue.length);
      } else {
        next = currentQueueIndex + 1;
        if (next >= songQueue.length) next = 0;
      }

      setCurrentQueueIndex(next);
      await onPlaySong(songQueue[next]);

    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", loaded);
    audio.addEventListener("ended", ended);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", loaded);
      audio.removeEventListener("ended", ended);
    };

  }, [songQueue, currentQueueIndex, shuffleMode, onPlaySong]);

  /* ---------------- PLAY / PAUSE ---------------- */

  const handlePlayPause = useCallback(async () => {

    if (!currentSong) return;

    if (isPlaying) {

      console.log("Pause");
      audioRef.current.pause();
      setIsPlaying(false);

      return;
    }

    console.log("Play clicked");

    if (!session.activeSession && !sessionIsAdmin) {

      console.log("Starting session");

      const sessionId = await startSession(currentSong.id);
      if (!sessionId) return;

      console.log("Session started:", sessionId);

    }

    audioRef.current.play();

    playStartTimeRef.current = audioRef.current.currentTime;

    if (!sessionIsAdmin) {

      trackSongPlay(
        currentSong.id,
        currentSong.category || "calm",
        audioRef.current.currentTime
      );

    }

    setIsPlaying(true);

  }, [currentSong, isPlaying, session, sessionIsAdmin]);

  /* ---------------- SKIP ---------------- */

  const handleSkip = useCallback(async () => {

    // save duration of current song before skipping
if (audioRef.current && currentSong) {

  const listenedDuration =
    audioRef.current.currentTime - playStartTimeRef.current;

  if (listenedDuration > 0) {
    trackSongPause(currentSong.id, listenedDuration);
  }

}

trackSkip(currentSong.id);

let next = currentQueueIndex + 1;
if (next >= songQueue.length) next = 0;

setCurrentQueueIndex(next);

await onPlaySong(songQueue[next]);

  }, [songQueue, currentQueueIndex, currentSong, onPlaySong]);

  /* ---------------- REPEAT ---------------- */

  const handleRepeat = useCallback(() => {

    if (!audioRef.current) return;

    trackRepeat(currentSong.id);
    audioRef.current.currentTime = 0;
    audioRef.current.play();

  }, [currentSong]);

  /* ---------------- VOLUME ---------------- */

  const handleVolumeChange = useCallback((v) => {

    setVolume(v);

    if (audioRef.current) {
      audioRef.current.volume = v;
    }

    trackVolumeChange(v);

  }, []);

  /* ---------------- SHUFFLE ---------------- */

  const handleShuffle = () => setShuffleMode(!shuffleMode);

  /* ---------------- END SESSION ---------------- */

  const handleEndSession = useCallback(async () => {

    console.log("===== SESSION END REQUEST =====");

    let totalListeningSeconds =
      Array.from(session.songDurations.values())
      .reduce((sum, d) => sum + d, 0);

    if (audioRef.current && currentSong) {
      totalListeningSeconds += audioRef.current.currentTime;
    }

    console.log("Listening seconds:", totalListeningSeconds);

    const MINIMUM = 300;

    if (totalListeningSeconds < MINIMUM) {

      const remaining = Math.ceil((MINIMUM - totalListeningSeconds) / 60);

      showWarningToast(
        `Listen at least 5 minutes. Remaining ${remaining} minute(s).`,
        6000
      );

      return;

    }

    await handleSessionEnd(session, (pred) => {

      console.log("Prediction:", pred);

      setPrediction(pred);
      setShowPredictionModal(true);

    });

    audioRef.current.pause();
    setIsPlaying(false);
    playStartTimeRef.current = null;

  }, [session, currentSong]);

  /* ---------------- CONTEXT VALUE ---------------- */

  const value = {

    currentSong,
    setCurrentSong,

    isPlaying,
    setIsPlaying,

    currentTime,
    duration,
    volume,

    showExpanded,
    setShowExpanded,

    onPlaySong,

    activeSession: session.activeSession,

    audioRef,

    handlePlayPause,
    handleSkip,
    handleRepeat,
    handleVolumeChange,
    handleShuffle,

    shuffleMode,

    handleEndSession,

    showPredictionModal,
    setShowPredictionModal,

    prediction,
    setPrediction

  };

  return (

    <PlayerContext.Provider value={value}>

      {children}

      <audio ref={audioRef} />

    </PlayerContext.Provider>

  );

};
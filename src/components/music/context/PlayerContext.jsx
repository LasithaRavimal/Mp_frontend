import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSession } from '../../../components/music/context/SessionContext';
import { handleSessionEnd } from '../../../utils/musicSessionEndHandler';
import { showWarningToast } from '../../../utils/notifications';
import apiClient from '../../../api/apiClient';

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {

  const audioRef = useRef(null);

  const { isAdmin, user } = useAuth();
  const session = useSession();

  const {
    startSession,
    trackSongPlay,
    trackSongPause,
    trackSkip,
    trackRepeat,
    trackVolumeChange,
    updateActivity,
    isAdmin: sessionIsAdmin
  } = session;

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const [songQueue, setSongQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [originalQueue, setOriginalQueue] = useState([]);

  const playStartTimeRef = useRef(null);
  const previousSongIdRef = useRef(null);

  /* ---------------- QUEUE ---------------- */

  const buildQueue = useCallback(async (initialSong) => {
    try {

      const response = await apiClient.get('/songs');
      const allSongs = response.data || [];

      const initialIndex = allSongs.findIndex(s => s.id === initialSong.id);

      setSongQueue(allSongs);
      setOriginalQueue(allSongs);
      setCurrentQueueIndex(initialIndex >= 0 ? initialIndex : 0);

    } catch (error) {

      console.error('Failed to load songs for queue:', error);

      setSongQueue([initialSong]);
      setOriginalQueue([initialSong]);
      setCurrentQueueIndex(0);

    }
  }, []);

  /* ---------------- PLAY SONG ---------------- */

  const onPlaySong = useCallback(async (song) => {

    const isDifferentSong = currentSong && currentSong.id !== song.id;

    if (isDifferentSong) {
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      localStorage.removeItem(`currentTime_${song.id}`);
    }

    setSongQueue(prevQueue => {

      if (prevQueue.length === 0 || !prevQueue.find(s => s.id === song.id)) {

        buildQueue(song).catch(console.error);
        return prevQueue;

      } else {

        const index = prevQueue.findIndex(s => s.id === song.id);

        if (index >= 0) setCurrentQueueIndex(index);

        return prevQueue;

      }

    });

    setCurrentSong(song);

  }, [currentSong, buildQueue]);

  /* ---------------- PLAYER STATE ---------------- */

  useEffect(() => {

    const savedSong = localStorage.getItem('currentSong');
    const savedIsPlaying = localStorage.getItem('isPlaying');
    const savedVolume = localStorage.getItem('volume');

    if (savedSong) {
      try {
        setCurrentSong(JSON.parse(savedSong));
      } catch {}
    }

    if (savedIsPlaying === 'true') setIsPlaying(true);

    if (savedVolume) setVolume(parseFloat(savedVolume));

  }, []);

  useEffect(() => {
    if (currentSong)
      localStorage.setItem('currentSong', JSON.stringify(currentSong));
  }, [currentSong]);

  useEffect(() => {
    localStorage.setItem('isPlaying', isPlaying.toString());
  }, [isPlaying]);

  useEffect(() => {
    localStorage.setItem('volume', volume.toString());
  }, [volume]);

  /* ---------------- LOAD AUDIO ---------------- */

  useEffect(() => {

    if (currentSong && audioRef.current) {

      const backend = import.meta.env.VITE_BACKEND_URL;

      audioRef.current.src =
        backend + currentSong.audio_url;

      audioRef.current.load();

      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }

    }

  }, [currentSong, isPlaying]);

  /* ---------------- AUDIO EVENTS ---------------- */

  useEffect(() => {

    const audio = audioRef.current;

    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
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

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {

      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);

    };

  }, [songQueue, currentQueueIndex, shuffleMode, onPlaySong]);

  /* ---------------- CONTROLS ---------------- */

  const handlePlayPause = useCallback(async () => {

    if (!currentSong) return;

    if (isPlaying) {

      audioRef.current.pause();
      setIsPlaying(false);

    } else {

      if (!session.activeSession && !sessionIsAdmin) {
        const sessionId = await startSession(currentSong.id);
        if (!sessionId) return;
      }

      audioRef.current.play();

      if (session.activeSession && !sessionIsAdmin) {
        trackSongPlay(
          currentSong.id,
          currentSong.category || 'calm',
          audioRef.current.currentTime
        );
      }

      setIsPlaying(true);

    }

  }, [currentSong, isPlaying, session, sessionIsAdmin]);

  const handleSkip = useCallback(async () => {

    if (!currentSong || songQueue.length === 0) return;

    trackSkip(currentSong.id);

    let nextIndex = currentQueueIndex + 1;

    if (nextIndex >= songQueue.length) nextIndex = 0;

    setCurrentQueueIndex(nextIndex);

    await onPlaySong(songQueue[nextIndex]);

  }, [currentSong, songQueue, currentQueueIndex, onPlaySong]);

  const handleRepeat = useCallback(() => {

    if (!audioRef.current) return;

    trackRepeat(currentSong.id);

    audioRef.current.currentTime = 0;

    audioRef.current.play();

  }, [currentSong]);

  const handleVolumeChange = useCallback((newVolume) => {

    setVolume(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    trackVolumeChange(newVolume);

  }, []);

  const handleShuffle = () => {

    setShuffleMode(!shuffleMode);

  };

  /* ---------------- END SESSION ---------------- */

  const handleEndSession = useCallback(async () => {

    if (
      audioRef.current &&
      currentSong &&
      playStartTimeRef.current !== null &&
      !sessionIsAdmin
    ) {

      const listenedDuration =
        audioRef.current.currentTime - playStartTimeRef.current;

      if (listenedDuration > 0) {
        trackSongPause(currentSong.id, listenedDuration);
      }

    }

    const totalListeningSeconds =
      Array.from(session.songDurations.values())
        .reduce((sum, duration) => sum + duration, 0);

    const MINIMUM_LISTENING_TIME_SECONDS = 300;

    if (totalListeningSeconds < MINIMUM_LISTENING_TIME_SECONDS) {

      const remainingMinutes =
        Math.ceil((MINIMUM_LISTENING_TIME_SECONDS - totalListeningSeconds) / 60);

      showWarningToast(
        `Keep listening at least 5 minutes for better accuracy.
You need ${remainingMinutes} more minute(s).`,
        6000
      );

      return;

    }

    await handleSessionEnd(session, (pred) => {

      setPrediction(pred);
      setShowPredictionModal(true);

    });

    if (audioRef.current) audioRef.current.pause();

    setIsPlaying(false);

    playStartTimeRef.current = null;

  }, [session, currentSong]);

  /* ---------------- CONTEXT VALUE ---------------- */

  const value = {

    currentSong,
    setCurrentSong,

    isPlaying,
    setIsPlaying,

    showExpanded,
    setShowExpanded,

    currentTime,
    setCurrentTime,

    duration,
    setDuration,

    volume,
    setVolume,

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

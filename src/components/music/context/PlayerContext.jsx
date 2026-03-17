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

  /* ---------------- HELPER: SAVE EXACT LISTENING TIME ---------------- */
  // Flushes the duration of the current audio chunk to the session context
  const flushListeningTime = useCallback(() => {
    if (audioRef.current && currentSong && playStartTimeRef.current !== null) {
      const listenedDuration = audioRef.current.currentTime - playStartTimeRef.current;
      
      if (listenedDuration > 0) {
        console.log(`[Session] Saving duration: ${listenedDuration.toFixed(2)}s for ${currentSong.title}`);
        trackSongPause(currentSong.id, listenedDuration);
      }
      playStartTimeRef.current = null; // Reset until played again
    }
  }, [currentSong, trackSongPause]);

  /* ---------------- PLAY / PAUSE ---------------- */

  const handlePlayPause = useCallback(async () => {
    if (!currentSong) return;

    if (isPlaying) {
      // 1. PAUSING
      flushListeningTime();
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 2. PLAYING
      if (!session.activeSession && !sessionIsAdmin) {
        await startSession(currentSong.id);
      }

      // If at end of song, restart it
      if (audioRef.current.currentTime >= duration) {
        audioRef.current.currentTime = 0;
      }

      audioRef.current.play().catch(e => console.error("Play error:", e));
      playStartTimeRef.current = audioRef.current.currentTime;
      
      if (!sessionIsAdmin) {
        trackSongPlay(currentSong.id, currentSong.category || "calm", audioRef.current.currentTime);
      }
      setIsPlaying(true);
    }
  }, [currentSong, isPlaying, duration, session, sessionIsAdmin, flushListeningTime, startSession, trackSongPlay]);

  /* ---------------- PLAY NEW SONG ---------------- */

  const onPlaySong = useCallback(async (song) => {
    if (!song) return;

    // Toggle play/pause if clicking the EXACT same song
    if (currentSong && currentSong.id === song.id) {
      handlePlayPause();
      return;
    }

    // Save listening duration of the PREVIOUS song before switching
    flushListeningTime();

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

    // Make sure a session is running
    if (!session.activeSession && !sessionIsAdmin) {
      await startSession(song.id);
    }

    setIsPlaying(true);
    playStartTimeRef.current = 0; // Starts from 0 since it's a new song

    if (!sessionIsAdmin) {
      trackSongPlay(song.id, song.category || "calm", 0);
    }
  }, [currentSong, flushListeningTime, handlePlayPause, buildQueue, session, sessionIsAdmin, startSession, trackSongPlay]);

  /* ---------------- SKIP ---------------- */

  const handleSkip = useCallback(async (direction = 'next') => {
    if (!currentSong || !songQueue.length) return;

    flushListeningTime(); // Save time before skipping
    trackSkip(currentSong.id);

    let nextIndex;
    if (direction === 'previous') {
      nextIndex = currentQueueIndex - 1;
      if (nextIndex < 0) nextIndex = songQueue.length - 1;
    } else {
      if (shuffleMode) {
        nextIndex = Math.floor(Math.random() * songQueue.length);
      } else {
        nextIndex = currentQueueIndex + 1;
        if (nextIndex >= songQueue.length) nextIndex = 0;
      }
    }

    setCurrentQueueIndex(nextIndex);
    await onPlaySong(songQueue[nextIndex]);
  }, [currentSong, songQueue, currentQueueIndex, shuffleMode, flushListeningTime, trackSkip, onPlaySong]);

  /* ---------------- REPEAT ---------------- */

  const handleRepeat = useCallback(() => {
    if (!audioRef.current) return;
    trackRepeat(currentSong.id);
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  }, [currentSong, trackRepeat]);

  /* ---------------- VOLUME ---------------- */

  const handleVolumeChange = useCallback((v) => {
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
    trackVolumeChange(v);
  }, [trackVolumeChange]);

  const handleShuffle = () => setShuffleMode(!shuffleMode);

  /* ---------------- AUDIO EVENT LISTENERS ---------------- */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const loaded = () => setDuration(audio.duration);

    const ended = async () => {
      flushListeningTime(); // Save final time before it ended naturally
      setIsPlaying(false);

      if (!songQueue.length) return;

      let nextIndex;
      if (shuffleMode) {
        nextIndex = Math.floor(Math.random() * songQueue.length);
      } else {
        nextIndex = currentQueueIndex + 1;
        if (nextIndex >= songQueue.length) nextIndex = 0;
      }

      setCurrentQueueIndex(nextIndex);
      await onPlaySong(songQueue[nextIndex]);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", loaded);
    audio.addEventListener("ended", ended);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", loaded);
      audio.removeEventListener("ended", ended);
    };
  }, [songQueue, currentQueueIndex, shuffleMode, onPlaySong, flushListeningTime]);

  /* ---------------- AUTO-PLAY WHEN SONG CHANGES ---------------- */

  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    audioRef.current.src = currentSong.audio_url;
    audioRef.current.load();

    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Auto-play error:", e));
    }
  }, [currentSong, isPlaying]);

 /* ---------------- END SESSION ---------------- */
  const handleEndSession = useCallback(async () => {
    console.log("===== SESSION END REQUEST =====");

    
    flushListeningTime();

    const totalListeningSeconds = Array.from(session.songDurations.values())
      .reduce((sum, d) => sum + d, 0);

    console.log("Total Accurate Listening Seconds:", totalListeningSeconds);

   
    const MINIMUM = 0;

    if (totalListeningSeconds < MINIMUM) {
      const remaining = Math.ceil((MINIMUM - totalListeningSeconds) / 60);
      showWarningToast(`Listen at least 5 minutes. Remaining ${remaining} minute(s).`, 6000);
      return;
    }

    try {
      console.log("Sending REAL behavior data to database...");
     
      const result = await session.endSession(); 
      
      if(result && result.prediction) {
         setPrediction(result.prediction);
      }
      
      
      setShowPredictionModal(true);

    } catch (error) {
      console.error("Failed to save session to DB:", error);
      setShowPredictionModal(true); 
    }

    
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    playStartTimeRef.current = null;
    
  }, [session, isPlaying, flushListeningTime]);

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
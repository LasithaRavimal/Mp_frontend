import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';

const SessionContext = createContext(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

// --- HELPER FUNCTIONS MOVED OUTSIDE TO PREVENT STALE CLOSURES ---
const getMostFrequentCategory = (songsPlayed = []) => {
  const categories = songsPlayed.map(s => s.category).filter(Boolean);
  if (categories.length === 0) return 'calm';
  
  const counts = {};
  categories.forEach(cat => {
    counts[cat] = (counts[cat] || 0) + 1;
  });
  
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'calm');
};

const getAverageVolumeBucket = (volumeHistory = []) => {
  if (volumeHistory.length === 0) return 'Medium';
  
  const avgVolume = volumeHistory.reduce((sum, v) => sum + v.volume, 0) / volumeHistory.length;
  if (avgVolume < 0.33) return 'Low';
  if (avgVolume < 0.67) return 'Medium';
  return 'High';
};

const getSongDiversityBucket = (songsPlayed = []) => {
  const uniqueCategories = new Set(songsPlayed.map(s => s.category).filter(Boolean)).size;
  if (uniqueCategories === 1) return 'One category';
  if (uniqueCategories <= 3) return '2-3 categories';
  return 'More than 3 categories';
};

const calculateSessionLengthBucket = (startTime, endTime) => {
  if (!startTime) return 'Less than 10 min';
  
  const durationMinutes = (endTime - startTime) / (1000 * 60);
  
  // FIX: isNaN check added to prevent "More than 1 hour" bug
  if (isNaN(durationMinutes) || durationMinutes < 10) return 'Less than 10 min';
  if (durationMinutes < 30) return '10-30 min';
  if (durationMinutes < 60) return '30-60 min';
  
  return 'More than 1 hour';
};

const getListeningTimeOfDay = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) return 'Morning (5am-11am)';
  if (hour >= 11 && hour < 15) return 'Afternoon (11am-3pm)';
  if (hour >= 15 && hour < 20) return 'Evening (3pm-8pm)';
  if (hour >= 20 && hour < 24) return 'Night (8pm-12am)';
  return 'Midnight (12am-5am)';
};
// ----------------------------------------------------------------

export const SessionProvider = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [activeSession, setActiveSession] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [lastActivityTime, setLastActivityTime] = useState(null);
  
  // Song tracking
  const [songsPlayed, setSongsPlayed] = useState([]); 
  const [songDurations, setSongDurations] = useState(new Map()); 
  const [skipCount, setSkipCount] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);
  const [volumeHistory, setVolumeHistory] = useState([]); 
  
  // Inactivity timer
  const inactivityTimerRef = useRef(null);
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; 
  
  // Create a ref to hold latest session data for the tab-close event
  const sessionDataRef = useRef({
    activeSession,
    sessionEvents,
    sessionStartTime,
    songsPlayed,
    volumeHistory,
    skipCount,
    repeatCount
  });

  // Sync ref with state so `beforeunload` always has fresh data
  useEffect(() => {
    sessionDataRef.current = {
      activeSession,
      sessionEvents,
      sessionStartTime,
      songsPlayed,
      volumeHistory,
      skipCount,
      repeatCount
    };
  }, [activeSession, sessionEvents, sessionStartTime, songsPlayed, volumeHistory, skipCount, repeatCount]);
  
  // Update last activity time
  const updateActivity = useCallback(() => {
    const now = new Date();
    setLastActivityTime(now);
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    inactivityTimerRef.current = setTimeout(() => {
      if (activeSession) {
        endSession();
      }
    }, INACTIVITY_TIMEOUT);
  }, [activeSession]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Start a new session
  const startSession = useCallback(async (songId = null) => {
    if (isAdmin) {
      console.log('Session tracking disabled for admin users');
      return null;
    }
    
    try {
      const existingSessionResponse = await apiClient.get('/sessions/active').catch(() => null);
      
      if (existingSessionResponse?.data?.session_id) {
        setActiveSession(existingSessionResponse.data.session_id);
        
        // Use backend start time to calculate true session length. 
        const backendStartTime = existingSessionResponse.data.started_at;
        setSessionStartTime(backendStartTime ? new Date(backendStartTime) : new Date());
        
        updateActivity();
        return existingSessionResponse.data.session_id;
      }
      
      // Start new session
      const response = await apiClient.post('/sessions/start', {
        song_id: songId || null
      });
      
      const sessionId = response.data.session_id;
      setActiveSession(sessionId);
      
      // FIX: Fallback to new Date() if started_at is missing from response
      const newBackendStartTime = response.data.started_at;
      setSessionStartTime(newBackendStartTime ? new Date(newBackendStartTime) : new Date());
      
      setSessionEvents([]);
      setSongsPlayed([]);
      setSongDurations(new Map()); // Reset Map
      setSkipCount(0);
      setRepeatCount(0);
      setVolumeHistory([]);
      updateActivity();
      
      return sessionId;
    } catch (error) {
      console.error('Failed to start session:', error);
      return null;
    }
  }, [updateActivity, isAdmin]);
  
  // Track an event
  const trackEvent = useCallback((event) => {
    if (isAdmin || !activeSession) return;
    
    const eventWithTimestamp = {
      ...event,
      timestamp: new Date(),
    };
    
    setSessionEvents(prev => [...prev, eventWithTimestamp]);
    updateActivity();
    
    apiClient.post('/sessions/heartbeat', null, {
      params: { session_id: activeSession }
    }).catch(err => {
      console.debug('Heartbeat failed (may be expected):', err);
    });
  }, [activeSession, updateActivity, isAdmin]);
  
  // Track song play
  const trackSongPlay = useCallback((songId, category, startTime) => {
    if (isAdmin || !activeSession) return;
    
    trackEvent({
      type: 'play',
      song_id: songId,
      metadata: { category, startTime }
    });
    
    setSongsPlayed(prev => [...prev, {
      songId,
      category,
      startTime: new Date(),
      duration: 0 
    }]);
  }, [activeSession, trackEvent, isAdmin]);
  
  // Track song pause/finish
  const trackSongPause = useCallback((songId, duration) => {
    if (isAdmin || !activeSession) return;
    
    trackEvent({
      type: 'pause',
      song_id: songId,
      duration
    });
    
    // Properly updating the Map state
    setSongDurations(prev => {
      const newMap = new Map(prev);
      const currentDuration = newMap.get(songId) || 0;
      newMap.set(songId, currentDuration + duration);
      return newMap;
    });
    
    setSongsPlayed(prev => prev.map(song => {
      if (song.songId === songId && song.duration === 0) {
        return { ...song, duration: duration };
      }
      return song;
    }));
  }, [activeSession, trackEvent, isAdmin]);
  
  // Track skip
  const trackSkip = useCallback((songId) => {
    if (isAdmin || !activeSession) return;
    
    setSkipCount(prev => prev + 1);
    trackEvent({
      type: 'skip',
      song_id: songId
    });
  }, [activeSession, trackEvent, isAdmin]);
  
  // Track repeat
  const trackRepeat = useCallback((songId) => {
    if (isAdmin || !activeSession) return;
    
    setRepeatCount(prev => prev + 1);
    trackEvent({
      type: 'repeat',
      song_id: songId
    });
  }, [activeSession, trackEvent, isAdmin]);
  
  // Track volume change
  const trackVolumeChange = useCallback((volume) => {
    if (isAdmin || !activeSession) return;
    
    setVolumeHistory(prev => [...prev, {
      volume,
      timestamp: new Date()
    }]);
    
    trackEvent({
      type: 'volume_change',
      volume
    });
  }, [activeSession, trackEvent, isAdmin]);
  
  // End session - Real Data Aggregation
  const endSession = useCallback(async (customAggregatedData = null) => {
    if (isAdmin || !activeSession) return null;
    
    try {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      
      const realAggregatedData = customAggregatedData || {
        song_category_mode: getMostFrequentCategory(songsPlayed),
        skip_rate_bucket: skipCount === 0 ? 'Never' : skipCount <= 2 ? '1-2 times' : skipCount <= 5 ? '3-5 times' : 'More than 5 times',
        repeat_bucket: repeatCount === 0 ? 'None' : repeatCount <= 2 ? '1-2 times' : repeatCount <= 5 ? '3-5 times' : 'More than 5 times',
        duration_ratio_bucket: 'Around 50%',
        session_length_bucket: calculateSessionLengthBucket(sessionStartTime, new Date()),
        volume_level_bucket: getAverageVolumeBucket(volumeHistory),
        song_diversity_bucket: getSongDiversityBucket(songsPlayed),
        listening_time_of_day: getListeningTimeOfDay()
      };
      
      const response = await apiClient.post('/sessions/end', {
        session_id: activeSession,
        events: sessionEvents,
        aggregated_data: realAggregatedData 
      });
      
      // Clear session state
      setActiveSession(null);
      setSessionEvents([]);
      setSessionStartTime(null);
      setLastActivityTime(null);
      setSongsPlayed([]);
      setSongDurations(new Map());
      setSkipCount(0);
      setRepeatCount(0);
      setVolumeHistory([]);
      
      return response.data;
    } catch (error) {
      console.error('Failed to end session:', error);
      setActiveSession(null);
      setSessionEvents([]);
      return null;
    }
  }, [activeSession, sessionEvents, isAdmin, skipCount, repeatCount, sessionStartTime, songsPlayed, volumeHistory]);
  
  // End session on logout
  useEffect(() => {
    if (!user && activeSession) {
      endSession().catch(err => console.error('Failed to end session on logout:', err));
    }
  }, [user, activeSession, endSession]);
  
  // Tab close handler
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentData = sessionDataRef.current;
      
      if (currentData.activeSession) {
        const token = localStorage.getItem('token');
        
        const aggregatedData = {
          song_category_mode: getMostFrequentCategory(currentData.songsPlayed),
          skip_rate_bucket: currentData.skipCount === 0 ? 'Never' : currentData.skipCount <= 2 ? '1-2 times' : currentData.skipCount <= 5 ? '3-5 times' : 'More than 5 times',
          repeat_bucket: currentData.repeatCount === 0 ? 'None' : currentData.repeatCount <= 2 ? '1-2 times' : currentData.repeatCount <= 5 ? '3-5 times' : 'More than 5',
          duration_ratio_bucket: 'Around 50%',
          session_length_bucket: calculateSessionLengthBucket(currentData.sessionStartTime, new Date()),
          volume_level_bucket: getAverageVolumeBucket(currentData.volumeHistory),
          song_diversity_bucket: getSongDiversityBucket(currentData.songsPlayed),
          listening_time_of_day: getListeningTimeOfDay()
        };
        
        const payload = JSON.stringify({
          session_id: currentData.activeSession,
          events: currentData.sessionEvents.slice(-10), 
          aggregated_data: aggregatedData
        });
        
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          const url = `${window.location.origin}/api/sessions/end`;
          navigator.sendBeacon(url, blob);
        } else {
          fetch('/api/sessions/end', {
            method: 'POST',
            body: payload,
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` })
            },
            keepalive: true
          }).catch(() => {});
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []); 
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);
  
  const value = {
    activeSession,
    sessionEvents,
    sessionStartTime,
    lastActivityTime,
    songsPlayed,
    songDurations,
    skipCount,
    repeatCount,
    volumeHistory,
    startSession,
    endSession,
    trackEvent,
    trackSongPlay,
    trackSongPause,
    trackSkip,
    trackRepeat,
    trackVolumeChange,
    updateActivity,
    isAdmin,
  };
  
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './PlayerSidebar';
import TopBar from './PlayerTopBar';
import PlayerBar from './player/PlayerBar';
import PlayerExpanded from './player/PlayerExpanded';
import { usePlayer } from '../music/context/PlayerContext';

// Note: Ensure PredictionModal is imported if it's used at the bottom of the file
import PredictionModal from './ResultModal'; 

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  
  // ADDED: Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    currentSong,
    isPlaying,
    showExpanded,
    setShowExpanded,
    currentTime,
    setCurrentTime,
    duration,
    volume,
    handleVolumeChange,
    audioRef,
    showPredictionModal,
    setShowPredictionModal,
    prediction,
    handlePlayPause,
  } = usePlayer();

  return (
    <div className="flex h-screen bg-spotify-black overflow-hidden relative">
      
      {/* ADDED: Mobile Overlay Background */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-[40] md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ADDED: Passed props to Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden bg-spotify-dark-gray pb-[70px] md:pb-24">
        {/* ADDED: Passed toggle function to TopBar */}
        <TopBar toggleSidebar={() => setIsSidebarOpen(true)} />
        {children}
      </div>

      <PlayerBar />

      {showExpanded && currentSong && (
        <PlayerExpanded
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onClose={() => setShowExpanded(false)}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          onSeek={(time) => {
            if (audioRef.current) {
              audioRef.current.currentTime = time;
            }
            setCurrentTime(time);
          }}
        />
      )}

      {showPredictionModal && prediction && (
        <PredictionModal
          isOpen={showPredictionModal}
          onClose={() => setShowPredictionModal(false)}
          prediction={prediction}
          onViewHistory={() => {
            setShowPredictionModal(false);
            navigate('/sessions');
          }}
        />
      )}
    </div>
  );
};

export default Layout;
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import { usePlayer } from '../music/context/PlayerContext';
import { MdMenu, MdClose } from 'react-icons/md';

const MusicPlayer = () => {
  const { user, logout } = useAuth();
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    audioRef,
    onPlaySong,
    handlePlayPause,
    handleSkip,
    handleRepeat,
    handleVolumeChange,
    showPredictionModal,
    setShowPredictionModal,
    prediction,
  } = usePlayer();

  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadSongs();
    loadFavorites();
  }, [searchQuery, selectedCategory]);

  const loadSongs = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await apiClient.get(`/songs?${params}`);
      setSongs(res.data || []);
      setCategories([...new Set(res.data.map(s => s.category))]);
    } catch (err) {
      console.error('Failed to load songs', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await apiClient.get('/songs/favorites');
      setFavorites(new Set(res.data.song_ids));
    } catch (err) {
      console.error('Failed to load favorites', err);
    }
  };

  const toggleFavorite = async (songId) => {
    try {
      await apiClient.post(`/songs/${songId}/favorite`);
      setFavorites(prev => {
        const copy = new Set(prev);
        copy.has(songId) ? copy.delete(songId) : copy.add(songId);
        return copy;
      });
    } catch (err) {
      console.error('Favorite failed', err);
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-spotify-black text-white relative overflow-hidden">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-[40] md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-[50] w-64 bg-spotify-dark-gray p-6 flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">M_Track</h1>
          <button className="md:hidden text-text-gray hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <MdClose size={24} />
          </button>
        </div>

        <div className="mb-6 overflow-y-auto">
          <h3 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Categories</h3>
          <button
            onClick={() => { setSelectedCategory(''); setIsSidebarOpen(false); }}
            className={`block w-full text-left mb-2 px-2 py-1 rounded ${selectedCategory === '' ? 'bg-spotify-gray text-white' : 'text-gray-300 hover:text-white'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setIsSidebarOpen(false); }}
              className={`block w-full text-left mb-2 px-2 py-1 rounded ${selectedCategory === cat ? 'bg-spotify-gray text-white' : 'text-gray-300 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-auto border-t border-spotify-gray pt-4 text-sm text-gray-400 truncate">
          <p className="truncate mb-2">{user?.email}</p>
          <button onClick={logout} className="hover:text-white w-full text-left bg-red-500/10 text-red-400 px-3 py-2 rounded">
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">

        {/* Mobile Header */}
        <div className="md:hidden bg-spotify-dark-gray p-4 flex items-center gap-3 border-b border-spotify-gray">
           <button onClick={() => setIsSidebarOpen(true)} className="text-white">
             <MdMenu size={28} />
           </button>
           <h2 className="font-bold text-lg">M_Track</h2>
        </div>

        {/* Song List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search songs..."
            className="mb-6 w-full bg-spotify-light-gray p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-spotify-green text-sm md:text-base"
          />

          {loading ? (
            <div className="flex justify-center p-8"><p className="text-text-gray">Loading...</p></div>
          ) : (
            <div className="space-y-1">
              {songs.map(song => (
                <div
                  key={song.id}
                  onClick={() => onPlaySong(song)}
                  className="flex items-center justify-between p-3 hover:bg-spotify-light-gray rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-sm md:text-base truncate">{song.title}</p>
                    <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(song.id);
                    }}
                    className="p-2 shrink-0"
                  >
                    {favorites.has(song.id) ? '💚' : '🤍'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Player Bar */}
        {currentSong && (
          <div className="bg-spotify-light-gray p-3 md:p-4 border-t border-spotify-gray">
            <div className="flex items-center justify-between gap-2 md:gap-4 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm md:text-base truncate">{currentSong.title}</p>
                <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
              </div>

              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <button onClick={handleRepeat} className="hidden md:block text-xl">🔁</button>
                <button onClick={handleSkip} className="hidden md:block text-xl">⏭</button>
                <button onClick={handlePlayPause} className="bg-white text-black px-4 py-1.5 md:py-2 rounded-full font-bold text-sm md:text-base hover:scale-105">
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                className="hidden md:block w-24"
              />
            </div>

            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={e => (audioRef.current.currentTime = e.target.value)}
                className="flex-1 h-1 bg-spotify-gray appearance-none rounded"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Prediction Modal */}
      {showPredictionModal && prediction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
          <div className="bg-spotify-dark-gray p-6 rounded-xl w-full max-w-sm border border-spotify-gray">
            <h2 className="text-xl font-bold mb-4">Session Analysis</h2>
            <div className="space-y-2 mb-6">
              <p className="flex justify-between bg-spotify-black p-3 rounded">
                <span className="text-gray-400">Stress:</span> 
                <span className="font-bold">{prediction.stress_level}</span>
              </p>
              <p className="flex justify-between bg-spotify-black p-3 rounded">
                <span className="text-gray-400">Depression:</span> 
                <span className="font-bold">{prediction.depression_level}</span>
              </p>
            </div>
            <button
              onClick={() => setShowPredictionModal(false)}
              className="w-full bg-spotify-green hover:bg-green-500 text-black font-bold py-3 rounded-full transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <audio ref={audioRef} />
    </div>
  );
};

export default MusicPlayer;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaylistCard from './PlaylistCard';
import PlaylistModal from './PlaylistModal';
import apiClient from '../../../api/apiClient';

const PlaylistList = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const response = await apiClient.get('/playlists');
      setPlaylists(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load playlists:', error);
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlaylist(null);
    setShowModal(true);
  };

  const handleEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setShowModal(true);
  };

  const handleDelete = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await apiClient.delete(`/playlists/${playlistId}`);
      await loadPlaylists();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      alert('Failed to delete playlist');
    }
  };

  const handleModalSuccess = () => {
    loadPlaylists();
  };

  if (loading) {
    return <div className="text-text-gray animate-pulse">Loading playlists...</div>;
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-3xl font-bold text-white">Your Playlists</h2>
        <button
          onClick={handleCreate}
          className="btn-primary px-3 py-1.5 md:px-6 md:py-3 rounded-full md:rounded-lg font-semibold text-xs md:text-base whitespace-nowrap"
        >
          + Create
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-12 md:py-20 bg-spotify-light-gray rounded-lg px-4">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-spotify-green/20 to-spotify-green/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <svg className="w-10 h-10 md:w-16 md:h-16 text-spotify-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">Create your first playlist</h3>
            <p className="text-sm md:text-base text-text-gray mb-6 md:mb-8">
              It's easy, we'll help you. Add songs you love or pick a ready-made playlist.
            </p>
            <button
              onClick={handleCreate}
              className="btn-primary px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-sm md:text-lg hover:scale-105 transition-transform"
            >
              Create Playlist
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="relative group">
              <PlaylistCard playlist={playlist} showAddButton={true} />
              
              {/* Edit/Delete Buttons (Always visible on mobile, hover on desktop) */}
              <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1.5 md:gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(playlist);
                  }}
                  className="w-7 h-7 md:w-8 md:h-8 bg-spotify-green text-white rounded-full flex items-center justify-center text-xs md:text-sm hover:bg-spotify-green-hover shadow-md"
                  title="Edit Playlist"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(playlist.id);
                  }}
                  className="w-7 h-7 md:w-8 md:h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm hover:bg-red-700 shadow-md"
                  title="Delete Playlist"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlaylistModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPlaylist(null);
        }}
        onSuccess={handleModalSuccess}
        playlist={editingPlaylist}
      />
    </div>
  );
};

export default PlaylistList;
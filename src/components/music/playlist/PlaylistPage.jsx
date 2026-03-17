import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../PlayerLayout';
import SongCard from '../songs/SongCard';
import apiClient from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

const PlaylistPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onPlaySong } = usePlayer(); // For playing songs from the playlist
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadPlaylist();
    }
  }, [id]);

  const loadPlaylist = async () => {
    try {
      const response = await apiClient.get(`/playlists/${id}`);
      setPlaylist(response.data);
      
      // Load songs in playlist
      if (response.data.song_ids?.length > 0) {
        const songsResponse = await Promise.all(
          response.data.song_ids.map(songId => 
            apiClient.get(`/songs`).then(res => 
              res.data.find(s => s.id === songId)
            ).catch(() => null)
          )
        );
        setSongs(songsResponse.filter(Boolean));
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load playlist');
      setLoading(false);
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      await apiClient.delete(`/playlists/${id}/songs/${songId}`);
      setSongs(songs.filter(s => s.id !== songId));
      if (playlist) {
        setPlaylist({
          ...playlist,
          song_ids: playlist.song_ids.filter(id => id !== songId)
        });
      }
    } catch (err) {
      console.error('Failed to remove song:', err);
    }
  };

  const handlePlay = (song) => {
    if (onPlaySong) onPlaySong(song);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-spotify-dark-gray to-spotify-black">
          <div className="text-text-secondary animate-pulse">Loading playlist...</div>
        </div>
      </Layout>
    );
  }

  if (error || !playlist) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-spotify-dark-gray to-spotify-black">
          <div className="text-text-primary text-xl font-semibold">{error || 'Playlist not found'}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-spotify-dark-gray to-spotify-black pb-[100px] md:pb-24">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 truncate">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-sm md:text-base text-text-secondary mb-2">{playlist.description}</p>
          )}
          <p className="text-xs md:text-sm text-text-tertiary font-medium">
            {songs.length} {songs.length === 1 ? 'song' : 'songs'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {songs.length === 0 ? (
            <div className="col-span-full text-center text-text-secondary py-12 md:py-16 bg-spotify-light-gray/20 rounded-xl">
              <span className="text-4xl mb-4 block">🎧</span>
              <p>No songs in this playlist yet</p>
            </div>
          ) : (
            songs.map((song) => (
              <div key={song.id} className="relative group">
                <SongCard song={song} onPlay={handlePlay} />
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.id); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  title="Remove from playlist"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlaylistPage;
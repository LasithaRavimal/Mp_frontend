import { useState, useEffect } from 'react';
import Layout from './PlayerLayout';
import SongCard from './songs/SongCard';
import apiClient from '../../api/apiClient';
import { usePlayer } from '../music/context/PlayerContext';
import { MdSearch } from 'react-icons/md';

const SearchPage = () => {
  const { onPlaySong } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredSongs, setFilteredSongs] = useState([]);

  useEffect(() => {
    loadAllSongs();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(songs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = songs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.category?.toLowerCase().includes(query)
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const loadAllSongs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/songs');
      setSongs(response.data || []);
      setFilteredSongs(response.data || []);
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSongPlay = (song) => {
    if (onPlaySong) {
      onPlaySong(song);
    }
  };

  const categories = [...new Set(songs.map(s => s.category).filter(Boolean))];

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-spotify-dark-gray to-spotify-black min-h-screen pb-32">
        {/* Search Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">Search</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-gray text-xl md:text-2xl" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What do you want to play?"
              className="w-full bg-spotify-light-gray px-4 py-3 md:py-4 pl-12 md:pl-14 pr-4 rounded-full text-white text-base md:text-lg placeholder-text-gray focus:outline-none focus:ring-2 focus:ring-spotify-green focus:bg-spotify-gray transition-all"
              autoFocus
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-text-gray text-sm md:text-base">Loading songs...</p>
          </div>
        ) : searchQuery.trim() === '' ? (
          <>
            {/* Browse All Section */}
            <div className="mb-10 md:mb-12">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Browse All</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {songs.slice(0, 20).map((song) => (
                  <SongCard key={song.id} song={song} onPlay={handleSongPlay} />
                ))}
              </div>
              {songs.length > 20 && (
                <p className="text-text-gray text-xs md:text-sm text-center mt-6">
                  Showing first 20 songs. Use search to find more...
                </p>
              )}
            </div>

            {/* Categories Preview */}
            {categories.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Browse by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {categories.slice(0, 8).map((category) => (
                    <div
                      key={category}
                      className="bg-gradient-to-br from-spotify-green to-spotify-green-dark rounded-lg p-4 md:p-6 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <div className="text-white font-bold text-lg md:text-xl truncate">{category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : filteredSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-spotify-gray rounded-full flex items-center justify-center mb-4 md:mb-6">
              <MdSearch className="w-8 h-8 md:w-12 md:h-12 text-text-gray" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">No results found</h3>
            <p className="text-text-gray text-sm md:text-base text-center max-w-md px-4">
              We couldn't find anything matching "{searchQuery}". Try searching with a different term.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
              Results for "{searchQuery}" ({filteredSongs.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filteredSongs.map((song) => (
                <SongCard key={song.id} song={song} onPlay={handleSongPlay} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
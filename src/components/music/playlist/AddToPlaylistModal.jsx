import { useState, useEffect } from "react";
import apiClient from "../../../api/apiClient";
import { MdClose, MdAdd, MdCreateNewFolder } from "react-icons/md";
import { showSuccessToast, showErrorToast } from "../../../utils/notifications";

const AddToPlaylistModal = ({ isOpen, onClose, songId, onSuccess }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  useEffect(() => {
    if (isOpen && songId) {
      loadPlaylists();
    }
  }, [isOpen, songId]);

  const loadPlaylists = async () => {
    try {
      setLoadingPlaylists(true);

      const response = await apiClient.get("/playlists");
      setPlaylists(response.data || []);
    } catch (error) {
      console.error("Failed to load playlists:", error);
      showErrorToast("Failed to load playlists");
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!playlistId) return;

    try {
      setLoadingAdd(true);

      await apiClient.post(`/playlists/${playlistId}/songs`, {
        song_id: songId,
      });

      showSuccessToast("Song added to playlist");

      if (onSuccess) onSuccess();

      onClose();
    } catch (error) {
      console.error("Failed to add song:", error);
      showErrorToast(
        error?.response?.data?.detail || "Failed to add song to playlist"
      );
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();

    if (!newPlaylistName.trim()) {
      showErrorToast("Please enter a playlist name");
      return;
    }

    try {
      setCreatingPlaylist(true);

      const createRes = await apiClient.post("/playlists", {
        name: newPlaylistName.trim(),
        description: null,
      });

      const newPlaylistId = createRes.data.id;

      await apiClient.post(`/playlists/${newPlaylistId}/songs`, {
        song_id: songId,
      });

      showSuccessToast("Playlist created and song added");

      setNewPlaylistName("");
      setShowCreateForm(false);

      await loadPlaylists();

      if (onSuccess) onSuccess();

      onClose();
    } catch (error) {
      console.error("Create playlist failed:", error);
      showErrorToast(
        error?.response?.data?.detail || "Failed to create playlist"
      );
    } finally {
      setCreatingPlaylist(false);
    }
  };

  if (!isOpen || !songId) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add to Playlist</h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Create Playlist */}

        {showCreateForm ? (
          <form onSubmit={handleCreateAndAdd} className="mb-6">
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full bg-gray-800 px-4 py-2 rounded text-white mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName("");
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creatingPlaylist}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded disabled:opacity-50"
              >
                {creatingPlaylist ? "Creating..." : "Create & Add"}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full mb-6 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded"
          >
            <MdCreateNewFolder size={20} />
            Create Playlist
          </button>
        )}

        {/* Playlist List */}

        <div className="max-h-80 overflow-y-auto space-y-2">

          {loadingPlaylists ? (
            <div className="text-center text-gray-400 py-6">
              Loading playlists...
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              No playlists yet
            </div>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
                disabled={loadingAdd}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 rounded flex justify-between items-center"
              >
                <div className="text-left">
                  <div className="font-semibold">{playlist.name}</div>

                  <div className="text-xs text-gray-400">
                    {playlist.song_ids?.length || 0} songs
                  </div>
                </div>

                <MdAdd className="text-green-400" size={20} />
              </button>
            ))
          )}

        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
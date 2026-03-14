import { useState, useEffect } from "react";
import apiClient from "../../../api/apiClient";
import { SONG_CATEGORIES } from "./constants/categories";

const SongEditModal = ({ song, onClose, onSave }) => {

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (song) {
      setTitle(song.title || "");
      setArtist(song.artist || "");
      setCategory(song.category || "");
      setDescription(song.description || "");
      setIsActive(song.is_active ?? true);
    }
  }, [song]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !artist || !category) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {

      await apiClient.put(`/songs/${song.id}`, {
        title,
        artist,
        category,
        description: description || null,
        is_active: isActive
      });

      onSave?.();
      onClose();

    } catch (err) {

      setError(err.response?.data?.detail || "Failed to update song");

    } finally {
      setLoading(false);
    }
  };

  if (!song) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <div className="bg-card-bg rounded-lg p-6 max-w-md w-full shadow-elevated">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">Edit Song</h2>

          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            placeholder="Song Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-light w-full px-4 py-2 rounded-lg"
            required
          />

          {/* Artist */}
          <input
            type="text"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="input-light w-full px-4 py-2 rounded-lg"
            required
          />

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-light w-full px-4 py-2 rounded-lg"
            required
          >
            <option value="">Select Category</option>

            {SONG_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}

          </select>

          {/* Description */}
          <textarea
            rows={3}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-light w-full px-4 py-2 rounded-lg"
          />

          {/* Active toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Visible to users
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded-lg px-4 py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 px-4 py-2 rounded-lg"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default SongEditModal;
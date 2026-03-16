export const getThumbnailUrl = (url) => {
  if (!url) return null;

  if (url.startsWith("http")) {
    return url;
  }

  const backend =
    import.meta.env.VITE_BACKEND_URL ||
    "https://music-player-col8.onrender.com";

  return `${backend}${url}`;
};
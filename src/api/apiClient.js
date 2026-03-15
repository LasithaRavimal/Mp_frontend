import axios from "axios";

/* =========================
   AXIOS INSTANCE
========================= */

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://music-player-col8.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

/* =========================
   REQUEST INTERCEPTOR
========================= */

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized. Logging out user.");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
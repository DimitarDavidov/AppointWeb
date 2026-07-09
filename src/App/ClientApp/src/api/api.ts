import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const api = axios.create({
  baseURL: configuredApiUrl || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

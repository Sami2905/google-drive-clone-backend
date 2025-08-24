import axios from 'axios';
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const authStore = useAuthStore.getState();
      try {
        const refreshed = await authStore.refreshToken();
        if (refreshed) {
          originalRequest.headers.Authorization = `Bearer ${authStore.token}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed
      }
    }

    return Promise.reject(error);
  }
);

export default api;

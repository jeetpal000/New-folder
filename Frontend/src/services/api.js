import axios from "axios";

export const api = axios.create({
  baseURL:
    import.meta.env.PROD
      ? "/api/v1"
      : import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    const authEndpoints = [
      "/login",
      "/organisations/login",
      "/refresh-token",
      "/organisations/refresh",
      "/logout",
    ];

    // Access token expire
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !authEndpoints.some((endpoint) => requestUrl.includes(endpoint))
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        await api.post("/refresh-token");

        processQueue();

        // Original request dobara
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError);

        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

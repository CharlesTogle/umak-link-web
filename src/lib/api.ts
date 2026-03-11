import axios from "axios";
import { getStoredToken } from "@/lib/token-storage";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 20000, // 20 seconds for login and other operations
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" && error.message?.includes("timeout")) {
      error.message = "Request timeout exceeded (20s). Please check your connection and try again.";
    }
    return Promise.reject(error);
  }
);

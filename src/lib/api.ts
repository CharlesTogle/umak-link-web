import axios from "axios";
import { supabase } from "@/lib/supabase";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 0, // No timeout - let requests complete naturally
  withCredentials: true, // Required for CORS with credentials
});

api.interceptors.request.use(async (config) => {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const token = session?.access_token;

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
      error.message = "Request timeout. Please check your connection and try again.";
    }
    return Promise.reject(error);
  }
);

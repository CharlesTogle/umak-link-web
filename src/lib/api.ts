import axios from "axios";
import { supabase } from "@/lib/supabase";

function resolveApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredBaseUrl) return configuredBaseUrl;

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8080";
  }

  throw new Error("NEXT_PUBLIC_API_URL must be set in production");
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 8000),
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const token = session?.access_token ?? null;

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
      error.message =
        "Request timed out. Please check your internet connection and try again.";
    }
    return Promise.reject(error);
  }
);

"use client";

import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getRemainingLoginCooldownMs, registerLoginAttempt } from "@/lib/login-rate-limit";
import { getSupabaseClient } from "@/lib/supabase";

type LoginStatus = "idle" | "loading" | "error";

function getOAuthRedirectUrl(): string {
  return new URL("/auth/callback", window.location.origin).toString();
}

export default function GoogleLoginButton() {
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleButtonClick = async () => {
    const remainingCooldownMs = getRemainingLoginCooldownMs();
    if (remainingCooldownMs > 0) {
      const remainingSeconds = Math.ceil(remainingCooldownMs / 1000);
      setStatus("error");
      setError(
        `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"} before trying again.`
      );
      return;
    }

    registerLoginAttempt();
    setStatus("loading");
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getOAuthRedirectUrl(),
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      const message = getApiErrorMessage(err, {
        context: "auth",
        fallback: "Unable to start sign in. Please try again.",
      });
      setStatus("error");
      setError(message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => {
          void handleButtonClick();
        }}
        disabled={status === "loading"}
        className="inline-flex min-w-[260px] items-center justify-center rounded-full bg-[#1D2981] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16206a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Signing in..." : "Sign In With UMak Email"}
      </button>
      {status === "loading" && (
        <p className="text-xs text-slate-500">Redirecting you to Google...</p>
      )}
      {status === "error" && error && (
        <p className="text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}

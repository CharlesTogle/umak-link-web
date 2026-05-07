"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleHomePathFromUserType } from "@/lib/role-routing";
import { getRemainingLoginCooldownMs, registerLoginAttempt } from "@/lib/login-rate-limit";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { fetchCurrentUser, syncProfilePictureFromGoogle } from "@/services/auth-service";
import type { AuthUser } from "@/types/auth";

type LoginStatus = "idle" | "loading" | "success" | "error";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function decodeGoogleCredentialPayload(credential: string): Record<string, unknown> | null {
  const payloadPart = credential.split(".")[1];
  if (!payloadPart) return null;

  try {
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const parsed = JSON.parse(window.atob(padded)) as unknown;

    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

export default function GoogleLoginButton() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleButtonClick = () => {
    if (!clientId) {
      setStatus("error");
      setError("Missing `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.");
      return;
    }

    const renderedButton = buttonRef.current?.querySelector<HTMLElement>(
      'div[role="button"], button'
    );

    if (!renderedButton) {
      setStatus("error");
      setError("Google Sign-In is still loading. Please try again.");
      return;
    }

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
    setError(null);
    renderedButton.click();
  };

  const handleCredential = useCallback(async (credential?: string) => {
    if (!credential) {
      setStatus("error");
      setError("Missing Google credential.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const payload = decodeGoogleCredentialPayload(credential);
      const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : null;
      if (!email?.endsWith("@umak.edu.ph")) {
        throw new Error(
          "Sign in failed. Please make sure to use your UMAK Google Account and try again"
        );
      }

      const supabase = getSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
      });

      if (signInError) {
        throw signInError;
      }

      let currentUser: AuthUser | null = null;

      try {
        currentUser = await syncProfilePictureFromGoogle(credential);
      } catch {
        currentUser = null;
      }

      currentUser ??= await fetchCurrentUser();
      const nextPath = getRoleHomePathFromUserType(currentUser?.user_type);

      if (!currentUser || !nextPath) {
        setStatus("error");
        setError("Unauthorized account.");
        clearSession();
        return;
      }

      if (currentUser.user_type === "User") {
        clearSession();
        setStatus("success");
        router.replace(nextPath);
        return;
      }

      setAuthenticatedUser(currentUser);
      setStatus("success");
      router.replace(nextPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setStatus("error");
      setError(message);
    }
  }, [clearSession, router, setAuthenticatedUser]);

  const initGoogleButton = useCallback(() => {
    if (!clientId || !buttonRef.current || initializedRef.current) return;

    const google = (window as Window & {
      google?: {
        accounts?: {
          id?: {
            initialize?: (config: {
              client_id: string;
              callback: (response: { credential?: string }) => void;
              ux_mode?: "popup" | "redirect";
            }) => void;
            renderButton?: (
              parent: HTMLElement,
              options: {
                theme?: "outline" | "filled_blue" | "filled_black";
                size?: "large" | "medium" | "small";
                shape?: "rectangular" | "pill" | "circle" | "square";
                text?: "signin_with" | "signup_with" | "continue_with" | "signin";
                logo_alignment?: "left" | "center";
                width?: number;
              }
            ) => void;
          };
        };
      };
    }).google;

    if (!google?.accounts?.id?.initialize || !google.accounts.id.renderButton) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => handleCredential(response.credential),
      ux_mode: "popup",
    });

    google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signin_with",
      logo_alignment: "left",
    });

    initializedRef.current = true;
  }, [handleCredential]);

  useEffect(() => {
    initGoogleButton();
  }, [initGoogleButton]);

  return (
    <div className="flex flex-col items-center gap-2">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initGoogleButton} />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={status === "loading" || !clientId}
        className="inline-flex min-w-[260px] items-center justify-center rounded-full bg-[#1D2981] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16206a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Signing in..." : "Sign In With UMak Email"}
      </button>
      <div ref={buttonRef} className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true" />
      {status === "loading" && (
        <p className="text-xs text-slate-500">Signing you in...</p>
      )}
      {status === "success" && (
        <p className="text-xs text-emerald-600">Signed in successfully.</p>
      )}
      {status === "error" && error && (
        <p className="text-xs text-rose-600">{error}</p>
      )}
      {!clientId && (
        <p className="text-xs text-rose-600">
          Missing `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
        </p>
      )}
    </div>
  );
}

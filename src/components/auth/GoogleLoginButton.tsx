"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getRoleHomePathFromUserType } from "@/lib/role-routing";
import { setStoredToken } from "@/lib/token-storage";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthUser } from "@/types/auth";

type LoginStatus = "idle" | "loading" | "success" | "error";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleCredential = useCallback(async (credential?: string) => {
    if (!credential) {
      setStatus("error");
      setError("Missing Google credential.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await api.post("/auth/google", {
        googleIdToken: credential,
      });

      const token = response.data?.token as string | undefined;
      if (!token) {
        throw new Error("No token returned from server.");
      }

      const currentUser = response.data?.user as AuthUser | undefined;
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

      setStoredToken(token, currentUser.user_type);
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
      <div ref={buttonRef} />
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

"use client";

import Script from "next/script";
import { RefreshCw } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function UpdatePictureFromGoogleButton() {
  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const handleCredential = useCallback(async (credential?: string) => {
    if (!credential) {
      setMessage({ type: "error", text: "Failed to get Google credentials" });
      return;
    }

    setIsUpdating(true);
    setMessage(null);

    try {
      const response = await api.post("/auth/update-picture-from-google", {
        googleIdToken: credential,
      });

      if (response.data?.user) {
        setAuthenticatedUser(response.data.user);
        setMessage({ type: "success", text: "Profile picture updated successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to update profile picture" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Update failed";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  }, [setAuthenticatedUser]);

  const initGoogleButton = useCallback(() => {
    if (!clientId || !googleButtonRef.current || initializedRef.current) return;

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

    google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "medium",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
    });

    initializedRef.current = true;
  }, [handleCredential]);

  return (
    <div className="flex flex-col gap-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleButton}
      />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          Update Profile Picture
        </p>
        <div ref={googleButtonRef} className="flex justify-start" />

        {isUpdating && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <RefreshCw className="size-3 animate-spin" />
            Updating profile picture...
          </div>
        )}

        {message && (
          <p className={`text-xs ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
            {message.text}
          </p>
        )}
      </div>

      {!clientId && (
        <p className="text-xs text-rose-600">
          Missing `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
        </p>
      )}
    </div>
  );
}

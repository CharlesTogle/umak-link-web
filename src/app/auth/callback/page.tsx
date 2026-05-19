"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getSupabaseClient } from "@/lib/supabase";

function AuthCallbackShell({ error }: { error: string | null }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-8 text-center shadow-xl">
        <p className="text-sm font-semibold tracking-[0.03em] text-slate-500" aria-label="UMak-LINK Web">
          UM<span className="lowercase">ak</span>-LINK Web
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {error ? "Sign-In Could Not Continue" : "Completing Sign-In"}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {error ?? "Please wait while we finish your sign-in and return you to the portal."}
        </p>
      </section>
    </main>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const completeSignIn = async () => {
      const providerError = searchParams.get("error_description") ?? searchParams.get("error");
      if (providerError) {
        if (!isCancelled) {
          setError(providerError);
        }
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.replace("/");
          return;
        }

        const code = searchParams.get("code");
        if (!code) {
          if (!isCancelled) {
            setError("Missing sign-in response. Please try again.");
          }
          return;
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          throw exchangeError;
        }

        router.replace("/");
      } catch (err) {
        if (!isCancelled) {
          setError(
            getApiErrorMessage(err, {
              context: "auth",
              fallback: "Unable to complete sign in. Please try again.",
            })
          );
        }
      }
    };

    void completeSignIn();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams]);

  return (
    <>
      <AuthCallbackShell error={error} />
      {error && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center px-4">
          <div className="pointer-events-auto mt-56 flex justify-center">
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="inline-flex min-w-[260px] items-center justify-center rounded-full bg-[#1D2981] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16206a]"
            >
              Sign In With UMak Email
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackShell error={null} />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

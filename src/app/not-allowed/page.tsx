"use client";

import { useRouter } from "next/navigation";

export default function NotAllowedPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-8 text-center shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">UMak LINK Web</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Access Not Allowed</h1>
        <p className="mt-3 text-sm text-slate-600">
          Your account no longer has access to this role-specific page.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="inline-flex items-center justify-center rounded-lg bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#111d6d]"
          >
            Go to login page
          </button>
        </div>
      </section>
    </main>
  );
}

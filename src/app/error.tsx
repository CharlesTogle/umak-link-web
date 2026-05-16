"use client";

export default function GlobalError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eaf1f4] px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1D2981]">
          Error
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Action didn&apos;t succeed, please try again later.
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          An unexpected problem interrupted this page.
        </p>
      </div>
    </main>
  );
}

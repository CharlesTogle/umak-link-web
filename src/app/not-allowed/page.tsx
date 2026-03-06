import Link from "next/link";

export default function NotAllowedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-8 text-center shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">UMak LINK Web</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Access Not Allowed</h1>
        <p className="mt-3 text-sm text-slate-600">
          Your account does not have access to the Admin and Staff portal.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-[#1D2981] px-4 py-2 text-sm font-medium text-white hover:bg-[#111d6d]"
        >
          Back to Login
        </Link>
      </section>
    </main>
  );
}

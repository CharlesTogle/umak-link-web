import Image from "next/image";
import GoogleLoginButton from "@/components/auth/google-login-button";
import { HomeAuthRedirect } from "@/components/auth/home-auth-redirect";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, ShieldCheck, UserCog, BellRing } from "lucide-react";

const modules = [
  { title: "Post Moderation", icon: ClipboardCheck },
  { title: "Fraud Reports", icon: ShieldCheck },
  { title: "Role Management", icon: UserCog },
  { title: "Alerts", icon: BellRing },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-slate-950">
      <HomeAuthRedirect />

      <section className="absolute inset-0">
        <Image
          src="/images/umak-admin-building.jpg"
          alt="University of Makati admin building"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C102C]/85 via-[#101B5B]/70 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_45%),radial-gradient(circle_at_85%_12%,rgba(255,255,255,0.12),transparent_40%)]" />
      </section>

      <section className="relative z-10 flex min-h-screen items-center px-4 py-16 md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <Card className="overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/90 shadow-[0_30px_80px_-40px_rgba(3,7,32,0.8)] backdrop-blur">
            <CardHeader className="space-y-4 px-6 pb-6 pt-8 text-center md:px-10">
              <Badge className="mx-auto w-fit bg-[#1D2981] text-white">UMak-LINK Web</Badge>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-[#101B5B] md:text-5xl">
                Admin and Staff Portal
              </CardTitle>
              <p className="mx-auto max-w-2xl text-sm text-slate-700 md:text-base">
                A web control center for approvals, fraud handling, role management, and campus-wide
                notifications.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <GoogleLoginButton />
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 bg-slate-50 px-6 pb-8 pt-2 sm:grid-cols-2 lg:grid-cols-4 md:px-10">
              {modules.map((module) => (
                <div
                  key={module.title}
                  className="group rounded-2xl border border-[#1D2981]/10 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex rounded-xl bg-[#1D2981]/10 p-2 text-[#1D2981] transition-colors duration-300 group-hover:bg-[#1D2981] group-hover:text-white">
                    <module.icon className="size-5" />
                  </div>
                  <p className="font-semibold text-slate-900">{module.title}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

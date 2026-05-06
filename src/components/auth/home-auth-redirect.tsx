"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getRoleHomePath } from "@/lib/role-routing";

export function HomeAuthRedirect() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading || !user) return;

    router.replace(getRoleHomePath(user.user_type));
  }, [isLoading, router, user]);

  if (!isLoading && !user) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm">
      <div className="animate-pulse">
        <Image
          src="/images/umak-ohso.svg"
          alt="UMak OHSO"
          width={120}
          height={120}
          priority
        />
      </div>
    </div>
  );
}

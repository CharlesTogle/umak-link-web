"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { PortalUserType } from "@/types/auth";

interface RoleRouteGuardProps {
  allowedRoles: PortalUserType[];
  children: ReactNode;
}

export function RoleRouteGuard({ allowedRoles, children }: RoleRouteGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    if (!allowedRoles.includes(user.user_type)) {
      router.replace("/not-allowed");
    }
  }, [allowedRoles, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
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

  if (!user || !allowedRoles.includes(user.user_type)) {
    return null;
  }

  return <>{children}</>;
}

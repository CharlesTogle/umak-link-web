import type { ReactNode } from "react";
import { redirect } from "next/navigation";

export default function GuardLayout({ children }: { children: ReactNode }) {
  void children;
  redirect("/not-allowed");
}

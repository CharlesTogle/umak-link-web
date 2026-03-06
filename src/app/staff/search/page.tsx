import { Suspense } from "react";
import { StaffSearchView } from "@/components/staff/staff-search-view";

export default function StaffSearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading search...</div>}>
      <StaffSearchView />
    </Suspense>
  );
}

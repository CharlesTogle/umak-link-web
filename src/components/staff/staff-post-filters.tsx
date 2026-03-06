"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type FilterOption = {
  key: "postStatus" | "itemStatus" | "itemType";
  label: string;
  value: string;
};

const filterGroups: Array<{ label: string; key: FilterOption["key"]; options: FilterOption[] }> = [
  {
    label: "Post Status",
    key: "postStatus",
    options: [
      { key: "postStatus", label: "Pending", value: "Pending" },
      { key: "postStatus", label: "Accepted", value: "Accepted" },
      { key: "postStatus", label: "Rejected", value: "Rejected" },
    ],
  },
  {
    label: "Item Status",
    key: "itemStatus",
    options: [
      { key: "itemStatus", label: "Claimed", value: "Claimed" },
      { key: "itemStatus", label: "Unclaimed", value: "Unclaimed" },
      { key: "itemStatus", label: "Lost", value: "Lost" },
      { key: "itemStatus", label: "Returned", value: "Returned" },
    ],
  },
  {
    label: "Item Type",
    key: "itemType",
    options: [
      { key: "itemType", label: "Missing", value: "missing" },
      { key: "itemType", label: "Found", value: "found" },
    ],
  },
];

export function StaffPostFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedValues = {
    postStatus: searchParams.get("postStatus") ?? "",
    itemStatus: searchParams.get("itemStatus") ?? "",
    itemType: searchParams.get("itemType") ?? "",
  };

  const hasAnyFilter =
    selectedValues.postStatus.length > 0 ||
    selectedValues.itemStatus.length > 0 ||
    selectedValues.itemType.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#1D2981]">Filters</p>
        <Link
          href={pathname}
          className={cn(
            "text-xs",
            hasAnyFilter ? "text-[#1D2981] hover:underline" : "pointer-events-none text-slate-400"
          )}
        >
          Clear all
        </Link>
      </div>

      <div className="space-y-3">
        {filterGroups.map((group) => (
          <section key={group.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const query = new URLSearchParams(searchParams.toString());
                const isActive = selectedValues[option.key] === option.value;

                if (isActive) query.delete(option.key);
                else query.set(option.key, option.value);

                const href = query.toString() ? `${pathname}?${query.toString()}` : pathname;

                return (
                  <Link
                    key={`${option.key}-${option.value}`}
                    href={href}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      isActive
                        ? "border-[#1D2981]/20 bg-[#1D2981]/10 font-medium text-[#1D2981]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

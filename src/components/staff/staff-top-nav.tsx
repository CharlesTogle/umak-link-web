"use client";

import { Bell, CheckCheck, ChevronDown } from "lucide-react";
import { useState } from "react";

export function StaffTopNav() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="relative mb-4 flex items-center justify-end gap-3">
      <button
        className="relative rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 shadow-sm hover:bg-slate-50"
        onClick={() => {
          setShowNotifications((v) => !v);
          setShowProfile(false);
        }}
      >
        <Bell className="size-4" />
        <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-[#4db8e5] text-[10px] text-white">
          4
        </span>
      </button>

      <button
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
        onClick={() => {
          setShowProfile((v) => !v);
          setShowNotifications(false);
        }}
      >
        <span className="size-7 rounded-full bg-slate-200" />
        <span>Robert Dorwart</span>
        <ChevronDown className="size-4" />
      </button>

      {showNotifications ? (
        <div className="absolute right-52 top-12 z-20 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-slate-900">Notifications</p>
            <button className="flex items-center gap-1 text-xs text-[#4db8e5]">
              <CheckCheck className="size-3" /> Mark all as read
            </button>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p>Mark Edwards mentioned you in #warehouse.</p>
            <p>SAP Data Lake connection successfully connected.</p>
          </div>
          <button className="mt-4 w-full rounded-lg bg-[#67c4ea] px-3 py-2 text-sm font-medium text-white">
            Show all
          </button>
        </div>
      ) : null}

      {showProfile ? (
        <div className="absolute right-0 top-12 z-20 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {["My Organization", "My Profile", "Log Out"].map((item) => (
            <button
              key={item}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

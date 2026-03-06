import { create } from "zustand";

type PortalRole = "admin" | "staff";

type PortalStore = {
  activeRole: PortalRole;
  setActiveRole: (role: PortalRole) => void;
};

export const usePortalStore = create<PortalStore>((set) => ({
  activeRole: "admin",
  setActiveRole: (role) => set({ activeRole: role }),
}));


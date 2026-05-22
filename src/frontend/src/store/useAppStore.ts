import type { ClientStatus } from "@/types";
import { create } from "zustand";

interface AppState {
  activeClientId: string | null;
  clientStatuses: ClientStatus[];
  campaignProgress: Record<string, number>;
  setActiveClientId: (id: string | null) => void;
  setClientStatuses: (statuses: ClientStatus[]) => void;
  updateClientStatus: (status: ClientStatus) => void;
  setCampaignProgress: (campaignId: string, progress: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeClientId: null,
  clientStatuses: [],
  campaignProgress: {},
  setActiveClientId: (id) => set({ activeClientId: id }),
  setClientStatuses: (statuses) => set({ clientStatuses: statuses }),
  updateClientStatus: (status) =>
    set((state) => ({
      clientStatuses: state.clientStatuses.map((s) =>
        s.clientId === status.clientId ? status : s,
      ),
    })),
  setCampaignProgress: (campaignId, progress) =>
    set((state) => ({
      campaignProgress: { ...state.campaignProgress, [campaignId]: progress },
    })),
}));

// stores/team-store.ts
import { create } from "zustand";
import type { WorkspaceTeam } from "@/lib/services/team";

interface TeamStore {
  newlyCreatedTeam: WorkspaceTeam | null;
  triggerTeamCreated: (team: WorkspaceTeam) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  newlyCreatedTeam: null,
  triggerTeamCreated: (team) => set({ newlyCreatedTeam: team }),
}));

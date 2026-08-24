// components/team/create-team-button.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamModal } from "./modals/team-modal";

export function CreateTeamButton() {
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setTeamModalOpen(true)}
        size="sm"
        className="w-full sm:w-auto h-9 px-4 bg-teal-700 text-white hover:bg-teal-800 text-xs sm:text-sm font-medium rounded-xl shadow-2xs gap-2 cursor-pointer"
      >
        <Plus size={16} />
        Create Team
      </Button>

      <TeamModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        team={null}
      />
    </>
  );
}

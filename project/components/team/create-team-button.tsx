// components/team/create-team-button.tsx
"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { TeamModal } from "./modals/team-modal"

export function CreateTeamButton() {
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const router = useRouter()
  const prevOpenRef = useRef(teamModalOpen)

  useEffect(() => {
    // If modal was open and is now closed, refresh to sync newly created teams
    if (prevOpenRef.current && !teamModalOpen) {
      router.refresh()
    }
    prevOpenRef.current = teamModalOpen
  }, [teamModalOpen, router])

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
  )
}

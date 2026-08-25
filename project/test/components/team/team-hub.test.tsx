import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { TeamHub } from "@/components/team/team-hub"

// Mock server actions
jest.mock("@/lib/actions/team", () => ({
  getTeamMembers: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        userId: "user-1",
        userName: "Alice Smith",
        userEmail: "alice@example.com",
      },
    ],
  }),
}))

// Mock store
jest.mock("@/stores/team-store", () => ({
  useTeamStore: (selector: any) => selector({ newlyCreatedTeam: null }),
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}))

jest.mock("@/components/ui/user-avatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}))

jest.mock("@/components/team/team-card", () => ({
  TeamCard: ({ team }: { team: any }) => (
    <div data-testid={`team-card-${team.id}`}>{team.name}</div>
  ),
}))

describe("TeamHub", () => {
  const mockInitialHub = {
    yourTeams: [
      {
        id: "team-1",
        name: "Alpha Squad",
        createdBy: "user-owner",
        memberCount: 2,
      },
    ],
    teamsYouBelongTo: [
      {
        id: "team-2",
        name: "Beta Squad",
        createdBy: "user-other",
        memberCount: 3,
      },
    ],
    workspaceMembers: [
      {
        id: "user-owner",
        name: "Workspace Owner",
        email: "owner@example.com",
        isProjectMember: true,
        isTeamMember: true,
      },
    ],
    projects: [{ id: "proj-1", name: "Project Alpha" }],
  }

  it("renders workspace hub sections: Your Teams, Teams You Belong To, and Workspace Members", async () => {
    await act(async () => {
      render(
        <TeamHub
          initialHub={mockInitialHub as any}
          currentUserId="user-owner"
        />,
      )
    })

    await waitFor(() => {
      expect(screen.getByText("Your Teams")).toBeInTheDocument()
      expect(screen.getByText("Alpha Squad")).toBeInTheDocument()
      expect(screen.getByText("Teams You Belong To")).toBeInTheDocument()
      expect(screen.getByText("Beta Squad")).toBeInTheDocument()
      expect(screen.getByText("Workspace Members")).toBeInTheDocument()
      expect(screen.getByText("Workspace Owner")).toBeInTheDocument()
    })
  })

  it("filters workspace members correctly via search query input", async () => {
    await act(async () => {
      render(
        <TeamHub
          initialHub={mockInitialHub as any}
          currentUserId="user-owner"
        />,
      )
    })

    const searchInput = screen.getByPlaceholderText("Search members...")
    fireEvent.change(searchInput, { target: { value: "NonExistent" } })

    await waitFor(() => {
      expect(
        screen.getByText("No workspace members found matching your filters."),
      ).toBeInTheDocument()
    })
  })
})

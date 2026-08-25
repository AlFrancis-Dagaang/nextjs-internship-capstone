import { render, screen } from "@testing-library/react"
import { TeamsTab } from "@/components/settings/teams-tab"

jest.mock("@/lib/actions/team", () => ({
  createTeam: jest.fn(),
  updateTeam: jest.fn(),
  deleteTeam: jest.fn(),
  getTeamMembers: jest.fn().mockResolvedValue({ success: true, data: [] }),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock("@/components/ui/user-avatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}))

describe("TeamsTab", () => {
  const mockTeams = [
    {
      id: "team-1",
      name: "Cloud Club Haribon",
      createdBy: "user-1",
      createdAt: new Date(),
    },
  ]

  it("renders user teams correctly and reuses team CRUD actions", () => {
    render(<TeamsTab initialTeams={mockTeams} currentUserId="user-1" />)

    expect(screen.getByText("Teams & Organizations")).toBeInTheDocument()
    expect(screen.getByText("Cloud Club Haribon")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Create Team/i }),
    ).toBeInTheDocument()
  })
})

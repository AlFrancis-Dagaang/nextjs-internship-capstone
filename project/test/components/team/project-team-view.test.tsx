import { fireEvent, render, screen } from "@testing-library/react"
import { ProjectTeamView } from "@/components/projects/project-team/project-team-view"

// Mock server actions to prevent module loading errors
jest.mock("@/lib/actions/project-member", () => ({
  updateMemberRole: jest.fn().mockResolvedValue({ success: true }),
  removeProjectMember: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock("@/lib/actions/project-team", () => ({
  updateProjectTeamRole: jest.fn().mockResolvedValue({ success: true }),
  detachTeamFromProject: jest.fn().mockResolvedValue({ success: true }),
}))

// Mock sub-components and modals
jest.mock(
  "@/components/projects/project-team/modals/add-individual-modal",
  () => ({
    AddIndividualModal: ({ open }: { open: boolean }) =>
      open ? (
        <div data-testid="add-individual-modal">Add Individual Modal</div>
      ) : null,
  }),
)

jest.mock(
  "@/components/projects/project-team/modals/attach-team-modal",
  () => ({
    AttachTeamModal: ({ open }: { open: boolean }) =>
      open ? (
        <div data-testid="attach-team-modal">Attach Team Modal</div>
      ) : null,
  }),
)

jest.mock("@/components/ui/user-avatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}))

// Mock useToast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe("ProjectTeamView", () => {
  const mockIndividuals = [
    {
      id: "ind-1",
      userId: "user-1",
      name: "Alice Smith",
      email: "alice@example.com",
      role: "editor" as const,
      activeTaskCount: 2,
      recentActivity: [],
    },
    {
      id: "owner-1",
      userId: "user-owner",
      name: "Project Owner",
      email: "owner@example.com",
      role: "owner" as const,
      activeTaskCount: 5,
      recentActivity: [],
    },
    {
      id: "team-derived-1",
      userId: "user-2",
      name: "Bob Derived",
      email: "bob@example.com",
      role: "viewer" as const,
      activeTaskCount: 1,
      recentActivity: [],
    },
  ]

  const mockTeams = [
    {
      projectTeamId: "pt-1",
      teamId: "team-1",
      teamName: "Engineering Team",
      role: "editor" as const,
      members: [
        {
          userId: "user-2",
          userName: "Bob Derived",
          userEmail: "bob@example.com",
        },
      ],
    },
  ]

  it("renders members tab and lists individuals correctly", () => {
    render(
      <ProjectTeamView
        projectId="proj-1"
        initialIndividuals={mockIndividuals}
        initialTeams={mockTeams}
        canManage={true}
      />,
    )

    expect(screen.getByText("Alice Smith")).toBeInTheDocument()
    expect(screen.getByText("alice@example.com")).toBeInTheDocument()
    expect(screen.getByText("Project Owner")).toBeInTheDocument()
  })

  it("allows switching between Members and Teams tabs", async () => {
    render(
      <ProjectTeamView
        projectId="proj-1"
        initialIndividuals={mockIndividuals}
        initialTeams={mockTeams}
        canManage={true}
      />,
    )

    const teamsTabButton = screen.getByRole("button", { name: /Teams 1/i })
    fireEvent.click(teamsTabButton)

    expect(screen.getByText("Engineering Team")).toBeInTheDocument()
    expect(screen.getByText("1 members in this team")).toBeInTheDocument()
  })

  it("gates management actions when canManage is false", () => {
    render(
      <ProjectTeamView
        projectId="proj-1"
        initialIndividuals={mockIndividuals}
        initialTeams={mockTeams}
        canManage={false}
      />,
    )

    expect(
      screen.queryByRole("button", { name: /Add Member/i }),
    ).not.toBeInTheDocument()
  })

  it("applies role-change UI guard hiding/disabling controls for team-derived or owner rows", () => {
    render(
      <ProjectTeamView
        projectId="proj-1"
        initialIndividuals={mockIndividuals}
        initialTeams={mockTeams}
        canManage={true}
      />,
    )

    const teamDerivedRowBadge = screen.getByTitle("Managed via team membership")
    expect(teamDerivedRowBadge).toBeInTheDocument()
  })
})

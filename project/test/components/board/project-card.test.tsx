import { fireEvent, render, screen } from "@testing-library/react"
import { ProjectCard } from "@/components/projects/project-card"

// Mock server actions to prevent Clerk ES module loading issues in Jest
jest.mock("@/lib/actions/projects", () => ({
  updateProject: jest.fn(),
}))

// Mock store and hooks
jest.mock("@/stores/project-store", () => ({
  useProjectStore: () => jest.fn(),
}))

jest.mock("@/hooks/use-inline-rename", () => ({
  useInlineRename: () => ({
    isRenaming: false,
    setIsRenaming: jest.fn(),
    name: "Test Project",
    setName: jest.fn(),
    isPending: false,
    handleSubmit: jest.fn(),
    handleCancel: jest.fn(),
  }),
}))

// Mock sub-components that might require complex context/providers
jest.mock("@/components/projects/project-list-action", () => ({
  ProjectListAction: ({ onViewDetails }: { onViewDetails: () => void }) => (
    <button onClick={onViewDetails} data-testid="project-list-action">
      Actions
    </button>
  ),
}))

jest.mock("@/components/projects/modals/project-detail-modal", () => ({
  ProjectDetailModal: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="project-detail-modal">Detail Modal Open</div>
    ) : null,
}))

jest.mock("@/components/projects/project-member-stack", () => ({
  ProjectMemberStack: () => <div data-testid="member-stack" />,
}))

jest.mock("@/components/ui/user-avatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}))

describe("ProjectCard", () => {
  const mockProject = {
    id: "proj-1",
    name: "Alpha Project",
    description: "Building a SaaS application",
    ownerId: "user-owner",
    dueDate: "2026-12-31T00:00:00.000Z",
  } as any

  const mockCompletion = {
    total: 10,
    completed: 5,
  }

  it("renders name, completion %, and owner correctly", () => {
    render(
      <ProjectCard
        project={mockProject}
        currentUserId="user-owner"
        initialMembers={[]}
        ownerName="Jane Doe"
        myRole="admin"
        completion={mockCompletion}
      />,
    )

    // Check project name rendering
    expect(screen.getByText("Alpha Project")).toBeInTheDocument()

    // Check completion percentage (5/10 = 50%)
    expect(screen.getByText("50% completed")).toBeInTheDocument()
    expect(screen.getByText("Tasks (10)")).toBeInTheDocument()

    // Check owner display (isOwner is true for currentUserId === ownerId)
    expect(screen.getByText("Owner:")).toBeInTheDocument()
    expect(screen.getByText("You")).toBeInTheDocument()
  })

  it("opens delete-confirm AlertDialog / details when action trigger is clicked", () => {
    render(
      <ProjectCard
        project={mockProject}
        currentUserId="user-owner"
        initialMembers={[]}
        ownerName="Jane Doe"
        myRole="admin"
        completion={mockCompletion}
      />,
    )

    const actionButton = screen.getByTestId("project-list-action")
    expect(actionButton).toBeInTheDocument()

    fireEvent.click(actionButton)

    // Verify modal interaction / state change handled through action trigger
    expect(screen.getByTestId("project-detail-modal")).toBeInTheDocument()
  })
})

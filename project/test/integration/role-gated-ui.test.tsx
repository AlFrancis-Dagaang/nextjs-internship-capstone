import React from "react";
import { render, screen } from "@testing-library/react";
import { TaskActions } from "@/components/tasks/modal/task-actions";

// Mock Radix DropdownMenu to render children directly without needing open/click state machine in JSDOM
jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    onSelect,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    onSelect?: (e: any) => void;
  }) => (
    <div
      onClick={(e) => {
        onClick?.();
        onSelect?.(e);
      }}
    >
      {children}
    </div>
  ),
}));

// Mock server actions to prevent database / TextDecoder dependencies
jest.mock("@/lib/actions/tasks", () => ({
  deleteTask: jest.fn(),
  updateTask: jest.fn(),
  toggleTaskComplete: jest.fn(),
  archiveTask: jest.fn(),
}));

jest.mock("@/lib/actions/task-assignees", () => ({
  getTaskAssignees: jest.fn().mockResolvedValue({ success: true, data: [] }),
  assignUserToTask: jest.fn(),
}));

jest.mock("@/lib/actions/project-member", () => ({
  getAssignableUsers: jest.fn().mockResolvedValue({ success: true, data: [] }),
}));

// Mock board store
jest.mock("@/stores/board-store", () => ({
  useBoardStore: (selector: any) =>
    selector({
      applyOptimisticMove: jest.fn(),
      revertMoveSnapshot: jest.fn(),
      archiveTaskLocally: jest.fn(),
      revertArchiveSnapshot: jest.fn(),
    }),
}));

// Mock useToast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("Role-Gated UI Integration Flow", () => {
  const mockLists = [
    {
      id: "list-1",
      projectId: "proj-1",
      name: "To Do",
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
    },
  ];

  it("renders management/edit controls when canEdit is true (editor/owner role)", () => {
    render(
      <TaskActions
        taskId="task-1"
        projectId="proj-1"
        currentListId="list-1"
        allLists={mockLists}
        canEdit={true}
        canContribute={true}
        onView={jest.fn()}
        onRename={jest.fn()}
        onArchive={jest.fn()}
        onDeleteClick={jest.fn()}
      />,
    );

    // Verify management options are present for editor/owner role
    expect(screen.getByText("Rename task")).toBeInTheDocument();
    expect(screen.getByText("Archive task")).toBeInTheDocument();
    expect(screen.getByText("Assign member")).toBeInTheDocument();
    expect(screen.getByText("Remove task")).toBeInTheDocument();
  });

  it("hides management/edit controls when canEdit is false (viewer role) after rerender", () => {
    const { rerender } = render(
      <TaskActions
        taskId="task-1"
        projectId="proj-1"
        currentListId="list-1"
        allLists={mockLists}
        canEdit={true}
        canContribute={true}
        onView={jest.fn()}
        onRename={jest.fn()}
        onArchive={jest.fn()}
        onDeleteClick={jest.fn()}
      />,
    );

    // Simulate prop change / re-render with viewer permissions (canEdit = false, canContribute = false)
    rerender(
      <TaskActions
        taskId="task-1"
        projectId="proj-1"
        currentListId="list-1"
        allLists={mockLists}
        canEdit={false}
        canContribute={false}
        onView={jest.fn()}
        onRename={jest.fn()}
        onArchive={jest.fn()}
        onDeleteClick={jest.fn()}
      />,
    );

    // Verify basic action (View task) is still present, but management options are absent
    expect(screen.getByText("View task")).toBeInTheDocument();

    expect(screen.queryByText("Rename task")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive task")).not.toBeInTheDocument();
    expect(screen.queryByText("Assign member")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove task")).not.toBeInTheDocument();
  });
});

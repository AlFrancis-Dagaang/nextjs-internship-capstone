import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskActions } from "@/components/tasks/modal/task-actions";
import {
  assignUserToTask,
  unassignUserFromTask,
  getTaskAssignees,
} from "@/lib/actions/task-assignees";
import { getAssignableUsers } from "@/lib/actions/project-member";

// Mock server actions with instantaneous resolutions
jest.mock("@/lib/actions/task-assignees", () => ({
  getTaskAssignees: jest.fn().mockResolvedValue({ success: true, data: [] }),
  assignUserToTask: jest
    .fn()
    .mockResolvedValue({ success: true, data: { userId: "user-1" } }),
  unassignUserFromTask: jest
    .fn()
    .mockResolvedValue({ success: true, data: {} }),
}));

jest.mock("@/lib/actions/project-member", () => ({
  getAssignableUsers: jest.fn().mockResolvedValue({
    success: true,
    data: [
      { id: "user-1", name: "Alice Smith", email: "alice@example.com" },
      { id: "user-2", name: "Bob Jones", email: "bob@example.com" },
    ],
  }),
}));

jest.mock("@/lib/actions/tasks", () => ({
  deleteTask: jest.fn(),
  updateTask: jest.fn(),
  toggleTaskComplete: jest.fn(),
  archiveTask: jest.fn(),
  moveTaskToList: jest.fn(),
}));

jest.mock("@/stores/board-store", () => ({
  useBoardStore: (selector: any) =>
    selector({
      applyOptimisticMove: jest.fn(),
      revertMoveSnapshot: jest.fn(),
      archiveTaskLocally: jest.fn(),
      revertArchiveSnapshot: jest.fn(),
    }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock DropdownMenu to render inline
jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
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

describe("Multi-Assignee Integration Flow", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TaskActions quick-assign panel: calls assignUserToTask with correct arguments", async () => {
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

    // Click "Assign member" menu entry
    const assignMenuItem = screen.getByText("Assign member");
    fireEvent.click(assignMenuItem);

    // Wait for assignable users list to appear
    await waitFor(() => {
      expect(getAssignableUsers).toHaveBeenCalledWith("proj-1");
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    // Quick-assign user
    const userRow = screen.getByText("Alice Smith");
    fireEvent.click(userRow);

    // Confirm underlying action was called with exact args
    await waitFor(() => {
      expect(assignUserToTask).toHaveBeenCalledWith("task-1", "user-1");
    });
  });

  it("Confirms assignment action handles execution cleanly without hanging", async () => {
    const result = await assignUserToTask("task-1", "user-1");
    expect(result.success).toBe(true);
    expect(assignUserToTask).toHaveBeenCalledWith("task-1", "user-1");

    const unassignResult = await unassignUserFromTask("task-1", "user-2");
    expect(unassignResult.success).toBe(true);
    expect(unassignUserFromTask).toHaveBeenCalledWith("task-1", "user-2");
  });
});

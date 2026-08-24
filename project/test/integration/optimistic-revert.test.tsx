import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskHeader } from "@/components/tasks/tast-detail-modal/task-header";
import { toggleTaskComplete } from "@/lib/actions/tasks";
import { useBoardStore } from "@/stores/board-store";

// Mock server action
jest.mock("@/lib/actions/tasks", () => ({
  updateTask: jest.fn(),
  toggleTaskComplete: jest.fn(),
}));

// Mock useToast hook
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe("Optimistic Revert Integration Flow", () => {
  const mockTask = {
    id: "task-1",
    listId: "list-1",
    projectId: "proj-1",
    title: "Test Task",
    description: null,
    assigneeId: null,
    priority: null,
    dueDate: null,
    position: 1,
    isArchived: false,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useBoardStore.setState({ lists: [] });
  });

  it("applies optimistic completion update immediately, reverts on server rejection, and fires error toast", async () => {
    // Setup initial board store state with our test task
    useBoardStore.setState({
      lists: [
        {
          id: "list-1",
          projectId: "proj-1",
          name: "To Do",
          position: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [mockTask],
        },
      ],
    });

    // Mock toggleTaskComplete server action to reject/fail with ActionResult structure
    (toggleTaskComplete as jest.Mock).mockResolvedValue({
      success: false,
      error: "Database connection failed",
    });

    // Wrapper component that pulls the task reactively from useBoardStore
    const TestWrapper = () => {
      const lists = useBoardStore((s) => s.lists);
      const task = lists[0]?.tasks[0] || mockTask;
      return <TaskHeader task={task} canEdit={true} canContribute={true} />;
    };

    render(<TestWrapper />);

    const completeButton = screen.getByRole("button", {
      name: /mark complete/i,
    });

    // Click to toggle task complete
    fireEvent.click(completeButton);

    // 1. Confirm optimistic update applied immediately in store/UI (button label changes to "Mark incomplete")
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /mark incomplete/i }),
      ).toBeInTheDocument();
    });

    // 2. Wait for the failed server action and subsequent revert / toast
    await waitFor(() => {
      expect(toggleTaskComplete).toHaveBeenCalledWith("task-1");
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Failed to update task",
          description: "Database connection failed",
          variant: "destructive",
        }),
      );
    });

    // 3. Confirm UI reverted back to initial incomplete state ("Mark complete")
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /mark complete/i }),
      ).toBeInTheDocument();
    });
  });
});

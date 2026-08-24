import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateTaskModal } from "@/components/tasks/modal/create-tasks-modal";

// Mock server actions to avoid database / TextDecoder dependencies
jest.mock("@/lib/actions/tasks", () => ({
  createTask: jest.fn(),
  updateTask: jest.fn(),
}));

// Mock realtime client
jest.mock("@/lib/realtime/client", () => ({
  getRealtimeClientId: () => "mock-client-id",
}));

// Mock toast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("CreateTaskModal Component", () => {
  it("renders the 'Add a task' button by default in create mode", () => {
    render(<CreateTaskModal listId="list-1" />);

    // Verify initial collapsed state shows the add button
    expect(
      screen.getByRole("button", { name: /add a task/i }),
    ).toBeInTheDocument();
  });

  it("expands into the form when 'Add a task' is clicked", () => {
    render(<CreateTaskModal listId="list-1" />);

    const addButton = screen.getByRole("button", { name: /add a task/i });
    fireEvent.click(addButton);

    // Verify form input and buttons appear
    expect(screen.getByPlaceholderText("Enter a title")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add task/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("renders correctly in edit mode with pre-filled title", () => {
    const mockTask = {
      id: "task-1",
      listId: "list-1",
      title: "Existing Task",
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

    render(<CreateTaskModal listId="list-1" task={mockTask} />);

    // Verify edit form is rendered immediately without clicking expand
    expect(screen.getByDisplayValue("Existing Task")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
  });
});

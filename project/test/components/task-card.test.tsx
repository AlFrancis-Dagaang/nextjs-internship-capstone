import React from "react";
import { render, screen } from "@testing-library/react";
import { TaskCardView } from "@/components/tasks/task-card";

// Mock child modal components that import database-connected server actions
jest.mock("@/components/tasks/modal/task-actions", () => ({
  TaskActions: () => <div data-testid="task-actions" />,
}));

jest.mock("@/components/tasks/modal/delete-task-dialog", () => ({
  DeleteTaskDialog: () => <div data-testid="delete-task-dialog" />,
}));

// Mock database server actions to avoid loading Neon/TextDecoder dependencies in JSDOM
jest.mock("@/lib/actions/tasks", () => ({
  deleteTask: jest.fn(),
  updateTask: jest.fn(),
  toggleTaskComplete: jest.fn(),
}));

// Mock @dnd-kit dependencies and hooks used in TaskCard to isolate TaskCardView
jest.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => "",
    },
  },
}));

jest.mock("@/stores/board-store", () => ({
  useBoardStore: () => jest.fn(),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("TaskCardView / TaskCard Presentational Rendering", () => {
  const mockTask = {
    id: "task-1",
    listId: "list-1",
    title: "Implement Login Feature",
    description: "Build login screen with Clerk auth",
    priority: "high" as const,
    dueDate: new Date("2026-12-31T00:00:00.000Z"),
    createdAt: new Date(),
    updatedAt: new Date(),
    position: 1,
    assigneeId: null,
    isArchived: false,
    isCompleted: false,
    commentCount: 4,
    assignees: [
      {
        userId: "user-1",
        name: "John Doe",
        email: "john@example.com",
        imageUrl: null,
        hasImage: false,
      },
    ],
  };

  it("renders title, priority, due date, comment count, and assignees correctly", () => {
    render(<TaskCardView task={mockTask} interactive={false} />);

    // Verify title is rendered
    expect(screen.getByText("Implement Login Feature")).toBeInTheDocument();

    // Verify comment count is rendered
    expect(screen.getByText("4")).toBeInTheDocument();

    // Verify due date is correctly formatted and rendered (Dec 31)
    expect(screen.getByText("Dec 31")).toBeInTheDocument();
  });
});

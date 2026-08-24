import React from "react";
import { render, screen } from "@testing-library/react";
import { CreateProjectModal } from "@/components/projects/modals/create-project-modal";

// Mock router navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock project server actions to prevent real network/database calls
jest.mock("@/lib/actions/projects", () => ({
  createProject: jest.fn(),
  updateProject: jest.fn(),
}));

describe("CreateProjectModal Component", () => {
  it("renders correctly in create mode with empty form fields", () => {
    render(<CreateProjectModal open={true} />);

    // Verify dialog title for create mode
    expect(screen.getByText("Create New Project")).toBeInTheDocument();

    // Verify form fields are empty
    expect(screen.getByLabelText(/project name/i)).toHaveValue("");
    expect(screen.getByLabelText(/description/i)).toHaveValue("");
    expect(screen.getByLabelText(/due date/i)).toHaveValue("");

    // Verify submit button text
    expect(
      screen.getByRole("button", { name: /create project/i }),
    ).toBeInTheDocument();
  });

  it("renders correctly in edit mode with pre-filled fields from project prop", () => {
    const mockProject = {
      id: "proj-123",
      name: "Existing Project",
      description: "Existing project description",
      dueDate: new Date("2026-12-31T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "user-1",
    };

    render(<CreateProjectModal open={true} project={mockProject} />);

    // Verify dialog title for edit mode
    expect(screen.getByText("Edit Project")).toBeInTheDocument();

    // Verify form fields are pre-filled with project data
    expect(screen.getByLabelText(/project name/i)).toHaveValue(
      "Existing Project",
    );
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      "Existing project description",
    );
    expect(screen.getByLabelText(/due date/i)).toHaveValue("2026-12-31");

    // Verify submit button text
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  });
});

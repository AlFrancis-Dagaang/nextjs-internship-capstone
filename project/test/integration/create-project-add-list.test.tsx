import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectsList } from "@/components/projects/projects-list";
import { AddListForm } from "@/components/lists/add-list-form";
import { createProject } from "@/lib/actions/projects";
import { createList } from "@/lib/actions/lists";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Server Actions
jest.mock("@/lib/actions/projects", () => ({
  createProject: jest.fn(),
}));

jest.mock("@/lib/actions/lists", () => ({
  createList: jest.fn(),
}));

// Mock ProjectCard to avoid database / TextDecoder dependencies via project-member actions
jest.mock("@/components/projects/project-card", () => ({
  ProjectCard: () => <div data-testid="project-card" />,
}));

// Mock RecentlyViewedStrip
jest.mock("@/components/projects/recently-viewed-strip", () => ({
  RecentlyViewedStrip: () => <div data-testid="recently-viewed-strip" />,
}));

// Mock realtime client ID
jest.mock("@/lib/realtime/client", () => ({
  getRealtimeClientId: () => "mock-realtime-client-id",
}));

// Mock toast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock Zustand Project Store
const mockAddProject = jest.fn();
jest.mock("@/stores/project-store", () => ({
  useProjectStore: (selector: any) =>
    selector({
      projects: [],
      setInitialProjects: jest.fn(),
      addProject: mockAddProject,
      setInitialMembersMap: jest.fn(),
    }),
}));

describe("Create Project & Add List Integration Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("simulates creating a project via ProjectsList -> CreateProjectModal and adding a list via AddListForm", async () => {
    // 1. Setup successful mock response for createProject
    const createdProjectData = {
      id: "new-proj-123",
      name: "New Test Project",
      description: "Test description",
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "user-1",
    };

    (createProject as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: createdProjectData,
    });

    // Render ProjectsList with 0 initial projects to trigger the empty state / modal trigger
    render(
      <ProjectsList
        initialProjects={[]}
        currentUserId="user-1"
        initialMembersMap={{}}
        initialOwnerMap={{}}
        initialCompletionMap={{}}
        initialMyRoleMap={{}}
      />,
    );

    // 2. Click the global empty state trigger to open the CreateProjectModal
    const triggerButton = screen.getByText(/no projects yet/i);
    fireEvent.click(triggerButton);

    // 3. Fill out the project form
    const nameInput = screen.getByLabelText(/project name/i);
    fireEvent.change(nameInput, { target: { value: "New Test Project" } });

    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: "Test description" } });

    // Submit the project form
    const submitProjectButton = screen.getByRole("button", {
      name: /create project/i,
    });
    fireEvent.click(submitProjectButton);

    // 4. Assertions for Project Creation
    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith({
        name: "New Test Project",
        description: "Test description",
        dueDate: null,
      });
    });

    expect(mockAddProject).toHaveBeenCalledWith(createdProjectData);
    expect(mockPush).toHaveBeenCalledWith("/projects/new-proj-123");

    // 5. Simulate the next step in the flow: adding a list inside the project board using AddListForm
    const createdListData = {
      id: "list-1",
      projectId: "new-proj-123",
      name: "To Do",
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (createList as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: createdListData,
    });

    // Render AddListForm with the newly created project's ID
    const { unmount } = render(<AddListForm projectId="new-proj-123" />);

    // Click "Add another list" button to expand the form
    const addListTrigger = screen.getByRole("button", {
      name: /add another list/i,
    });
    fireEvent.click(addListTrigger);

    // Type the list name
    const listNameInput = screen.getByPlaceholderText(/enter list name/i);
    fireEvent.change(listNameInput, { target: { value: "To Do" } });

    // Submit the list form
    const submitListButton = screen.getByRole("button", {
      name: /^add list$/i,
    });
    fireEvent.click(submitListButton);

    // 6. Assertions for List Creation
    await waitFor(() => {
      expect(createList).toHaveBeenCalledWith(
        {
          projectId: "new-proj-123",
          name: "To Do",
        },
        "mock-realtime-client-id",
      );
    });

    unmount();
  });
});

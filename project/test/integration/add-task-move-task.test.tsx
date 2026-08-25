import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { ListColumn } from "@/components/lists/list-column"
import { createTask } from "@/lib/actions/tasks"

// Mock tasks server actions
jest.mock("@/lib/actions/tasks", () => ({
  createTask: jest.fn(),
  updateTask: jest.fn(),
}))

// Mock lists server actions
jest.mock("@/lib/actions/lists", () => ({
  updateList: jest.fn(),
  deleteList: jest.fn(),
  moveList: jest.fn(),
}))

// Mock realtime client ID
jest.mock("@/lib/realtime/client", () => ({
  getRealtimeClientId: () => "mock-realtime-client-id",
}))

// Mock toast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock UI store
jest.mock("@/stores/ui-store", () => ({
  useUiStore: (selector: any) =>
    selector({
      searchQuery: "",
      filterCompleted: false,
      filterPriority: null,
      filterDueDate: null,
      filterAssignedToMe: false,
      filterAssigneeId: null,
      selectionMode: false,
      selectedTaskIds: [],
      toggleTaskSelected: jest.fn(),
    }),
}))

// Mock task-filters utility
jest.mock("@/lib/utils/task-filters", () => ({
  taskMatchesFilters: () => true,
  isFilteringActive: () => false,
}))

// Mock TaskCard to simplify rendering
jest.mock("@/components/tasks/task-card", () => ({
  TaskCard: ({ task }: { task: { title: string } }) => (
    <div data-testid="task-card">{task.title}</div>
  ),
}))

describe("Add Task Integration Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("simulates creating a task via CreateTaskModal inside ListColumn and asserts createTask Server Action is called", async () => {
    const mockList = {
      id: "list-1",
      projectId: "proj-1",
      name: "To Do",
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
    }

    const createdTaskData = {
      id: "task-123",
      listId: "list-1",
      title: "New Integration Task",
      description: null,
      assigneeId: null,
      priority: null,
      dueDate: null,
      position: 0,
      isArchived: false,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    ;(createTask as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: createdTaskData,
    })

    const handleTaskCreated = jest.fn()
    const handleTaskCreateConfirmed = jest.fn()

    render(
      <ListColumn
        list={mockList}
        totalLists={1}
        allLists={[mockList]}
        role="editor"
        currentUserId="user-1"
        onOpenTask={jest.fn()}
        onTaskCreated={handleTaskCreated}
        onTaskCreateConfirmed={handleTaskCreateConfirmed}
      />,
    )

    // 1. Click "Add a task" button text to expand CreateTaskModal form
    const addTaskButton = screen.getByText("Add a task")
    fireEvent.click(addTaskButton)

    // 2. Type task title into the input
    const titleInput = screen.getByPlaceholderText("Enter a title")
    fireEvent.change(titleInput, { target: { value: "New Integration Task" } })

    // 3. Submit form using exact string match for submit button
    const submitButton = screen.getByRole("button", { name: /^add task$/i })
    fireEvent.click(submitButton)

    // 4. Assertions
    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(
        {
          title: "New Integration Task",
          listId: "list-1",
        },
        "mock-realtime-client-id",
      )
    })

    expect(handleTaskCreated).toHaveBeenCalled()
  })
})

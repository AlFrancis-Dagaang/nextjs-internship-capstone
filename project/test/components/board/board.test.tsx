import { render, screen } from "@testing-library/react"
import { Board } from "@/components/lists/board"

// Mock next/navigation for searchParams
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}))

// Mock server actions to avoid loading database/TextDecoder dependencies
jest.mock("@/lib/actions/lists", () => ({
  updateList: jest.fn(),
  deleteList: jest.fn(),
  moveList: jest.fn(),
}))

jest.mock("@/lib/actions/tasks", () => ({
  deleteTask: jest.fn(),
  moveTaskToList: jest.fn(),
  updateTask: jest.fn(),
  toggleTaskComplete: jest.fn(),
}))

// Mock task filters utility so tasks are never filtered out in tests
jest.mock("@/lib/utils/task-filters", () => ({
  taskMatchesFilters: () => true,
  isFilteringActive: () => false,
}))

// Mock TaskCard so it renders its title properly without hitting complex hook trees
jest.mock("@/components/tasks/task-card", () => ({
  TaskCard: ({ task }: { task: { title: string } }) => (
    <div data-testid="task-card">{task.title}</div>
  ),
  TaskCardView: ({ task }: { task: { title: string } }) => (
    <div data-testid="task-card-view">{task.title}</div>
  ),
}))

// Mock child components of ListColumn that trigger server actions / DB files
jest.mock("@/components/tasks/modal/create-tasks-modal", () => ({
  CreateTaskModal: () => <div data-testid="create-task-modal" />,
}))

jest.mock("@/components/lists/modal/list-actions", () => ({
  ListActions: () => <div data-testid="list-actions" />,
}))

jest.mock("@/components/lists/modal/delete-list-dialog", () => ({
  DeleteListDialog: () => <div data-testid="delete-list-dialog" />,
}))

// Track lists state dynamically so store updates and initial props sync up
let currentLists: any[] = []

jest.mock("@/stores/board-store", () => ({
  useBoardStore: (selector: any) => {
    const state = {
      lists: currentLists,
      activeTask: null,
      activeListId: null,
      setInitialLists: jest.fn((lists) => {
        currentLists = lists
      }),
      addList: jest.fn(),
      renameList: jest.fn(),
      removeList: jest.fn(),
      reorderLists: jest.fn(),
      addTask: jest.fn(),
      insertTaskAt: jest.fn(),
      updateTaskLocal: jest.fn(),
      removeTask: jest.fn(),
      reconcileTaskMoved: jest.fn(),
      changeCommentCount: jest.fn(),
      startDrag: jest.fn(),
      clearActiveTask: jest.fn(),
      dragOver: jest.fn(),
      endDrag: jest.fn(),
      revertToSnapshot: jest.fn(),
      startListDrag: jest.fn(),
      clearActiveList: jest.fn(),
      dragListOver: jest.fn(),
      endListDrag: jest.fn(),
      revertListSnapshot: jest.fn(),
      replaceOptimisticTask: jest.fn(),
    }
    return selector(state)
  },
}))

jest.mock("@/stores/ui-store", () => ({
  useUiStore: (selector: any) => {
    const state = {
      searchQuery: "",
      filterCompleted: false,
      filterPriority: null,
      filterDueDate: null,
      filterAssignedToMe: false,
      filterAssigneeId: null,
      selectionMode: false,
      selectedTaskIds: [],
      deleteTaskOpen: false,
    }
    return selector(state)
  },
}))

jest.mock("@/stores/task-detail-store", () => ({
  useTaskDetailStore: (selector: any) => {
    const state = {
      isOpen: false,
      task: null,
    }
    return selector(state)
  },
}))

// Mock hooks and server actions to avoid network/database calls in test environment
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock("@/hooks/use-track-project-view", () => ({
  useTrackProjectView: jest.fn(),
}))

jest.mock("@/hooks/use-realtime-board", () => ({
  useRealtimeBoard: jest.fn(),
}))

jest.mock("@/lib/actions/project-member", () => ({
  getAssignableUsers: async () => ({ success: true, data: [] }),
}))

// Mock other child components
jest.mock("@/components/lists/add-list-form", () => ({
  AddListForm: () => <div data-testid="add-list-form" />,
}))

jest.mock("@/components/tasks/modal/task-detail-modal", () => ({
  TaskDetailModal: () => <div data-testid="task-detail-modal" />,
}))

jest.mock("@/components/tasks/modal/delete-task-dialog", () => ({
  DeleteTaskDialog: () => <div data-testid="delete-task-dialog" />,
}))

describe("Board Component", () => {
  const initialLists = [
    {
      id: "list-1",
      projectId: "proj-1",
      name: "To Do",
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [
        {
          id: "task-1",
          listId: "list-1",
          title: "Task One",
          description: "First task description",
          priority: "medium" as const,
          dueDate: new Date("2026-12-31T00:00:00.000Z"),
          createdAt: new Date(),
          updatedAt: new Date(),
          position: 1,
          assigneeId: null,
          isArchived: false,
          isCompleted: false,
          commentCount: 2,
          assignees: [],
        },
      ],
    },
  ]

  beforeEach(() => {
    currentLists = initialLists
  })

  it("renders lists and tasks correctly based on provided props and store state", async () => {
    render(
      <Board
        projectId="proj-1"
        initialLists={initialLists}
        role="editor"
        currentUserId="user-1"
      />,
    )

    // Verify column list name is rendered correctly
    expect(screen.getByText("To Do")).toBeInTheDocument()

    // Verify task title is rendered correctly inside the column via mocked TaskCard asynchronously
    expect(await screen.findByText("Task One")).toBeInTheDocument()
  })
})

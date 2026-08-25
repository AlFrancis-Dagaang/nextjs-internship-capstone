import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { TaskActivityFeed } from "@/components/tasks/tast-detail-modal/task-activity-feed"
import { TaskComments } from "@/components/tasks/tast-detail-modal/task-comments"
import { createComment, getCommentsByTask } from "@/lib/actions/comments"
import { getCurrentUserId } from "@/lib/actions/currentUser"
import { getTaskActivity } from "@/lib/actions/taskActivity"

// Mock Clerk useUser hook
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      fullName: "Test User",
      imageUrl: "https://example.com/avatar.jpg",
      hasImage: true,
    },
  }),
}))

// Mock Server Actions
jest.mock("@/lib/actions/comments", () => ({
  createComment: jest.fn(),
  getCommentsByTask: jest.fn(),
  deleteComment: jest.fn(),
  updateComment: jest.fn(),
}))

jest.mock("@/lib/actions/taskActivity", () => ({
  getTaskActivity: jest.fn(),
}))

jest.mock("@/lib/actions/currentUser", () => ({
  getCurrentUserId: jest.fn(),
}))

jest.mock("@/lib/realtime/client", () => ({
  getRealtimeClientId: () => "client-1",
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe("Comment and Activity Synchronization Integration Flow", () => {
  const mockTaskId = "task-1"

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUserId as jest.Mock).mockResolvedValue("user-1")
    ;(getCommentsByTask as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    })
    ;(getTaskActivity as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    })
  })

  it("posts a comment optimistically and triggers exactly one activity feed refetch via refreshKey bump", async () => {
    const handleActivityChanged = jest.fn()

    // Mock createComment to simulate an async delay before resolving
    let resolveCreate!: (val: any) => void
    const createPromise = new Promise((res) => {
      resolveCreate = res
    })
    ;(createComment as jest.Mock).mockReturnValue(createPromise)

    // Render both TaskComments and TaskActivityFeed with a shared refreshKey
    const TestContainer = () => {
      const [refreshKey, setRefreshKey] = React.useState(0)

      return (
        <div>
          <TaskComments
            taskId={mockTaskId}
            canEdit={true}
            canContribute={true}
            onActivityChanged={() => {
              setRefreshKey((k) => k + 1)
              handleActivityChanged()
            }}
          />
          <TaskActivityFeed taskId={mockTaskId} refreshKey={refreshKey} />
        </div>
      )
    }

    render(<TestContainer />)

    // Initial activity feed load assertion
    await waitFor(() => {
      expect(getTaskActivity).toHaveBeenCalledTimes(1)
    })

    // Expand comment textarea
    const commentInputTrigger = screen.getByPlaceholderText(
      "Write a comment......",
    )
    fireEvent.click(commentInputTrigger)

    // Type comment content
    const textarea = screen.getByRole("textbox")
    fireEvent.change(textarea, {
      target: { value: "This is an optimistic test comment" },
    })

    // Click Comment button
    const submitButton = screen.getByRole("button", { name: "Comment" })
    fireEvent.click(submitButton)

    // 1. Assert optimistic render happens immediately (temp id / placeholder author shown)
    expect(
      screen.getByText("This is an optimistic test comment"),
    ).toBeInTheDocument()
    expect(screen.getByText("Test User")).toBeInTheDocument()

    // Resolve the server action creation
    resolveCreate({
      success: true,
      data: {
        id: "comment-real-1",
        taskId: mockTaskId,
        content: "This is an optimistic test comment",
        createdAt: new Date(),
      },
    })

    // 2. Assert that after posting, TaskActivityFeed's refetch is triggered exactly once via activityRefreshKey bump
    await waitFor(() => {
      expect(handleActivityChanged).toHaveBeenCalledTimes(1)
      expect(getTaskActivity).toHaveBeenCalledTimes(2)
    })
  })
})

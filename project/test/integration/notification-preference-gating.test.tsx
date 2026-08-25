import { queries } from "@/lib/db"
import { createNotification } from "@/lib/services/notifications"

// Mock the database layer to test real service execution without DB client errors
jest.mock("@/lib/db", () => ({
  queries: {
    users: {
      getById: jest.fn(),
    },
    notifications: {
      create: jest.fn(),
    },
  },
}))

// Mock real-time publishing to prevent websocket/pusher side-effects during test
jest.mock("@/lib/realtime/server", () => ({
  publishNotification: jest.fn(),
}))

describe("Notification Preference Gating Integration Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("does NOT insert a notification when the specific type is disabled in notificationPreferences", async () => {
    // User has explicitly disabled task_assigned notifications (false)
    ;(queries.users.getById as jest.Mock).mockResolvedValue({
      id: "user-1",
      notificationPreferences: {
        task_assigned: false,
      },
    })

    await createNotification({
      userId: "user-1",
      type: "task_assigned",
      message: "You were assigned to a task",
      projectId: "proj-1",
    })

    // Confirm queries.users.getById was checked
    expect(queries.users.getById).toHaveBeenCalledWith("user-1")
    // Confirm create was NOT called because preference is disabled
    expect(queries.notifications.create).not.toHaveBeenCalled()
  })

  it("DOES insert a notification when the preference key is missing (default enabled opt-out model)", async () => {
    // User has an empty preferences object (missing key means enabled)
    ;(queries.users.getById as jest.Mock).mockResolvedValue({
      id: "user-2",
      notificationPreferences: {},
    })

    ;(queries.notifications.create as jest.Mock).mockResolvedValue({
      id: "notif-1",
      userId: "user-2",
      type: "task_assigned",
      message: "You were assigned to a task",
      projectId: "proj-1",
      taskId: null,
      actorId: null,
      isRead: false,
      createdAt: new Date(),
    })

    await createNotification({
      userId: "user-2",
      type: "task_assigned",
      message: "You were assigned to a task",
      projectId: "proj-1",
    })

    // Confirm DB insert call is successfully made
    expect(queries.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-2",
        type: "task_assigned",
        message: "You were assigned to a task",
      }),
    )
  })

  it("DOES insert a notification for a different enabled type even if another type is disabled", async () => {
    // User disabled task_assigned, but task_comment_added is not set (enabled by default)
    ;(queries.users.getById as jest.Mock).mockResolvedValue({
      id: "user-3",
      notificationPreferences: {
        task_assigned: false,
      },
    })

    ;(queries.notifications.create as jest.Mock).mockResolvedValue({
      id: "notif-2",
      userId: "user-3",
      type: "task_comment_added",
      message: "New comment on your task",
      projectId: "proj-1",
      taskId: null,
      actorId: null,
      isRead: false,
      createdAt: new Date(),
    })

    await createNotification({
      userId: "user-3",
      type: "task_comment_added",
      message: "New comment on your task",
      projectId: "proj-1",
    })

    // Confirm DB insert succeeds for the enabled type
    expect(queries.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-3",
        type: "task_comment_added",
        message: "New comment on your task",
      }),
    )
  })
})

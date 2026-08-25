import { fireEvent, render, screen } from "@testing-library/react"
import { CalendarView } from "@/components/calendar/calendar-view"

const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock("@/components/calendar/modals/event-form-modal", () => ({
  EventFormModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="event-form-modal">Event Form Modal</div> : null,
}))

describe("CalendarView", () => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")
  const d = String(today.getDate()).padStart(2, "0")
  const todayKey = `${y}-${m}-${d}`

  const mockTasks = {
    [todayKey]: [
      {
        id: "task-1",
        title: "Fix Navigation Bug",
        priority: "high" as const,
        projectId: "proj-1",
        projectName: "Project Alpha",
        dueDate: `${todayKey}T00:00:00.000Z`,
        isCompleted: false,
      },
    ],
  }

  const mockEvents = {
    [todayKey]: [
      {
        id: "event-1",
        title: "Sprint Planning",
        description: "Discussion on sprint goals",
        startAt: `${todayKey}T09:00:00.000Z`,
        endAt: `${todayKey}T10:00:00.000Z`,
        projectId: "proj-1",
        creatorId: "user-1",
      },
    ],
  }

  const mockProjects = {
    [todayKey]: [
      {
        id: "proj-1",
        name: "Project Alpha",
        dueDate: `${todayKey}T00:00:00.000Z`,
      },
    ],
  }

  it("renders month grid with interactive tasks, events, and non-interactive project markers", () => {
    render(
      <CalendarView
        tasksByDate={mockTasks}
        eventsByDate={mockEvents}
        projectsByDate={mockProjects}
        currentUserId="user-1"
      />,
    )

    expect(screen.getByText("Schedule & Deadlines")).toBeInTheDocument()
    expect(screen.getByText("Month Overview")).toBeInTheDocument()
    expect(screen.getAllByText("Fix Navigation Bug")[0]).toBeInTheDocument()
    expect(screen.getAllByText("Sprint Planning")[0]).toBeInTheDocument()
    expect(screen.getAllByText("Project Alpha")[0]).toBeInTheDocument()
  })

  it("opens the new event modal when 'New Event' button is clicked", () => {
    render(
      <CalendarView
        tasksByDate={{}}
        eventsByDate={{}}
        projectsByDate={{}}
        currentUserId="user-1"
      />,
    )

    const newEventBtn = screen.getByRole("button", { name: /New Event/i })
    fireEvent.click(newEventBtn)

    expect(screen.getByTestId("event-form-modal")).toBeInTheDocument()
  })
})

import { render, screen, waitFor } from "@testing-library/react"
import { DrillDownPanel } from "@/components/analytics/drill-down-panel"

// Mock server actions for drill-downs
jest.mock("@/lib/actions/analytics", () => ({
  getProjectDrillDown: jest.fn().mockResolvedValue({
    success: true,
    data: {
      projectName: "Alpha Project",
      open: [
        {
          id: "task-1",
          title: "Build login screen",
          priority: "high",
          dueDate: "2026-07-01",
        },
      ],
      completed: [
        {
          id: "task-2",
          title: "Setup database",
          priority: "medium",
          dueDate: "2026-06-15",
        },
      ],
    },
  }),
  getDayActivityDrillDown: jest.fn(),
  getVelocityDrillDown: jest.fn(),
  getActiveUsersDrillDown: jest.fn(),
  getAvgTaskTimeDrillDown: jest.fn(),
}))

describe("DrillDownPanel", () => {
  it("renders project drill-down data correctly when requested", async () => {
    render(
      <DrillDownPanel
        open={true}
        onOpenChange={jest.fn()}
        request={{ kind: "project", projectId: "proj-1" }}
        startDate="2026-06-01"
        endDate="2026-06-30"
        projectId={null}
      />,
    )

    expect(screen.getByText("Loading details...")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Project: Alpha Project")).toBeInTheDocument()
      expect(screen.getByText("Build login screen")).toBeInTheDocument()
      expect(screen.getByText("Setup database")).toBeInTheDocument()
    })
  })
})

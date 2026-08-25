import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnalyticsView } from "@/components/analytics/analytics-view";

// Mock server actions to prevent module resolution/Neon issues
jest.mock("@/lib/actions/analytics", () => ({
  getMemberBreakdown: jest.fn().mockResolvedValue({
    success: true,
    data: {
      members: [
        {
          userId: "user-1",
          name: "Alice Smith",
          email: "alice@example.com",
          completedCount: 12,
          activeDays: 5,
          avgResolutionDays: 2.1,
        },
      ],
      teamAverage: {
        completedCount: 8,
        activeDays: 4,
        avgResolutionDays: 3.0,
      },
    },
  }),
  getTeamBreakdown: jest.fn().mockResolvedValue({
    success: true,
    data: {
      teams: [
        {
          teamId: "team-1",
          teamName: "Engineering Team",
          memberCount: 4,
          completedCount: 25,
          activeDays: 15,
          avgResolutionDays: 2.5,
        },
      ],
    },
  }),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () =>
    new URLSearchParams("startDate=2026-06-01&endDate=2026-06-30"),
  usePathname: () => "/analytics",
}));

// Mock child sub-components to isolate AnalyticsView structure
jest.mock("@/components/analytics/tabs/analytics-overview-tab", () => ({
  AnalyticsOverviewTab: () => (
    <div data-testid="overview-tab-content">Overview Tab Content</div>
  ),
}));

jest.mock("@/components/analytics/tabs/analytics-members-tab", () => ({
  AnalyticsMembersTab: ({
    loading,
    membersList,
  }: {
    loading: boolean;
    membersList: any[];
  }) => (
    <div data-testid="members-tab-content">
      {loading ? "Loading members..." : `Members count: ${membersList.length}`}
    </div>
  ),
}));

jest.mock("@/components/analytics/tabs/analytics-teams-tab", () => ({
  AnalyticsTeamsTab: ({
    loading,
    teamsList,
  }: {
    loading: boolean;
    teamsList: any[];
  }) => (
    <div data-testid="teams-tab-content">
      {loading ? "Loading teams..." : `Teams count: ${teamsList.length}`}
    </div>
  ),
}));

jest.mock("@/components/analytics/drill-down-panel", () => ({
  DrillDownPanel: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="drill-down-panel">DrillDown Panel Open</div>
    ) : null,
}));

jest.mock("@/components/layout/page-header", () => ({
  PageHeader: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

describe("AnalyticsView", () => {
  const mockAnalyticsData = {
    velocity: { value: 24, deltaPercent: 12.5 },
    teamEfficiency: { value: 85, deltaPercent: 5.0, label: "High" },
    activeUsers: { value: 10, deltaPercent: 0.0 },
    avgTaskDays: { value: 3.2, deltaPercent: -2.1 },
    projectProgress: [
      { projectId: "proj-1", projectName: "Alpha Project", percent: 75 },
    ],
    teamActivity: [{ day: "2026-06-01", count: 4 }],
    availableProjects: [{ id: "proj-1", name: "Alpha Project" }],
    appliedFilters: {
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      projectId: null,
    },
  };

  it("renders the analytics dashboard header and overview tab by default", () => {
    render(<AnalyticsView data={mockAnalyticsData as any} />);

    expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("overview-tab-content")).toBeInTheDocument();
  });

  it("switches to Team Members tab and fetches member breakdown", async () => {
    render(<AnalyticsView data={mockAnalyticsData as any} />);

    const membersTabButton = screen.getByRole("button", {
      name: /Team Members/i,
    });
    fireEvent.click(membersTabButton);

    expect(screen.getByTestId("members-tab-content")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Members count: 1")).toBeInTheDocument();
    });
  });

  it("switches to Teams tab and fetches team breakdown", async () => {
    render(<AnalyticsView data={mockAnalyticsData as any} />);

    const teamsTabButton = screen.getByRole("button", { name: /^Teams$/i });
    fireEvent.click(teamsTabButton);

    expect(screen.getByTestId("teams-tab-content")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Teams count: 1")).toBeInTheDocument();
    });
  });
});

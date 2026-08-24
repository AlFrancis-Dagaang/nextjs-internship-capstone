import React from "react";
import { render, screen } from "@testing-library/react";
import { ProjectTeamView } from "@/components/projects/project-team/project-team-view";
import { resolveEffectiveMemberRole } from "@/lib/services/ownership";

// Mock the database module to safely import the real ownership service under JSDOM
jest.mock("@/lib/db", () => ({
  queries: {
    projects: { getById: jest.fn() },
    projectMembers: { getByProjectAndUser: jest.fn() },
    teams: { getTeamIdsForUser: jest.fn() },
    projectTeams: { getRolesForProjectAndTeams: jest.fn() },
  },
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock server actions and hooks
jest.mock("@/lib/actions/project-member", () => ({
  updateMemberRole: jest.fn(),
  removeProjectMember: jest.fn(),
}));

jest.mock("@/lib/actions/project-team", () => ({
  updateProjectTeamRole: jest.fn(),
  detachTeamFromProject: jest.fn(),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock DropdownMenu and Dialog to render inline in JSDOM
jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <div />,
}));

describe("Team Effective Role and UI-Side Guard (#89) Integration Flow", () => {
  it("resolves effective member role correctly using the real ownership service", () => {
    // 1. Team-derived only role
    expect(resolveEffectiveMemberRole(undefined, "editor")).toBe("editor");

    // 2. Direct role higher than team role (admin > viewer)
    expect(resolveEffectiveMemberRole("admin", "viewer")).toBe("admin");

    // 3. Team role higher than direct role (editor > contributor)
    expect(resolveEffectiveMemberRole("contributor", "editor")).toBe("editor");
  });

  it("hides role-edit dropdown control for team-derived-only rows in ProjectTeamView (#89 guard)", () => {
    const teamDerivedIndividual = {
      id: "team-ind-1",
      userId: "user-3",
      name: "Team User",
      email: "teamuser@example.com",
      role: "viewer" as const,
      activeTaskCount: 0,
      recentActivity: [],
    };

    render(
      <ProjectTeamView
        projectId="proj-1"
        initialIndividuals={[teamDerivedIndividual]}
        initialTeams={[]}
        canManage={true}
      />,
    );

    expect(screen.getByText("Team User")).toBeInTheDocument();

    // Verify that the team-derived row hides the management dropdown trigger button (#89 guard)
    const memberCard = screen.getByText("Team User").closest(".group");
    expect(memberCard?.querySelector("button")).not.toBeInTheDocument();
  });

  it("keeps role-edit controls visible/unaffected for dual-status or direct members (bypassing #89 guard)", () => {
    // Dual-status or direct member has a standard ID (does not start with "team-")
    const directMember = {
      id: "user-direct-1",
      userId: "user-direct-1",
      name: "Direct User",
      email: "direct@example.com",
      role: "editor" as const,
      activeTaskCount: 0,
      recentActivity: [],
    };

    render(
      <ProjectTeamView
        projectId="proj-1"
        initialIndividuals={[directMember]}
        initialTeams={[]}
        canManage={true}
      />,
    );

    expect(screen.getByText("Direct User")).toBeInTheDocument();

    // Verify that direct/dual-status members retain their management dropdown trigger button
    const memberCard = screen.getByText("Direct User").closest(".group");
    expect(memberCard?.querySelector("button")).toBeInTheDocument();
  });
});

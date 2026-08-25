import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { EventFormModal } from "@/components/calendar/modals/event-form-modal";

jest.mock("@/lib/actions/events", () => ({
  createEvent: jest.fn().mockResolvedValue({ success: true }),
  updateEvent: jest.fn().mockResolvedValue({ success: true }),
  deleteEvent: jest.fn().mockResolvedValue({ success: true }),
  getEventableProjects: jest.fn().mockResolvedValue({
    success: true,
    data: [{ id: "proj-1", name: "Project Alpha" }],
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("EventFormModal", () => {
  const mockEntity = {
    id: "event-1",
    title: "Team Standup",
    description: "Daily sync",
    startAt: "2026-06-15T09:00:00.000Z",
    endAt: "2026-06-15T09:30:00.000Z",
    projectId: null,
    creatorId: "user-1", // Matches currentUserId so userHasPermission is true, enabling view-only mode with an Edit button
  };

  it("renders in view-only / details mode initially and supports switching to edit mode", async () => {
    await act(async () => {
      render(
        <EventFormModal
          open={true}
          onOpenChange={jest.fn()}
          entity={mockEntity as any}
          currentUserId="user-1"
          defaultDate="2026-06-15"
        />,
      );
    });

    expect(screen.getByText("Event Details")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Team Standup")).toBeDisabled();

    // Locate the edit button by scanning button text content
    const buttons = screen.getAllByRole("button");
    const editBtn = buttons.find((btn) => /edit/i.test(btn.textContent || ""));

    expect(editBtn).toBeDefined();
    fireEvent.click(editBtn!);

    await waitFor(() => {
      expect(screen.getByText("Edit Event")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Team Standup")).not.toBeDisabled();
    });
  });
});

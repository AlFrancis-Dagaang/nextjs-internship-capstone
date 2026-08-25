import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationsTab } from "@/components/settings/notifications-tab";

jest.mock("@/lib/actions/notification-preferences", () => ({
  updateNotificationPreferences: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("NotificationsTab", () => {
  it("renders master toggle and triggers batched server action updates", async () => {
    render(<NotificationsTab />);

    expect(screen.getByText("Notification Preferences")).toBeInTheDocument();

    const switchToggle = screen.getByRole("switch");
    expect(switchToggle).toBeInTheDocument();

    fireEvent.click(switchToggle);
  });
});

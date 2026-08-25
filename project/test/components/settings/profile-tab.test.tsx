import { render, screen } from "@testing-library/react"
import { ProfileTab } from "@/components/settings/profile-tab"

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      firstName: "Al Francis",
      lastName: "Daga-ang",
      imageUrl: "https://example.com/avatar.png",
      hasImage: true,
      update: jest.fn().mockResolvedValue({}),
      setProfileImage: jest.fn().mockResolvedValue({}),
      reload: jest.fn().mockResolvedValue({}),
    },
  }),
}))

jest.mock("@/components/ui/user-avatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe("ProfileTab", () => {
  const mockDbUser = {
    id: "user-1",
    clerkId: "clerk_123",
    email: "alfrancis@example.com",
    name: "Al Francis Daga-ang",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it("renders profile names and Clerk-hosted avatar", () => {
    render(<ProfileTab dbUser={mockDbUser} />)

    expect(screen.getByText("Profile Information")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Al Francis")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Daga-ang")).toBeInTheDocument()
    expect(
      screen.getByDisplayValue("alfrancis@example.com"),
    ).toBeInTheDocument()
  })
})

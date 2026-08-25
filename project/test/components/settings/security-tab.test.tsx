import { render, screen } from "@testing-library/react"
import { SecurityTab } from "@/components/settings/security-tab"

const mockReverification = jest.fn((fn) => fn)
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      emailAddresses: [
        {
          id: "email-1",
          emailAddress: "alfrancis@example.com",
          verification: { status: "verified" },
        },
      ],
      primaryEmailAddressId: "email-1",
      passwordEnabled: true,
      updatePassword: jest.fn().mockResolvedValue({}),
      reload: jest.fn().mockResolvedValue({}),
    },
  }),
  useReverification: () => mockReverification,
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe("SecurityTab", () => {
  it("renders email addresses and password management sections correctly", () => {
    render(<SecurityTab />)

    expect(screen.getByText("Email Addresses")).toBeInTheDocument()
    expect(screen.getByText("alfrancis@example.com")).toBeInTheDocument()
    expect(screen.getByText("Password")).toBeInTheDocument()
    expect(screen.getByText("••••••••••••")).toBeInTheDocument()
    expect(mockReverification).toBeDefined()
  })
})

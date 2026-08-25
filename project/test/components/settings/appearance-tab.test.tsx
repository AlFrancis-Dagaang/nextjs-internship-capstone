import { fireEvent, render, screen } from "@testing-library/react"
import { AppearanceTab } from "@/components/settings/appearance-tab"

describe("AppearanceTab", () => {
  it("renders cosmetic theme selectors without backing persistence actions", () => {
    render(<AppearanceTab />)

    expect(screen.getByText("Appearance")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Light/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Dark/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /System/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Dark/i }))
  })
})

import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import NotFound from "@/app/not-found"

describe("NotFound Page", () => {
  it("renders the 404 heading", () => {
    render(<NotFound />)
    const heading = screen.getByRole("heading", { name: "404" })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveClass("text-7xl", "sm:text-8xl", "font-black", "text-primary")
  })

  it('renders the "Page Not Found" title', () => {
    render(<NotFound />)
    const title = screen.getByRole("heading", { name: "Page Not Found" })
    expect(title).toBeInTheDocument()
  })

  it('renders the "Go Back Home" and "Start Inquiry" links', () => {
    render(<NotFound />)
    const homeLink = screen.getByRole("link", { name: /go back home/i })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute("href", "/")

    const inquireLink = screen.getByRole("link", { name: /start inquiry/i })
    expect(inquireLink).toBeInTheDocument()
    expect(inquireLink).toHaveAttribute("href", "/inquire")
  })

  it("renders the AgencyDesk contact email and badge", () => {
    render(<NotFound />)
    expect(screen.getByText("AgencyDesk")).toBeInTheDocument()
    expect(screen.getByText(/Need help\? Contact us at/i)).toBeInTheDocument()
    const emailLink = screen.getByRole("link", { name: /inquiries@agencydesk\.dev/i })
    expect(emailLink).toHaveAttribute("href", "mailto:inquiries@agencydesk.dev")
  })
})

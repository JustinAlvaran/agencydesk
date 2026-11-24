import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import NotFound from "@/app/not-found"

describe("NotFound Page", () => {
  it("renders the 404 heading", () => {
    render(<NotFound />)
    const heading = screen.getByRole("heading", { name: "404" })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveClass("text-9xl", "font-bold", "text-primary")
  })

  it('renders the "Page Not Found" title', () => {
    render(<NotFound />)
    const title = screen.getByRole("heading", { name: "Page Not Found" })
    expect(title).toBeInTheDocument()
    expect(title).toHaveClass("text-2xl", "font-semibold", "text-white")
  })

  it('renders the "Go Back Home" link', () => {
    render(<NotFound />)
    const homeLink = screen.getByRole("link", { name: /go back home/i })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute("href", "/")
    expect(homeLink).toHaveClass(
      "inline-block",
      "bg-primary",
      "text-white",
      "px-6",
      "py-3",
      "rounded-lg"
    )
  })

  it("renders the contact information", () => {
    render(<NotFound />)
    expect(
      screen.getByText(/If you believe this is an error, please contact us at:/i)
    ).toBeInTheDocument()
    expect(screen.getByText("support@citc-ph.com")).toBeInTheDocument()
  })

  it('renders the CITC IT Website footer', () => {
    render(<NotFound />)
    expect(screen.getByText("CITC IT Website")).toBeInTheDocument()
  })

  it("applies correct main container styling", () => {
    const { container } = render(<NotFound />)
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass(
      "min-h-screen",
      "bg-white",
      "dark:bg-transparent",
      "flex",
      "items-center",
      "justify-center",
      "px-4"
    )
  })

  it("has proper structure with max-width container", () => {
    render(<NotFound />)
    const maxContainer = screen.getByText("404").closest("div")?.parentElement
    expect(maxContainer).toHaveClass("max-w-md", "w-full", "text-center")
  })
})

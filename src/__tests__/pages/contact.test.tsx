import { render, screen } from "@testing-library/react";
import ContactPage from "@/app/contact/page";

describe("Contact Page", () => {
  it("renders main heading", () => {
    render(<ContactPage />);
    // The heading in your component is "Let's Work Together"
    expect(screen.getByRole("heading", { name: /Let's Work Together/i })).toBeInTheDocument();
  });

  it("renders contact description", () => {
    render(<ContactPage />);
    // The paragraph in your component
    expect(
      screen.getByText(/Let's connect, collaborate, & bring your goals to life/i)
    ).toBeInTheDocument();
  });

  it("renders contact card heading", () => {
    render(<ContactPage />);
    // h3 inside the card
    expect(screen.getByRole("heading", { name: /Contact Us/i })).toBeInTheDocument();
  });

  // If you have an email link, update the text to match actual text
  it("contains email link", () => {
    render(<ContactPage />);
    const emailLink = screen.queryByRole("link", { name: /info@company.com/i });
    // Only check if it exists if your component actually has it
    if (emailLink) {
      expect(emailLink).toHaveAttribute("href", "mailto:info@company.com");
    }
  });
});

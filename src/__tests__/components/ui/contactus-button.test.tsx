import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ContactUsButton from "@/components/ui/contactus-button";

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ContactUsButton", () => {
  it("renders with correct text and link", () => {
    render(<ContactUsButton />);
    const link = screen.getByRole("link", { name: /contact us/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/contact");
  });
});
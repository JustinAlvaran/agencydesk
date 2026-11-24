import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CareerCard from "@/components/ui/career-card";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock child button components
jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  Button: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="mock-button">{children}</button>
  ),
}));

jest.mock("@/components/ui/cta-button", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <button data-testid="mock-cta">{title}</button>
  ),
}));

describe("CareerCard", () => {
  const baseProps = {
    id: "1",
    field: "Engineering",
    title: "Frontend Developer",
    description: "This is a short description",
    employment_type: "Full-time",
    location: "Remote",
    level: "Mid-level",
  };

  it("renders all props correctly", () => {
    render(<CareerCard {...baseProps} />);

    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("This is a short description")).toBeInTheDocument();
    expect(screen.getByText("Full-time")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("Mid-level")).toBeInTheDocument();

  });

  it("renders fallback text when props are missing", () => {
    render(
      <CareerCard
        id="2"
        field=""
        title=""
        description=""
        employment_type=""
        location=""
        level=""
      />
    );

    const naElements = screen.getAllByText("N/A");
    expect(naElements).toHaveLength(6);
  });

  it("truncates long description to 14 words with ellipsis", () => {
    const longDescription =
      "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen";

    render(<CareerCard {...baseProps} description={longDescription} />);

    expect(
      screen.getByText(
        /one two three four five six seven eight nine ten eleven twelve thirteen fourteen.../
      )
    ).toBeInTheDocument();
  });
});

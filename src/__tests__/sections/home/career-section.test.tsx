import { render, screen, fireEvent } from "@testing-library/react";
import CareerSection from "@/sections/home/career-section";
import React from "react";

// Mock next/navigation useRouter
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock CareerCard
jest.mock("@/components/ui/career-card", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="career-card">
      <div>{props.title}</div>
      <div>{props.description}</div>
    </div>
  ),
}));

// Mock Button
jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  Button: (props: any) => <button {...props}>{props.children}</button>,
}));

describe("CareerSection component", () => {
  const careersMock = [
    {
      id: "1",
      field: "Engineering",
      title: "Frontend Developer",
      description: "Work on cutting-edge web apps",
      employment_type: "Full-time",
      location: "Remote",
      level: "Mid",
    },
    {
      id: "2",
      field: "Design",
      title: "UI/UX Designer",
      description: "Design amazing interfaces",
      employment_type: "Full-time",
      location: "Remote",
      level: "Senior",
    },
  ];

  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders the section with heading and description", () => {
    render(<CareerSection careers={careersMock} />);
    expect(screen.getByText(/open positions/i)).toBeInTheDocument();
    expect(
      screen.getByText(/discover opportunities to grow your career/i)
    ).toBeInTheDocument();
  });

  it("renders CareerCard components when careers exist", () => {
    render(<CareerSection careers={careersMock} />);
    const cards = screen.getAllByTestId("career-card");
    expect(cards.length).toBe(careersMock.length);
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("UI/UX Designer")).toBeInTheDocument();
  });

  it("renders 'No Current Job Opening' when careers is empty", () => {
    render(<CareerSection careers={[]} />);
    expect(screen.getByText(/no current job opening/i)).toBeInTheDocument();
  });

  it("renders 'VIEW ALL OPENINGS' button when careers exist and triggers router push", () => {
    render(<CareerSection careers={careersMock} />);
    const button = screen.getByRole("button", { name: /view all openings/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(pushMock).toHaveBeenCalledWith("/careers");
  });

  it("does not render 'VIEW ALL OPENINGS' button when no careers", () => {
    render(<CareerSection careers={[]} />);
    const button = screen.queryByRole("button", { name: /view all openings/i });
    expect(button).not.toBeInTheDocument();
  });
});

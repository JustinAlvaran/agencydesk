import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BenefitsCard from "@/components/ui/benefits-card";
import { FaBeer } from "react-icons/fa";

describe("BenefitsCard", () => {
  it("renders title and description correctly", () => {
    render(<BenefitsCard title="Fast Performance" description="Loads quickly and efficiently." />);
    
    expect(screen.getByRole("heading", { name: /fast performance/i })).toBeInTheDocument();
    expect(screen.getByText(/loads quickly and efficiently./i)).toBeInTheDocument();
  });

  it("renders with an icon if provided", () => {
    render(<BenefitsCard title="Cheers" description="With an icon" icon={<FaBeer data-testid="test-icon" />} />);
    
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("does not render an icon if none is provided", () => {
    render(<BenefitsCard title="No Icon" description="This one has no icon" />);
    
    // Query (not get) so it doesn't throw
    expect(screen.queryByTestId("test-icon")).not.toBeInTheDocument();
  });
});

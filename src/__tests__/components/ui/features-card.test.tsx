import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeaturesCard from "@/components/ui/features-card"
import { FaStar } from "react-icons/fa";

describe("FeaturesCard", () => {
  it("renders title and description correctly", () => {
    render(
      <FeaturesCard
        title="High Security"
        description="Protects your data with strong encryption"
      />
    );

    expect(
      screen.getByRole("heading", { name: /high security/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/protects your data with strong encryption/i)
    ).toBeInTheDocument();
  });

  it("renders with an icon if provided", () => {
    render(
      <FeaturesCard
        title="Star Feature"
        description="Shiny and important"
        icon={<FaStar data-testid="test-icon" />}
      />
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("does not render an icon if none is provided", () => {
    render(
      <FeaturesCard
        title="No Icon"
        description="This one has no icon"
      />
    );

    expect(screen.queryByTestId("test-icon")).not.toBeInTheDocument();
  });

  it("applies correct classes to title and description", () => {
    render(
      <FeaturesCard
        title="Styled Feature"
        description="Check the styles"
      />
    );

    const heading = screen.getByRole("heading", { name: /styled feature/i });
    expect(heading).toHaveClass("text-[clamp(1rem,1.5vw,1.875rem)] font-bold font-montserrat leading-tight");

    const description = screen.getByText(/check the styles/i);
    expect(description).toHaveClass("text-[clamp(0.875rem,1.8vw,1rem)] font-lato text-black dark:text-[#CCC] leading-relaxed");
  });
});

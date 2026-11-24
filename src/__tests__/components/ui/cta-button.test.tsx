import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CTAButton from "@/components/ui/cta-button";

describe("CTAButton", () => {
  it("renders with provided text", () => {
    render(<CTAButton title="Learn More" />);
    expect(screen.getByText("Learn More")).toBeInTheDocument();
  });

  it("handles hover state", () => {
    render(<CTAButton title="Learn More" />);
    const button = screen.getByText("Learn More").parentElement;
    expect(button).toBeInTheDocument();
    
    fireEvent.mouseEnter(button!);
    expect(button).toHaveClass("bg-primary");
    
    fireEvent.mouseLeave(button!);
    expect(button).toHaveClass("bg-primary");
  });
});
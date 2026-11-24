import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with children and handles click", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const button = screen.getByRole("button", { name: "Click Me" });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it("renders with different variants", () => {
    render(<Button variant="outline">Outline Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("border");
  });
});
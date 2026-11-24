import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Label } from "@/components/ui/label";

describe("Label", () => {
  it("renders with text", () => {
    render(<Label>Username</Label>);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });
});
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders with placeholder and handles change", () => {
    const handleChange = jest.fn();
    render(<Input placeholder="Enter text" onChange={handleChange} />);
    const input = screen.getByPlaceholderText("Enter text");
    fireEvent.change(input, { target: { value: "test" } });
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue("test");
  });
});
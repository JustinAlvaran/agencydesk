import { render, screen } from "@testing-library/react";
import Hero from "@/sections/home/hero";

describe("Home Page", () => {
  it("renders main heading", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { name: /Next-Gen Agency CRM & Digital Workspace/i })
    ).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<Hero />);
    expect(
      screen.getByText(/AgencyDesk unites client lead capture/i)
    ).toBeInTheDocument();
  });
});

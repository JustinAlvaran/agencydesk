import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders children correctly", () => {
    render(
      <RootLayout>
        <p>Test Child</p>
      </RootLayout>,
      { container: document.body }
    );

    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("applies font and antialiased classes", () => {
    render(
      <RootLayout>
        <span>Font Test</span>
      </RootLayout>,
      { container: document.body }
    );

    expect(document.body).toHaveClass("antialiased");

    // ✅ Check mocked Montserrat + Lato variables instead of Geist
    expect(document.body.className).toMatch(/--font-montserrat/);
    expect(document.body.className).toMatch(/--font-lato/);
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "@/components/navigation/header";
import type { ComponentProps } from "react";

type NextImageProps = ComponentProps<"img"> & { alt: string };

jest.mock("next/image", () => {
  const MockNextImage = (props: NextImageProps) => {
    // ts-ignore
    return <img {...props} alt={props.alt} />;
  };
  MockNextImage.displayName = "MockNextImage";
  return MockNextImage;
});

describe("Header", () => {
  it("renders logo", () => {
    render(<Header />);
    expect(screen.getAllByAltText("AgencyDesk")).toHaveLength(2);
  });

  it("renders navigation links", () => {
    render(<Header />);
    ["HOME", "ABOUT", "SERVICES", "CLIENT PORTAL"].forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  it("renders Contact Us button", () => {
    render(<Header />);
    expect(screen.getAllByText(/start inquiry/i)[0]).toBeInTheDocument();
  });

  it("toggles mobile menu", () => {
    render(<Header />);
    const button = screen.getByRole("button", { name: /toggle navigation menu/i });

    fireEvent.click(button);
    expect(screen.getAllByText("ABOUT")[0]).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getAllByText("ABOUT")[0]).toBeInTheDocument();
  });
});

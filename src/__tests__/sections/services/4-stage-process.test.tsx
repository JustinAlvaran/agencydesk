import React from "react";
import { render, screen } from "@testing-library/react";
import FourStageProcess from "@/sections/services/4-stage-process";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />
}));

describe("FourStageProcess", () => {
  it("renders the section title", () => {
    render(<FourStageProcess />);
    expect(screen.getByText("OUR PROCESS")).toBeInTheDocument();
    expect(screen.getByText("4 Stage Process")).toBeInTheDocument();
  });

  it("renders all 4 process steps", () => {
    render(<FourStageProcess />);
    expect(screen.getByText("Discovery Phase")).toBeInTheDocument();
    expect(screen.getByText("Strategy Development")).toBeInTheDocument();
    expect(screen.getByText("Implementation & Execution")).toBeInTheDocument();
    expect(screen.getByText("Deployment & Optimization")).toBeInTheDocument();
  });

  it("renders the descriptions for each step", () => {
    render(<FourStageProcess />);
    expect(screen.getByText(/During this initial stage/i)).toBeInTheDocument();
    expect(screen.getByText(/With insights gathered from the discovery phase/i)).toBeInTheDocument();
    expect(screen.getByText(/Once the strategy is approved/i)).toBeInTheDocument();
    expect(screen.getByText(/We continuously track KPIs/i)).toBeInTheDocument();
  });

  it("renders images for each step", () => {
    render(<FourStageProcess />);
    expect(screen.getByAltText("Discovery Icon")).toBeInTheDocument();
    expect(screen.getByAltText("Strategy Icon")).toBeInTheDocument();
    expect(screen.getByAltText("Implementation Icon")).toBeInTheDocument();
    expect(screen.getByAltText("Deployment Icon")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import BenefitsSection from "@/sections/home/benefits-section";
import React from "react";

// Mock Next.js Image
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock BenefitsCard
jest.mock("@/components/ui/benefits-card", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="benefits-card">
      <div>{props.title}</div>
      <div>{props.description}</div>
    </div>
  ),
}));

describe("BenefitsSection component", () => {
  it("renders the main section", () => {
    render(<BenefitsSection />);
    const section = screen.getByTestId("benefits") || screen.getByText(/why work with us/i).closest("section");
    expect(section).toBeInTheDocument();
  });

  it("renders all BenefitsCard components", () => {
    render(<BenefitsSection />);
    const cards = screen.getAllByTestId("benefits-card");
    expect(cards.length).toBe(6); // There are 6 benefits
  });

  it("renders all benefit titles", () => {
    render(<BenefitsSection />);
    const titles = ["Fixed-Price Guarantee", "Live Milestone Telemetry", "Senior Engineering Pods", "Rapid MVP Velocity", "100% Code Ownership", "Enterprise Isolation"];

    titles.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it("renders all benefit descriptions", () => {
    render(<BenefitsSection />);
    const descriptions = ["Every dollar and deliverable is agreed upon in versioned proposals before work begins. Zero surprise invoices.", "Access your dedicated client portal 24/7 to inspect sprint progress, verify deliverables, and review roadmap milestones.", "Work directly with seasoned software engineers, AI specialists, and UI/UX designers. No junior runarounds.", "Sprint 1 functional deliverable ready within 14 business days. Fast iterations built on modern Next.js foundations.", "Complete intellectual property and source code rights transferred upon milestone signoff. Zero proprietary lock-in.", "Multi-tenant database boundaries, Supabase row-level security, and encrypted client data isolation."];

    descriptions.forEach(desc => {
      expect(screen.getByText(desc)).toBeInTheDocument();
    });
  });
});

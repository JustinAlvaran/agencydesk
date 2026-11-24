import { render, screen } from "@testing-library/react";
import FeaturesSection from "@/sections/home/features-section";
import React from "react";

// Mock Next.js Image
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock FeaturesCard to simplify rendering
jest.mock("@/components/ui/features-card", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="features-card">
      <div>{props.title}</div>
      <div>{props.description}</div>
    </div>
  ),
}));

describe("FeaturesSection component", () => {
  it("renders the main section", () => {
    render(<FeaturesSection />);
    const section = screen.getByRole("region") || screen.getByTestId("features-section");
    expect(section).toBeInTheDocument();
  });

  it("renders all FeaturesCard components", () => {
    render(<FeaturesSection />);
    const cards = screen.getAllByTestId("features-card");
    expect(cards.length).toBe(6); // There are 3 features
  });

  it("renders all feature titles", () => {
    render(<FeaturesSection />);
    const titles = ["Pipeline Kanban", "Live Client Portal", "Versioned Scopes", "Automated Workflows", "Sprint Delivery Tracker", "Enterprise Isolation"];

    titles.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it("renders all feature descriptions", () => {
    render(<FeaturesSection />);
    const descriptions = ["Visual sales stages with stage-weighted value forecasting, lead scoring, and instant stage progression.", "Dedicated workspace where stakeholders inspect sprint progress, verify deliverables, and access project updates.", "Itemized proposals with immutable pricing versions, transparent milestones, and single-click client acceptance.", "Event-driven messaging outbox, automated task reminders for client callbacks, and n8n webhook triggers.", "Milestone-driven engineering sprints with real-time percentage completion and deliverable review gates.", "Strict agency data isolation, row-level database security, and audit-ready activity trails for all records."];

    descriptions.forEach(desc => {
      const elements = screen.getAllByText(desc);
      elements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });
  });
});

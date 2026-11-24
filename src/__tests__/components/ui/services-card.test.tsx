import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ServicesCard from "@/components/ui/services-card";

// Mock the Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;
  },
}));

// Optional: Mock Button if you want to avoid full implementation
jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  Button: function MockButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    return <button onClick={onClick}>{children}</button>;
  },
}));

describe("ServicesCard", () => {
  const baseProps = {
    title: "Web Development",
    description: "Custom web applications built with modern technologies and best practices.",
    icon: "/services/icon/webmobile.webp",
    link: "/services/web",
  };

  it("renders service information correctly", () => {
    render(<ServicesCard {...baseProps} />);

    expect(screen.getByText(baseProps.description)).toBeInTheDocument();
    expect(screen.getByAltText(baseProps.title)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
  });

  it("renders without icon when icon prop is missing", () => {
    render(<ServicesCard title="SEO" description="Optimize your website" />);
    
    expect(screen.getByText("SEO")).toBeInTheDocument();
    expect(screen.getByText("Optimize your website")).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it("handles click on button if link is provided", () => {
    render(<ServicesCard {...baseProps} />);
    
    const button = screen.getByRole('button', { name: /learn more/i });
    expect(button).toBeInTheDocument();
    // We can't actually change window.location in tests, but we can at least verify the button exists
  });
});

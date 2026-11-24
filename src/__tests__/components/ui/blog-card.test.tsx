import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogCard from "@/components/ui/blog-card";
import { ImageProps } from "next/image";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ImageProps) => {
    // Spread only the necessary img props to avoid type conflicts
    return <img src={props.src as string} alt={props.alt} width={props.width} height={props.height} />;
  },
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("BlogCard", () => {
  const blogProps = {
    title: "Test Blog",
    tag: "Technology",
    date: "2024-03-20",
    link: "https://example.com",
    image: "/blog/test-image.jpg",
  };

  it("renders blog information correctly", () => {
    render(<BlogCard {...blogProps} />);
    expect(screen.getByText(blogProps.tag.toUpperCase())).toBeInTheDocument();
    expect(screen.getByText(blogProps.date)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", blogProps.link);
    expect(screen.getByRole("img")).toHaveAttribute("src", blogProps.image);
  });
});
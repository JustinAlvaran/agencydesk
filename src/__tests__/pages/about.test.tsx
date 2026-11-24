import { render, screen } from "@testing-library/react";
import AboutPage from "@/app/about/page";

describe("About Page", () => {
  it("renders about heading and description", async () => {
    const Page = await AboutPage(); // await the async component
    render(Page);

    expect(
      screen.getByText(/The Modern Operating System for High-Performing Digital Agencies/i)
    ).toBeInTheDocument();
  });
});

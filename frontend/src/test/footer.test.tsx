import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FOOTER } from "../config";
import { jsonResponse, mockFetch, renderApp } from "./helpers";
import { pathways, questions } from "./fixtures";

const routes = {
  "GET /api/pathways": () => jsonResponse(pathways),
  "GET /api/questions": () => jsonResponse(questions),
};

describe("footer", () => {
  it("names the faculty and university and gives the address", () => {
    mockFetch(routes);
    renderApp("/");

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("Faculty of Computing")).toBeInTheDocument();
    expect(within(footer).getByText("NSBM Green University")).toBeInTheDocument();
    expect(within(footer).getByText("Mahenwaththa, Pitipana, Homagama, Sri Lanka")).toBeInTheDocument();
  });

  it("says all rights are reserved, with the current year", () => {
    mockFetch(routes);
    renderApp("/");

    const year = new Date().getFullYear();
    expect(
      within(screen.getByRole("contentinfo")).getByText(`\u00a9 ${year} NSBM Green University. All rights reserved.`),
    ).toBeInTheDocument();
  });

  it("links the enquiry email and phone number", () => {
    mockFetch(routes);
    renderApp("/");

    const footer = within(screen.getByRole("contentinfo"));
    expect(footer.getByRole("link", { name: "inquiries@nsbm.ac.lk" })).toHaveAttribute("href", "mailto:inquiries@nsbm.ac.lk");
    expect(footer.getByRole("link", { name: "+94 11 544 5000" })).toHaveAttribute("href", "tel:+94115445000");
  });

  it("opens the faculty website in a new tab and says so", () => {
    mockFetch(routes);
    renderApp("/");

    const link = within(screen.getByRole("contentinfo")).getByRole("link", { name: /nsbm\.ac\.lk\/faculty-of-computing/ });
    expect(link).toHaveAttribute("href", FOOTER.website.href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAccessibleName(/opens in a new tab/);
  });

  it("appears on every screen, not only the landing page", async () => {
    mockFetch(routes);
    renderApp("/questions/1");

    await screen.findByText("Question text 1");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});

import { composeStories } from "@storybook/react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import * as headerStories from "./header.stories";
import * as homeStories from "./home.stories";
import * as sharedFeatureCardStories from "./home-shared-feature-cards.stories";
import * as sharedPromoCardStories from "./home-shared-promo-cards.stories";
import * as sharedRouteSurfaceStories from "./home-shared-route-surface.stories";

const header = composeStories(headerStories);
const home = composeStories(homeStories);
const sharedFeatureCards = composeStories(sharedFeatureCardStories);
const sharedPromoCards = composeStories(sharedPromoCardStories);
const sharedRouteSurface = composeStories(sharedRouteSurfaceStories);

describe("design system stories", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the desktop header story", async () => {
    render(<header.Desktop />);
    expect(await screen.findByText("Noxian Netdecks")).toBeInTheDocument();
  });

  it("renders the compact desktop header story", async () => {
    render(<header.DesktopCompact />);
    expect(await screen.findByPlaceholderText("Search for Riftbound Cards")).toBeInTheDocument();
    expect(screen.getByText("Noxian Netdecks")).toBeInTheDocument();
  });

  it("renders the narrow mobile header story", async () => {
    render(<header.MobileNarrow />);
    expect(await screen.findByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("renders the desktop home story", async () => {
    render(<home.Desktop />);
    expect(await screen.findByRole("heading", { name: /The complete/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Card Search/i })).toBeInTheDocument();
  });

  it("renders the mobile home story", async () => {
    render(<home.Mobile />);
    expect(await screen.findByText("Learn to Search")).toBeInTheDocument();
    expect(screen.getByText("Trade Balancer")).toBeInTheDocument();
  });

  it("renders the shared feature cards story", async () => {
    render(<sharedFeatureCards.Desktop />);
    expect(await screen.findByText("Trade Balancer")).toBeInTheDocument();
    expect(screen.getByText("Sealed Simulator")).toBeInTheDocument();
  });

  it("renders the shared promo cards story", async () => {
    render(<sharedPromoCards.Desktop />);
    expect(await screen.findByText("Tier List Generator")).toBeInTheDocument();
    expect(screen.getByText("Learn to Search")).toBeInTheDocument();
  });

  it("renders the shared route surface story", async () => {
    render(<sharedRouteSurface.Desktop />);
    expect(await screen.findByText("Shared route surfaces")).toBeInTheDocument();
    expect(screen.getByText("Search workflow")).toBeInTheDocument();
  });
});

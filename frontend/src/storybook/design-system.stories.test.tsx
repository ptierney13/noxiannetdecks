import { composeStories } from "@storybook/react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import * as headerStories from "./header.stories";
import * as homeStories from "./home.stories";
import * as featureCardStories from "../ui/FeatureCard.stories";
import * as promoCardStories from "../ui/PromoCard.stories";

const header = composeStories(headerStories);
const home = composeStories(homeStories);
const featureCards = composeStories(featureCardStories);
const promoCards = composeStories(promoCardStories);

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

  it("renders the FeatureCard AllThree story", async () => {
    render(<featureCards.AllThree />);
    expect(await screen.findByText("Trade Balancer")).toBeInTheDocument();
    expect(screen.getByText("Sealed Simulator")).toBeInTheDocument();
    expect(screen.getByText("Card Search")).toBeInTheDocument();
  });

  it("renders the PromoCard BothVariants story", async () => {
    render(<promoCards.BothVariants />);
    expect(await screen.findByText("Tier List Generator")).toBeInTheDocument();
    expect(screen.getByText("Learn to Search")).toBeInTheDocument();
  });
});

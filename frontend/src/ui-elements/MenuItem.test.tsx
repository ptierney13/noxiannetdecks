import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { MenuItem } from "./MenuItem";
import type { MenuItemProps } from "./MenuItem";

function renderWithRouter(props: MenuItemProps, initialPath = "/") {
  const Item = () => <MenuItem {...props} />;
  const rootRoute = createRootRoute({ component: Item });
  const router = createRouter({
    routeTree: rootRoute.addChildren([]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("MenuItem", () => {
  describe("link rendering (href provided)", () => {
    it("renders as an anchor element", async () => {
      renderWithRouter({ href: "/cards", label: "Cards" });
      expect(await screen.findByRole("link", { name: "Cards" })).toBeInTheDocument();
    });

    it("applies aria-current=page when the path matches exactly", async () => {
      renderWithRouter({ href: "/cards", label: "Cards" }, "/cards");
      expect(await screen.findByRole("link", { name: "Cards" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    it("applies aria-current=page when the path starts with href/", async () => {
      renderWithRouter({ href: "/cards", label: "Cards" }, "/cards/learn-to-search");
      expect(await screen.findByRole("link", { name: "Cards" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    it("does not apply aria-current when the path does not match", async () => {
      renderWithRouter({ href: "/cards", label: "Cards" }, "/deck-explorer");
      expect(await screen.findByRole("link", { name: "Cards" })).not.toHaveAttribute(
        "aria-current",
      );
    });

    it("does not treat root href as a prefix match on sub-paths", async () => {
      // href="/" should only match exactly "/", not every path
      renderWithRouter({ href: "/", label: "Home" }, "/cards");
      expect(await screen.findByRole("link", { name: "Home" })).not.toHaveAttribute(
        "aria-current",
      );
    });

    it("applies warm-gold highlight classes when the link is active", async () => {
      renderWithRouter({ href: "/cards", label: "Cards" }, "/cards");
      const link = await screen.findByRole("link", { name: "Cards" });
      expect(link.className).toMatch(/text-accent-warm/);
      expect(link.className).toMatch(/font-bold/);
      expect(link.className).toMatch(/underline/);
    });

    it("applies secondary-text classes when the link is inactive", async () => {
      renderWithRouter({ href: "/cards", label: "Cards" }, "/deck-explorer");
      const link = await screen.findByRole("link", { name: "Cards" });
      expect(link.className).toMatch(/text-text-secondary/);
      expect(link.className).toMatch(/font-semibold/);
      expect(link.className).toMatch(/no-underline/);
    });
  });

  describe("button rendering (no href)", () => {
    it("renders as a button element", async () => {
      renderWithRouter({ label: "Tools", onClick: () => undefined });
      expect(await screen.findByRole("button", { name: "Tools" })).toBeInTheDocument();
    });

    it("applies warm-gold highlight classes when selected=true", async () => {
      renderWithRouter({ label: "Tools", onClick: () => undefined, selected: true });
      const button = await screen.findByRole("button", { name: "Tools" });
      expect(button.className).toMatch(/text-accent-warm/);
      expect(button.className).toMatch(/font-bold/);
    });

    it("applies secondary-text classes when selected=false", async () => {
      renderWithRouter({ label: "Tools", onClick: () => undefined, selected: false });
      const button = await screen.findByRole("button", { name: "Tools" });
      expect(button.className).toMatch(/text-text-secondary/);
      expect(button.className).toMatch(/font-semibold/);
    });

    it("defaults to unselected when selected is omitted", async () => {
      renderWithRouter({ label: "Tools", onClick: () => undefined });
      const button = await screen.findByRole("button", { name: "Tools" });
      expect(button.className).toMatch(/text-text-secondary/);
    });

    it("passes aria-expanded and aria-haspopup to the button", async () => {
      renderWithRouter({
        label: "Tools",
        onClick: () => undefined,
        "aria-expanded": true,
        "aria-haspopup": "menu",
      });
      const button = await screen.findByRole("button", { name: "Tools" });
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).toHaveAttribute("aria-haspopup", "menu");
    });

    it("sets aria-expanded=false when passed explicitly", async () => {
      renderWithRouter({
        label: "Tools",
        onClick: () => undefined,
        "aria-expanded": false,
      });
      expect(await screen.findByRole("button", { name: "Tools" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });

  describe("chevron", () => {
    it("renders a chevron svg when chevron=true", async () => {
      renderWithRouter({ label: "Cards", onClick: () => undefined, chevron: true });
      const button = await screen.findByRole("button", { name: "Cards" });
      expect(button.querySelector("svg")).toBeInTheDocument();
    });

    it("does not render a chevron when chevron is omitted", async () => {
      renderWithRouter({ label: "Cards", onClick: () => undefined });
      const button = await screen.findByRole("button", { name: "Cards" });
      expect(button.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("hover interaction", () => {
    it("all items carry the raised-button base surface classes", async () => {
      renderWithRouter({ href: "/cards", label: "Cards" }, "/deck-explorer");
      const link = await screen.findByRole("link", { name: "Cards" });
      expect(link.className).toMatch(/bg-\[rgba\(255,255,255,0\.04\)\]/);
      expect(link.className).toMatch(/border/);
      expect(link.className).toMatch(/border-\[rgba\(255,255,255,0\.07\)\]/);
    });

    it("inactive items show red border glow and brighten to text-primary on hover", async () => {
      // CSS :hover does not activate in jsdom, but we verify the Tailwind hover:
      // utilities are present in the class string — confirming browser behaviour.
      renderWithRouter({ href: "/cards", label: "Cards" }, "/deck-explorer");
      const link = await screen.findByRole("link", { name: "Cards" });
      expect(link.className).toMatch(/hover:text-text-primary/);
      expect(link.className).toMatch(/hover:bg-\[var\(--color-accent-soft\)\]/);
      expect(link.className).toMatch(/hover:border-\[var\(--color-accent\)\]/);
      expect(link.className).toMatch(/hover:shadow-/);
      expect(link.className).toMatch(/transition-\[color,background-color,border-color,box-shadow\]/);
      expect(link.className).toMatch(/duration-\[120ms\]/);
    });

    it("active items stay gold on hover but still get the red border glow", async () => {
      renderWithRouter({ href: "/cards", label: "Cards" }, "/cards");
      const link = await screen.findByRole("link", { name: "Cards" });
      expect(link.className).toMatch(/hover:text-accent-warm/);
      expect(link.className).not.toMatch(/hover:text-text-primary/);
      expect(link.className).toMatch(/hover:border-\[var\(--color-accent\)\]/);
      expect(link.className).toMatch(/hover:shadow-/);
    });

    it("fires hover and unhover events on a link item without throwing", async () => {
      const user = userEvent.setup();
      renderWithRouter({ href: "/cards", label: "Cards" });
      const link = await screen.findByRole("link", { name: "Cards" });
      await user.hover(link);
      await user.unhover(link);
      expect(link).toBeInTheDocument();
    });

    it("fires hover events on a button item without throwing", async () => {
      const user = userEvent.setup();
      renderWithRouter({ label: "Tools", onClick: () => undefined });
      const button = await screen.findByRole("button", { name: "Tools" });
      await user.hover(button);
      await user.unhover(button);
      expect(button).toBeInTheDocument();
    });
  });

  describe("variant", () => {
    it("applies inline-flex layout for variant=inline", async () => {
      renderWithRouter({ href: "/cards", label: "Cards", variant: "inline" });
      const link = await screen.findByRole("link", { name: "Cards" });
      expect(link.className).toMatch(/inline-flex/);
    });

    it("applies block layout for variant=menu", async () => {
      renderWithRouter({ href: "/cards", label: "Cards", variant: "menu" });
      const link = await screen.findByRole("link", { name: "Cards" });
      expect(link.className).toMatch(/\bblock\b/);
    });

    it("defaults to variant=menu when variant is omitted", async () => {
      renderWithRouter({ href: "/cards", label: "Cards" });
      const link = await screen.findByRole("link", { name: "Cards" });
      expect(link.className).toMatch(/\bblock\b/);
    });
  });
});

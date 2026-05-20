import type { Decorator, Meta, StoryObj } from "@storybook/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { Menu } from "./Menu";

function withRouter(initialPath = "/"): Decorator {
  return (Story) => {
    const rootRoute = createRootRoute({ component: Story });
    const router = createRouter({
      routeTree: rootRoute.addChildren([]),
      history: createMemoryHistory({ initialEntries: [initialPath] }),
    });
    return <RouterProvider router={router} />;
  };
}

const meta = {
  title: "UI/Menu",
  component: Menu,
  parameters: { layout: "padded" },
  decorators: [withRouter()],
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopDropdown: Story = {
  args: {
    sections: [
      {
        items: [
          { href: "/cards", label: "Card Search" },
          { href: "/cards/learn-to-search", label: "Learn to Search" },
          { href: "/cards/query-builder", label: "Query Builder" },
        ],
      },
    ],
    "aria-label": "Cards",
  },
};

export const DesktopDropdownWithSelection: Story = {
  args: {
    sections: [
      {
        items: [
          { href: "/cards", label: "Card Search" },
          { href: "/cards/learn-to-search", label: "Learn to Search" },
          { href: "/cards/query-builder", label: "Query Builder" },
        ],
      },
    ],
    "aria-label": "Cards",
  },
  decorators: [withRouter("/cards")],
};

export const DrawerSectioned: Story = {
  args: {
    sections: [
      {
        title: "Cards",
        items: [
          { href: "/cards", label: "Card Search" },
          { href: "/cards/learn-to-search", label: "Learn to Search" },
          { href: "/cards/query-builder", label: "Query Builder" },
        ],
      },
      {
        title: "Explore",
        items: [{ href: "/deck-explorer", label: "Deck Explorer" }],
      },
      {
        title: "Tools",
        items: [
          { href: "/tools/tier-list", label: "Tier List Generator" },
          { href: "/tools/sealed-pools", label: "Sealed Simulator" },
          { href: "/tools/trade-balancer", label: "Trade Balancer" },
        ],
      },
    ],
    "aria-label": "Navigation",
  },
};

export const DrawerSectionedWithSelection: Story = {
  args: {
    sections: [
      {
        title: "Cards",
        items: [
          { href: "/cards", label: "Card Search" },
          { href: "/cards/learn-to-search", label: "Learn to Search" },
          { href: "/cards/query-builder", label: "Query Builder" },
        ],
      },
      {
        title: "Explore",
        items: [{ href: "/deck-explorer", label: "Deck Explorer" }],
      },
      {
        title: "Tools",
        items: [
          { href: "/tools/tier-list", label: "Tier List Generator" },
          { href: "/tools/sealed-pools", label: "Sealed Simulator" },
          { href: "/tools/trade-balancer", label: "Trade Balancer" },
        ],
      },
    ],
    "aria-label": "Navigation",
  },
  decorators: [withRouter("/tools/tier-list")],
};

import type { Decorator, Meta, StoryObj } from "@storybook/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { MenuItem } from "./MenuItem";

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
  title: "UI/MenuItem",
  component: MenuItem,
  parameters: { layout: "padded" },
  decorators: [withRouter()],
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InlineDefault: Story = {
  args: { variant: "inline", label: "Deck Explorer", href: "/deck-explorer" },
};

export const InlineSelected: Story = {
  args: { variant: "inline", label: "Deck Explorer", href: "/deck-explorer" },
  decorators: [withRouter("/deck-explorer")],
};

export const InlineWithChevron: Story = {
  args: {
    variant: "inline",
    label: "Cards",
    onClick: () => undefined,
    chevron: true,
    "aria-expanded": false,
    "aria-haspopup": "menu",
  },
};

export const InlineWithChevronExpanded: Story = {
  args: {
    variant: "inline",
    label: "Cards",
    onClick: () => undefined,
    chevron: true,
    selected: true,
    "aria-expanded": true,
    "aria-haspopup": "menu",
  },
};

export const MenuDefault: Story = {
  args: { variant: "menu", label: "Card Search", href: "/cards" },
};

export const MenuSelected: Story = {
  args: { variant: "menu", label: "Card Search", href: "/cards" },
  decorators: [withRouter("/cards")],
};

// Visual reference for the hover appearance. The hover utility classes
// (hover:text-text-primary, hover:bg-[rgba(255,255,255,0.05)]) apply in a real
// browser; MenuItem.test.tsx verifies they are present in the className string.
export const MenuHover: Story = {
  args: { variant: "menu", label: "Card Search", href: "/cards" },
  parameters: {
    pseudo: { hover: true },
  },
};

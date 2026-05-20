import type { Meta, StoryObj } from "@storybook/react";
import App from "../App";

const meta = {
  title: "App/Header",
  render: () => <App />,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: {
      description: {
        story: "Mobile (393px) — hamburger visible, no wordmark. Opening the menu shows a fixed full-width dropdown with a backdrop overlay.",
      },
    },
  },
};

export const DesktopSmall: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop-small" },
    docs: {
      description: {
        story: "Desktop Small (700px) — hamburger still visible, no wordmark. Opening the menu shows a compact absolute dropdown with no backdrop.",
      },
    },
  },
};

export const NavItemsEdge: Story = {
  parameters: {
    viewport: { defaultViewport: "nav-items-edge" },
    docs: {
      description: {
        story: "Edge case at 767px — one pixel below the lg (1024px) breakpoint. Hamburger visible, inline nav fully collapsed (zero layout width, opacity-0).",
      },
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop" },
    docs: {
      description: {
        story: "Desktop (900px) — hamburger still visible, no wordmark. Inline nav is collapsed; lg breakpoint (1024px) not yet reached.",
      },
    },
  },
};

export const DesktopWide: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop-wide" },
    docs: {
      description: {
        story: "Desktop Wide (1280px) — inline nav visible (Cards, Deck Explorer, Tools), hamburger collapsed, 'Noxian Netdecks' wordmark visible. Full expanded header state.",
      },
    },
  },
};

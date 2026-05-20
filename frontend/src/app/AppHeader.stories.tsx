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
        story: "Desktop Small (700px) — between sm (640px) and md (768px). Hamburger still visible; dropdown switches from fixed full-width to compact absolute.",
      },
    },
  },
};

export const NavItemsEdge: Story = {
  parameters: {
    viewport: { defaultViewport: "nav-items-edge" },
    docs: {
      description: {
        story: "Edge case at 767px — one pixel below the md (768px) breakpoint. Hamburger visible, inline nav fully collapsed (zero layout width, opacity-0).",
      },
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop" },
    docs: {
      description: {
        story: "Desktop (900px) — between md (768px) and lg (1024px). Inline nav visible (Cards, Deck Explorer, Tools), hamburger collapsed, no wordmark yet.",
      },
    },
  },
};

export const DesktopWide: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop-wide" },
    docs: {
      description: {
        story: "Desktop Wide (1280px) — at lg+ (1024px+). Inline nav visible, hamburger collapsed, 'Noxian Netdecks' wordmark slides in. Full expanded header state.",
      },
    },
  },
};

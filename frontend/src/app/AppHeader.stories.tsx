import type { Meta, StoryObj } from "@storybook/react";
import App from "../App";
import { StorybookViewportFrame } from "../lib";

const meta = {
  title: "App/Header",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  render: () => (
    <StorybookViewportFrame viewport="Mobile">
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Mobile (393px) — hamburger visible, no wordmark. Opening the menu shows a fixed full-width dropdown with a backdrop overlay.",
      },
    },
  },
};

export const DesktopSmall: Story = {
  render: () => (
    <StorybookViewportFrame viewport="DesktopSmall">
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Desktop Small (700px, between sm=640 and md=768) — hamburger still visible. Opening the menu shows a compact absolute dropdown with no backdrop.",
      },
    },
  },
};

/**
 * Edge-case story at exactly 767px — one pixel below the @md (768px) container breakpoint.
 *
 * Verify:
 * - The hamburger button is fully visible and interactive.
 * - The inline nav items wrapper (`[data-nav-items]`) has zero layout width.
 *   Content is invisible (opacity-0) and must not push the hamburger out of place
 *   or cause the right-side actions div to grow wider than expected.
 * - No nav item labels, chevrons, or gaps are visually detectable.
 */
export const NavItemsEdge: Story = {
  render: () => (
    <StorybookViewportFrame viewport="DesktopSmall" width={767}>
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Edge case at 767px — one pixel before @md fires. The inline nav items wrapper must be fully collapsed (zero layout width, opacity-0). The hamburger button should appear identical to the DesktopSmall story. This story exists to catch max-w-0 overflow leaks on the inline-flex nav items container.",
      },
    },
  },
};

export const Desktop: Story = {
  render: () => (
    <StorybookViewportFrame viewport="Desktop">
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Desktop (900px, between md=768 and lg=1024) — inline nav visible (Cards, Deck Explorer, Tools), hamburger collapsed, wordmark hidden.",
      },
    },
  },
};

export const DesktopWide: Story = {
  render: () => (
    <StorybookViewportFrame viewport="DesktopWide">
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Desktop Wide (1280px, lg=1024+) — inline nav + wordmark 'Noxian Netdecks' slides in. Full expanded header state.",
      },
    },
  },
};

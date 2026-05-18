import type { Meta, StoryObj } from "@storybook/react";
import App from "./App";
import { StorybookViewportFrame } from "./lib";

const meta = {
  title: "Design System/Header",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  render: () => (
    <StorybookViewportFrame mode="desktop">
      <App />
    </StorybookViewportFrame>
  )
};

export const DesktopCompact: Story = {
  render: () => (
    <StorybookViewportFrame mode="desktop" desktopWidth={520}>
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Compact desktop header — narrow canvas collapses wordmark and expands search bar to fill."
      }
    }
  }
};

export const DesktopSearchStage: Story = {
  render: () => (
    <StorybookViewportFrame mode="desktop" desktopWidth={680}>
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Search-stage desktop header — inline Search button visible before full dropdown nav expands."
      }
    }
  }
};

export const DesktopNavStage: Story = {
  render: () => (
    <StorybookViewportFrame mode="desktop" desktopWidth={860}>
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Nav-stage desktop header — dropdown navigation visible before wordmark returns."
      }
    }
  }
};

export const Mobile: Story = {
  render: () => (
    <StorybookViewportFrame mode="mobile">
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mobile header — compact bar with hamburger menu. Use the menu button to open the nav drawer."
      }
    }
  }
};

export const MobileNarrow: Story = {
  render: () => (
    <StorybookViewportFrame mode="mobile" mobileWidth={320}>
      <App />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Narrow-width mobile header — smallest supported screen size."
      }
    }
  }
};

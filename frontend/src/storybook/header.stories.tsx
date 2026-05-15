import type { Meta, StoryObj } from "@storybook/react";
import { StorybookHeaderPreview, StorybookViewportFrame } from "../siteSystem";

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
      <StorybookHeaderPreview mode="desktop" />
    </StorybookViewportFrame>
  )
};

export const DesktopCompact: Story = {
  render: () => (
    <StorybookViewportFrame mode="desktop" desktopWidth={520}>
      <StorybookHeaderPreview mode="desktop" />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Compact desktop header preview for narrow canvases without changing the overall browser viewport."
      }
    }
  }
};

export const DesktopSearchStage: Story = {
  render: () => (
    <StorybookViewportFrame mode="desktop" desktopWidth={680}>
      <StorybookHeaderPreview mode="desktop" />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Compact desktop header with the inline Search button restored before the full dropdown navigation expands."
      }
    }
  }
};

export const DesktopNavStage: Story = {
  render: () => (
    <StorybookViewportFrame mode="desktop" desktopWidth={860}>
      <StorybookHeaderPreview mode="desktop" />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mid-stage desktop header with real dropdown navigation restored before the full wordmark returns."
      }
    }
  }
};

export const Mobile: Story = {
  render: () => (
    <StorybookViewportFrame mode="mobile">
      <StorybookHeaderPreview mode="mobile" />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Use the menu button to preview the mobile navigation state inside the fixed phone viewport."
      }
    }
  }
};

export const MobileNarrow: Story = {
  render: () => (
    <StorybookViewportFrame mode="mobile" mobileWidth={320}>
      <StorybookHeaderPreview mode="mobile" />
    </StorybookViewportFrame>
  ),
  parameters: {
    docs: {
      description: {
        story: "Narrow-width mobile header preview for the smallest screens."
      }
    }
  }
};

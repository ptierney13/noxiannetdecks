import type { Meta, StoryObj } from "@storybook/react";
import { HomePage } from "./home";
import { StorybookViewportFrame } from "./lib";

const meta = {
  title: "Design System/Home",
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
      <HomePage onNavigate={() => undefined} />
    </StorybookViewportFrame>
  )
};

export const Mobile: Story = {
  render: () => (
    <StorybookViewportFrame mode="mobile">
      <HomePage onNavigate={() => undefined} />
    </StorybookViewportFrame>
  )
};

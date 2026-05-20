import type { Meta, StoryObj } from "@storybook/react";
import { HomePage } from "./home";
import { StorybookViewportFrame } from "../lib";

const meta = {
  title: "Pages/Home",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  render: () => (
    <StorybookViewportFrame viewport="Mobile">
      <HomePage onNavigate={() => undefined} />
    </StorybookViewportFrame>
  ),
};

export const Desktop: Story = {
  render: () => (
    <StorybookViewportFrame viewport="Desktop">
      <HomePage onNavigate={() => undefined} />
    </StorybookViewportFrame>
  ),
};

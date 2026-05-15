import type { Meta, StoryObj } from "@storybook/react";
import { RouteSurfacePreview, StorybookViewportFrame } from "../siteSystem";

const meta = {
  title: "Design System/Shared/Route Surface",
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
      <RouteSurfacePreview />
    </StorybookViewportFrame>
  )
};

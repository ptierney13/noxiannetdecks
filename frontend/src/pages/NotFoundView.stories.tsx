import type { Meta, StoryObj } from "@storybook/react";
import { NotFoundView } from "./NotFoundView";

const meta = {
  title: "Pages/NotFoundView",
  component: NotFoundView,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onNavigate: () => {},
  },
} satisfies Meta<typeof NotFoundView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile" },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop" },
  },
};

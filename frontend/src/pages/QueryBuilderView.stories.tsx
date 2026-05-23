import type { Meta, StoryObj } from "@storybook/react";
import QueryBuilderView from "./QueryBuilderView";

const meta: Meta<typeof QueryBuilderView> = {
  title: "pages/QueryBuilderView",
  component: QueryBuilderView,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
  },
};
export default meta;

type Story = StoryObj<typeof QueryBuilderView>;

export const Default: Story = {
  name: "Default — no selections",
};

export const Mobile: Story = {
  name: "Mobile — no selections",
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

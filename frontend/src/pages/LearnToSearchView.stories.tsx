import type { Meta, StoryObj } from "@storybook/react";
import LearnToSearchView from "./LearnToSearchView";

const meta: Meta<typeof LearnToSearchView> = {
  title: "pages/LearnToSearchView",
  component: LearnToSearchView,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
  },
};
export default meta;

type Story = StoryObj<typeof LearnToSearchView>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

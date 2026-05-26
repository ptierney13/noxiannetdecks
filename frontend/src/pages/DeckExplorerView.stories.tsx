import type { Meta, StoryObj } from "@storybook/react";
import DeckExplorerView from "./DeckExplorerView";

const meta = {
  title: "Pages/DeckExplorerView",
  component: DeckExplorerView,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DeckExplorerView>;

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

import type { Meta, StoryObj } from "@storybook/react";
import DeckEditorPage from "./DeckEditorPage";

const meta = {
  title: "Pages/DeckEditor",
  component: DeckEditorPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DeckEditorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: {
      description: {
        story:
          "Mobile deck editor (393px). Empty state — no legend, champion, battlefields, or cards. Rune row is locked. Maindeck and sideboard show Add Cards buttons.",
      },
    },
  },
};

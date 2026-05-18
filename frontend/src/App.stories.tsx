import type { Meta, StoryObj } from "@storybook/react";
import App from "./App";

const meta = {
  title: "App/AppShell",
  component: App,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full application shell: sticky header with responsive nav stages, error banner, and route outlet. Navigation is live — use the header links to switch routes within the story.",
      },
    },
  },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

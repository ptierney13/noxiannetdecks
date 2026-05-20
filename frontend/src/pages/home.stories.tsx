import type { Meta, StoryObj } from "@storybook/react";
import { HomePage } from "./home";

const meta = {
  title: "Pages/Home",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  render: () => <HomePage onNavigate={() => undefined} />,
  parameters: {
    viewport: { defaultViewport: "mobile" },
  },
};

export const Desktop: Story = {
  render: () => <HomePage onNavigate={() => undefined} />,
  parameters: {
    viewport: { defaultViewport: "desktop" },
  },
};

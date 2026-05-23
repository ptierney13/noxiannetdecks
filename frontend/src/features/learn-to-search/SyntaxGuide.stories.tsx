import type { Meta, StoryObj } from "@storybook/react";
import { SyntaxGuide } from "./SyntaxGuide";

const meta: Meta<typeof SyntaxGuide> = {
  title: "features/learn-to-search/SyntaxGuide",
  component: SyntaxGuide,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof SyntaxGuide>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

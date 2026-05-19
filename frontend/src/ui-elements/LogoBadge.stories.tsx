import type { Meta, StoryObj } from "@storybook/react";
import { LogoBadge } from "./LogoBadge";

const meta = {
  title: "UI/LogoBadge",
  component: LogoBadge,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof LogoBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

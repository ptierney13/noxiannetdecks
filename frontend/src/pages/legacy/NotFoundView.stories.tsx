import type { Meta, StoryObj } from "@storybook/react";
import { NotFoundView } from "./NotFoundView";

const meta = {
  title: "Pages/Legacy/NotFoundView",
  component: NotFoundView,
  args: { onNavigate: () => {} },
} satisfies Meta<typeof NotFoundView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/react";
import { QueryChip } from "./QueryChip";

const meta = {
  title: "UI/QueryChip",
  component: QueryChip,
  args: {
    onAppend: () => {},
  },
} satisfies Meta<typeof QueryChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { text: "energy>=3" },
};

export const ShortQuery: Story = {
  args: { text: "t:unit" },
};

export const LongQuery: Story = {
  args: { text: 'name:"Jinx Explosive Personality"' },
};

import type { Meta, StoryObj } from "@storybook/react";
import { QuerySyntaxText } from "./QuerySyntaxText";

const meta: Meta<typeof QuerySyntaxText> = {
  title: "ui-elements/QuerySyntaxText",
  component: QuerySyntaxText,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof QuerySyntaxText>;

export const GroupedQuery: Story = {
  args: {
    query: "(d:body or d:fury) t:unit",
    className: "text-base leading-relaxed",
  },
};

export const QuotedQuery: Story = {
  args: {
    query: 'n:"loose cannon" o:"draw a card"',
    className: "text-base leading-relaxed",
  },
};

export const Empty: Story = {
  args: {
    query: "",
    emptyText: "Select filters below to build a query...",
  },
};

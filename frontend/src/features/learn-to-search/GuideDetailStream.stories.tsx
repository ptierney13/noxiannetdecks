import type { Meta, StoryObj } from "@storybook/react";
import { GuideDetailStream } from "./GuideDetailStream";
import type { LtsDetailItem } from "./GuideDetailCard";

const meta: Meta<typeof GuideDetailStream> = {
  title: "features/learn-to-search/GuideDetailStream",
  component: GuideDetailStream,
  parameters: { layout: "padded" },
  args: {
    onRemove: (item: LtsDetailItem) => console.log("remove:", item.label),
    onAppend: (t: string) => console.log("append:", t),
  },
};
export default meta;

type Story = StoryObj<typeof GuideDetailStream>;

const items: LtsDetailItem[] = [
  {
    label: "Name",
    category: "NAME",
    description: "Matches cards whose name contains this text.",
    query: "name:<text>",
    shorthand: "n:<text>",
    examples: ["n:jinx", "name:blitz*"],
  },
  {
    label: "Domain",
    category: "DOMAIN",
    description: "Matches cards that include this domain.",
    query: "d:Fury",
    examples: ["d:fury", "d:calm"],
  },
];

export const Empty: Story = { args: { items: [] } };

export const SingleItem: Story = { args: { items: [items[0]!] } };

export const MultipleItems: Story = { args: { items } };

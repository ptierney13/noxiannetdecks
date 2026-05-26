import type { Meta, StoryObj } from "@storybook/react";
import { GuideDetailStream } from "./GuideDetailStream";
import type { LtsDetailItem } from "./GuideDetailCard";
import { guideDetailFor } from "./guideDetails";

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
  guideDetailFor("name"),
  guideDetailFor("domain"),
];

export const Empty: Story = { args: { items: [] } };

export const SingleItem: Story = { args: { items: [items[0]!] } };

export const MultipleItems: Story = { args: { items } };

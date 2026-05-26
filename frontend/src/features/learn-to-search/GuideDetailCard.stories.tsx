import type { Meta, StoryObj } from "@storybook/react";
import { GuideDetailCard, type LtsDetailItem } from "./GuideDetailCard";
import { guideDetailFor } from "./guideDetails";

const meta: Meta<typeof GuideDetailCard> = {
  title: "features/learn-to-search/GuideDetailCard",
  component: GuideDetailCard,
  parameters: { layout: "padded" },
  args: { onAppend: (t: string) => console.log("append:", t) },
};
export default meta;

type Story = StoryObj<typeof GuideDetailCard>;

const fullItem: LtsDetailItem = guideDetailFor("name");

export const Full: Story = {
  args: { item: fullItem },
};

export const WithRemove: Story = {
  args: { item: fullItem, onRemove: () => console.log("remove") },
};

export const Minimal: Story = {
  args: {
    item: {
      label: "Rules text",
      description: "Searches within the card's rules text.",
    },
  },
};

export const DescriptionOnly: Story = {
  args: {
    item: {
      label: "Cost",
      description: "Matches by exact play cost. Use >=, <=, >, < for ranges.",
      examples: ["cost:5", "cost>=3", "cost<=2"],
    },
  },
};

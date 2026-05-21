import type { Meta, StoryObj } from "@storybook/react";
import { CardMetaChips } from "./CardMetaChips";
import type { CardRecord } from "../types";

const sampleCard = {
  id: "JNX-001",
  riftbound_id: "JNX",
  riot_name: "Jinx, Loose Cannon",
  clean_name: "Jinx",
  type: { supertype: "Champion", cardtype: "Unit", tags: ["Noxus"] },
  attributes: { cost: "{3}", energy: 3, might: 2, power: 4, domain: ["Fury"] },
  text: { rich: "When you play me, deal 1 damage.", flavour: null },
  set: { set_id: "OGN", label: "Origins" },
  collector_number: "001",
  rarity: "Rare",
  language: "en_us",
  finishes: ["foil", "nonfoil"],
  media: { image_url: "", accessibility_text: "Jinx card", artist: "Riot Games", layout: "portrait" },
  variant: { alternate_art: false, signed: false, overnumbered: false },
  tcgplayer_id: "123",
} as CardRecord;

const meta = {
  title: "UI/CardMetaChips",
  component: CardMetaChips,
  parameters: {
    layout: "centered",
  },
  args: {
    card: sampleCard,
  },
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-2xl bg-surface-2 p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CardMetaChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MultiDomain: Story = {
  args: {
    card: {
      ...sampleCard,
      attributes: { ...sampleCard.attributes, domain: ["Fury", "Mind"] },
    },
  },
};

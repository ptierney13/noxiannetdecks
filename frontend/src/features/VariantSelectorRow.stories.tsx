import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { VariantSelectorRow } from "./VariantSelectorRow";
import type { CardRecord } from "../types";

const baseCard = {
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

const altCard = {
  ...baseCard,
  id: "JNX-001-AA",
  set: { set_id: "OGN", label: "Origins" },
  collector_number: "201",
  variant: { alternate_art: true, signed: false, overnumbered: false },
} as CardRecord;

const meta = {
  title: "Features/VariantSelectorRow",
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-2xl bg-surface-2 p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Harness({ orientation = "horizontal" }: { orientation?: "horizontal" | "vertical" }) {
  const [activeKey, setActiveKey] = useState(`${baseCard.id}-foil`);

  return (
    <VariantSelectorRow
      cards={[baseCard, altCard]}
      activeKey={activeKey}
      orientation={orientation}
      onVariantSelect={(selection) => setActiveKey(selection.key)}
    />
  );
}

export const Horizontal: Story = {
  render: () => <Harness />,
};

export const Vertical: Story = {
  render: () => <Harness orientation="vertical" />,
};

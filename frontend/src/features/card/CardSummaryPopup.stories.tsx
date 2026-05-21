import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CardSummaryPopup } from "./CardSummaryPopup";
import type { CardRecord } from "../../types";

const sampleCard = {
  id: "JNX-001",
  riftbound_id: "JNX",
  riot_name: "Jinx, Loose Cannon",
  clean_name: "Jinx",
  type: { supertype: "Champion", cardtype: "Unit", tags: ["Noxus"] },
  attributes: { cost: "{3}", energy: 3, might: 2, power: 4, domain: ["Fury"] },
  text: {
    rich: "When you play me, deal 1 damage to an enemy unit.\nIf that unit is damaged, draw a card.",
    flavour: null,
  },
  set: { set_id: "OGN", label: "Origins" },
  collector_number: "001",
  rarity: "Rare",
  language: "en_us",
  finishes: ["foil", "nonfoil"],
  media: { image_url: "", accessibility_text: "Jinx card", artist: "Riot Games", layout: "portrait" },
  variant: { alternate_art: false, signed: false, overnumbered: false },
  tcgplayer_id: "123",
} as CardRecord;

const alternateArtCard = {
  ...sampleCard,
  id: "JNX-201",
  collector_number: "201",
  variant: { alternate_art: true, signed: false, overnumbered: false },
} as CardRecord;

const meta = {
  title: "Features/CardSummaryPopup",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function PopupHarness({ group = [sampleCard] }: { group?: CardRecord[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-app-bg p-8 text-text-primary">
      <button
        type="button"
        className="rounded-xl bg-accent px-4 py-3 font-bold text-white"
        onClick={() => setOpen(true)}
      >
        Open popup
      </button>
      {open ? (
        <CardSummaryPopup
          group={group}
          initialCard={group[0] ?? sampleCard}
          initialFinish="foil"
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

export const SingleCard: Story = {
  render: () => <PopupHarness />,
};

export const MultipleVariants: Story = {
  render: () => <PopupHarness group={[sampleCard, alternateArtCard]} />,
};

export const LongRulesText: Story = {
  render: () => (
    <PopupHarness
      group={[
        {
          ...sampleCard,
          text: {
            rich:
              "When you play me, choose one:\n- Deal 1 damage to an enemy unit.\n- Draw a card, then discard a card.\n- If you have attacked this turn, ready a unit.",
            flavour: null,
          },
        } as CardRecord,
      ]}
    />
  ),
};

export const MissingImage: Story = {
  render: () => <PopupHarness group={[sampleCard]} />,
};

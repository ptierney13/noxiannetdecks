import type { Meta, StoryObj } from "@storybook/react";
import { TextFieldGuide } from "./TextFieldGuide";
import type { QueryFieldGuide } from "../../types";

const meta: Meta<typeof TextFieldGuide> = {
  title: "features/learn-to-search/TextFieldGuide",
  component: TextFieldGuide,
  parameters: { layout: "padded" },
  args: {
    onSelect: (item) => console.log("selected:", item.label),
    onAppend: (t: string) => console.log("append:", t),
  },
};
export default meta;

type Story = StoryObj<typeof TextFieldGuide>;

const sampleFields: QueryFieldGuide[] = [
  { property: "Name",      query: "name:<text>",   shorthand: "n:<text>",  searches: "Matches cards whose name contains this text.", example: "n:jinx"       },
  { property: "Cost",      query: "cost:<n>",       shorthand: null,        searches: "Matches by exact play cost.",                   example: "cost:5"       },
  { property: "Energy",    query: "energy:<n>",     shorthand: "e:<n>",     searches: "Matches by energy value.",                      example: "e:5"          },
  { property: "Power",     query: "power:<n>",      shorthand: "p:<n>",     searches: "Matches by power value.",                       example: "p:1"          },
  { property: "Type line", query: "t:<text>",       shorthand: null,        searches: "Matches any word in the full type line.",        example: "t:champion"   },
  { property: "Card type", query: "cardtype:<text>",shorthand: "ct:<text>", searches: "Matches the card type.",                        example: "ct:unit"      },
  { property: "Supertype", query: "u:<text>",       shorthand: null,        searches: "Matches the supertype.",                        example: "u:champion"   },
  { property: "Tag",       query: "tag:<text>",     shorthand: null,        searches: "Matches a type tag.",                           example: "tag:dragon"   },
  { property: "Rarity",    query: "rarity:<r>",     shorthand: null,        searches: "Filters by rarity.",                            example: "rarity:rare"  },
];

export const Populated: Story = { args: { fields: sampleFields } };

export const Empty: Story = { args: { fields: [] } };

export const Mobile: Story = {
  args: { fields: sampleFields },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

import type { Meta, StoryObj } from "@storybook/react";
import { SyntaxQueryChip } from "./SyntaxQueryChip";

const meta: Meta<typeof SyntaxQueryChip> = {
  title: "ui-elements/SyntaxQueryChip",
  component: SyntaxQueryChip,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof SyntaxQueryChip>;

export const DisplayOnly: Story = {
  name: "Display-only (QB built query box style)",
  args: { query: "t:unit c>=3 -tag:dragon" },
};

export const Clickable: Story = {
  name: "Clickable (LTS example chip style)",
  args: { query: "name:jinx", onClick: (q: string) => console.log("clicked:", q) },
};

export const WithOR: Story = {
  name: "OR combination",
  args: { query: "(d:fury or d:calm) t:unit" },
};

export const NegationAndContains: Story = {
  name: "Negation + contains vs exact",
  args: { query: 'name:jinx rarity:Rare -tag:dragon' },
};

export const DroppedToken: Story = {
  name: "Dropped / unknown token",
  args: { query: "unknownfield:foo name:jinx" },
};

export const NumericComparison: Story = {
  name: "Numeric comparison",
  args: { query: "c>=3 e<=2 m=5" },
};

export const ExactMatch: Story = {
  name: 'Exact match (= operator)',
  args: { query: 'name="Jinx" d=fury' },
};

export const ClickableSet: Story = {
  name: "Clickable set",
  render: () => (
    <div className="flex flex-wrap gap-2">
      {["name:jinx", "d:fury", "c>=3 t:unit", "-tag:dragon", "rarity:Rare"].map((q) => (
        <SyntaxQueryChip key={q} query={q} onClick={(v) => console.log(v)} />
      ))}
    </div>
  ),
};

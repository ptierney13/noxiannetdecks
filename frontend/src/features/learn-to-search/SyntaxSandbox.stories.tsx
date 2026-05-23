import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SyntaxSandbox } from "./SyntaxSandbox";

const meta: Meta<typeof SyntaxSandbox> = {
  title: "features/learn-to-search/SyntaxSandbox",
  component: SyntaxSandbox,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof SyntaxSandbox>;

function Controlled({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  return <SyntaxSandbox query={q} onChange={setQ} />;
}

export const Empty: Story = { render: () => <Controlled initial="" /> };

export const UnitCostFilter: Story = { render: () => <Controlled initial="t:unit c>=3 -tag:dragon" /> };

export const NameContains: Story = { render: () => <Controlled initial="name:jinx" /> };

export const ExactName: Story = { render: () => <Controlled initial='name="Jinx"' /> };

export const DomainContains: Story = { render: () => <Controlled initial="d:purple" /> };

export const DomainExact: Story = { render: () => <Controlled initial="d=purple" /> };

export const GroupedOr: Story = { render: () => <Controlled initial="(d:body or d:fury) t:unit" /> };

export const FinishFilter: Story = { render: () => <Controlled initial="unique:art is:foil" /> };

export const PartialUnknown: Story = { render: () => <Controlled initial="unknownfield:foo name:jinx" /> };

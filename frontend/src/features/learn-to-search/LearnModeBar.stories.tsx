import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LearnModeBar, type LearnTab } from "./LearnModeBar";

const meta: Meta<typeof LearnModeBar> = {
  title: "features/learn-to-search/LearnModeBar",
  component: LearnModeBar,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof LearnModeBar>;

function Controlled({ initialTab }: { initialTab: LearnTab }) {
  const [active, setActive] = useState<LearnTab>(initialTab);
  return <LearnModeBar active={active} onChange={setActive} />;
}

export const VisualActive: Story = {
  render: () => <Controlled initialTab="visual-guide" />,
};

export const TextActive: Story = {
  render: () => <Controlled initialTab="text-guide" />,
};

export const SyntaxActive: Story = {
  render: () => <Controlled initialTab="syntax-guide" />,
};

export const Mobile: Story = {
  render: () => <Controlled initialTab="visual-guide" />,
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

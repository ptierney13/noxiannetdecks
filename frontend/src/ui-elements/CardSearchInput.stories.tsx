import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CardSearchInput } from "./CardSearchInput";

const meta = {
  title: "UI/CardSearchInput",
  component: CardSearchInput,
  parameters: { layout: "padded" },
  args: {
    value: "",
    onChange: () => undefined,
    onSubmit: () => undefined,
  },
} satisfies Meta<typeof CardSearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <CardSearchInput
      value={value}
      onChange={setValue}
      onSubmit={(v) => console.log("Submit:", v)}
    />
  );
}

export const Empty: Story = {
  render: () => <Controlled />,
};

export const WithValue: Story = {
  render: () => <Controlled initialValue="jinx energy>=3" />,
  parameters: {
    docs: { description: { story: "Clear button visible when input has a value." } },
  },
};

export const NarrowViewport: Story = {
  render: () => (
    <div style={{ width: 240 }}>
      <Controlled />
    </div>
  ),
  parameters: {
    docs: { description: { story: "240px container — input and button remain usable at narrow widths." } },
  },
};

export const WideViewport: Story = {
  render: () => (
    <div style={{ width: 600 }}>
      <Controlled />
    </div>
  ),
  parameters: {
    docs: { description: { story: "600px container — full input width with standard placeholder." } },
  },
};

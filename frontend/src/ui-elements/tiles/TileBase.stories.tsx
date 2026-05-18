import type { Meta, StoryObj } from "@storybook/react";
import { TileBase } from "./TileBase";

const meta = {
  title: "UI/TileBase",
  component: TileBase,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="[container-type:inline-size] max-w-[420px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TileBase>;

export default meta;
type Story = StoryObj<typeof meta>;

const placeholder = (
  <>
    <p className="m-0 text-text-primary font-bold">Tile title</p>
    <p className="m-0 text-text-secondary text-[0.94rem]">Tile description goes here.</p>
  </>
);

export const Default: Story = {
  args: { children: placeholder },
  render: () => (
    <TileBase href="/example" onNavigate={() => undefined} className="gap-4 p-5">
      {placeholder}
    </TileBase>
  ),
};

export const AsDiv: Story = {
  args: { children: placeholder },
  render: () => (
    <TileBase className="gap-4 p-5">
      {placeholder}
    </TileBase>
  ),
};


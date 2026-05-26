import type { Meta, StoryObj } from "@storybook/react";
import { ToolSection, ToolSubsection } from "./ToolSection";
import { QueryChip } from "./QueryChip";

const meta: Meta<typeof ToolSection> = {
  title: "ui-elements/ToolSection",
  component: ToolSection,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof ToolSection>;

export const Default: Story = {
  render: () => (
    <ToolSection title="Card Type & Tags" hint="ct:unit">
      <ToolSubsection label="Card Type" hint="ct:Unit" raised>
        <div className="flex flex-wrap gap-2">
          {["Unit", "Spell", "Gear"].map((label) => (
            <button
              key={label}
              type="button"
              className="inline-flex min-h-9 items-center rounded-full border border-border-default bg-surface-3 px-3 text-sm font-bold text-text-secondary"
            >
              {label}
            </button>
          ))}
        </div>
      </ToolSubsection>
    </ToolSection>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <ToolSection title="Syntax Examples" hint="or ( )" collapsible>
      <ToolSubsection label="Try" raised>
        <div className="flex flex-wrap gap-2">
          <QueryChip text="(d:body or d:fury) t:unit" onAppend={(query) => console.log(query)} />
          <QueryChip text='n:"loose cannon"' onAppend={(query) => console.log(query)} />
        </div>
      </ToolSubsection>
    </ToolSection>
  ),
};

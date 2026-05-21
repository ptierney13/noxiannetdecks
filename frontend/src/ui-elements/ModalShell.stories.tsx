import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ModalShell } from "./ModalShell";

const meta = {
  title: "UI/ModalShell",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ModalHarness() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-app-bg p-8 text-text-primary">
      <button
        type="button"
        className="rounded-xl bg-accent px-4 py-3 font-bold text-white"
        onClick={() => setOpen(true)}
      >
        Open modal
      </button>
      {open ? (
        <ModalShell label="Example modal" onClose={() => setOpen(false)}>
          <div className="p-8 pr-20">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-accent-warm">
              Generic shell
            </p>
            <h1 className="mt-3 text-3xl font-black">Reusable dialog frame</h1>
            <p className="mt-4 max-w-xl text-text-secondary">
              Click the backdrop, press Escape, or use the close button to dismiss this shell.
            </p>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

export const Default: Story = {
  render: () => <ModalHarness />,
};

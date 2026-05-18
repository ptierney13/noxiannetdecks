import type { Meta, StoryObj } from "@storybook/react";
import { SearchIcon, CardsIcon, MenuIcon, ChevronIcon } from "./Icon";

const meta = {
  title: "UI/Icons",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {
  render: () => (
    <span style={{ display: "inline-block", width: 24, height: 24, color: "white" }}>
      <SearchIcon />
    </span>
  ),
};

export const Cards: Story = {
  render: () => (
    <span style={{ display: "inline-block", width: 24, height: 24, color: "white" }}>
      <CardsIcon />
    </span>
  ),
};

export const HamburgerMenuClosed: Story = {
  render: () => (
    <span style={{ display: "inline-block", color: "white" }}>
      <MenuIcon open={false} />
    </span>
  ),
};

export const HamburgerMenuOpen: Story = {
  render: () => (
    <span style={{ display: "inline-block", color: "white" }}>
      <MenuIcon open={true} />
    </span>
  ),
};

export const ChevronCollapsed: Story = {
  render: () => (
    <span style={{ display: "inline-block", width: 24, height: 24, color: "white" }}>
      <ChevronIcon expanded={false} />
    </span>
  ),
};

export const ChevronExpanded: Story = {
  render: () => (
    <span style={{ display: "inline-block", width: 24, height: 24, color: "white" }}>
      <ChevronIcon expanded={true} />
    </span>
  ),
};

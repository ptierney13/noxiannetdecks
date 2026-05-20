import type { Meta, StoryObj } from "@storybook/react";
import { SearchIcon, CardsIcon, MenuIcon, ChevronIcon, TradeIcon, SealedIcon, NoxianLogoIcon } from "./Icon";

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

export const Trade: Story = {
  render: () => (
    <span style={{ display: "inline-block", width: 24, height: 24, color: "white" }}>
      <TradeIcon />
    </span>
  ),
};

export const Sealed: Story = {
  render: () => (
    <span style={{ display: "inline-block", width: 24, height: 24, color: "white" }}>
      <SealedIcon />
    </span>
  ),
};

export const NoxianLogoFull: Story = {
  name: "NoxianLogo / Full (128px)",
  render: () => <NoxianLogoIcon />,
};

export const NoxianLogoMedium: Story = {
  name: "NoxianLogo / Medium (64px)",
  render: () => <NoxianLogoIcon className="w-16 h-16" />,
};

export const NoxianLogoHeader: Story = {
  name: "NoxianLogo / Header (35px)",
  render: () => <NoxianLogoIcon className="w-[35px] h-[35px]" />,
};

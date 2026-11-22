import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchIcon, PlusIcon, TrashIcon } from "lucide-react";

import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Feedback/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link", "teal", "sage"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "xl", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    children: "Click me",
    variant: "default",
    size: "default",
  },
};

export const VariantDefault: Story = {
  name: "Variant / Default",
  args: { variant: "default", children: "Default" },
};

export const VariantDestructive: Story = {
  name: "Variant / Destructive",
  args: { variant: "destructive", children: "Destructive" },
};

export const VariantOutline: Story = {
  name: "Variant / Outline",
  args: { variant: "outline", children: "Outline" },
};

export const VariantSecondary: Story = {
  name: "Variant / Secondary",
  args: { variant: "secondary", children: "Secondary" },
};

export const VariantGhost: Story = {
  name: "Variant / Ghost",
  args: { variant: "ghost", children: "Ghost" },
};

export const VariantLink: Story = {
  name: "Variant / Link",
  args: { variant: "link", children: "Link" },
};

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const SizeDefault: Story = {
  name: "Size / Default",
  args: { size: "default", children: "Default size" },
};

export const SizeXs: Story = {
  name: "Size / XS",
  args: { size: "xs", children: "Extra small" },
};

export const SizeSm: Story = {
  name: "Size / SM",
  args: { size: "sm", children: "Small" },
};

export const SizeLg: Story = {
  name: "Size / LG",
  args: { size: "lg", children: "Large" },
};

export const AllSizes: Story = {
  name: "All Sizes",
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">XS</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const IconSizes: Story = {
  name: "Icon Sizes",
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="icon-xs" aria-label="Search extra small">
        <SearchIcon />
      </Button>
      <Button size="icon-sm" aria-label="Search small">
        <SearchIcon />
      </Button>
      <Button size="icon" aria-label="Search default">
        <SearchIcon />
      </Button>
      <Button size="icon-lg" aria-label="Search large">
        <SearchIcon />
      </Button>
    </div>
  ),
};

export const WithLeadingIcon: Story = {
  name: "With Leading Icon",
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button>
        <PlusIcon />
        Add item
      </Button>
      <Button variant="outline">
        <SearchIcon />
        Search
      </Button>
      <Button variant="destructive">
        <TrashIcon />
        Delete
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

export const AllVariantsDisabled: Story = {
  name: "All Variants Disabled",
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default" disabled>
        Default
      </Button>
      <Button variant="destructive" disabled>
        Destructive
      </Button>
      <Button variant="outline" disabled>
        Outline
      </Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
      <Button variant="ghost" disabled>
        Ghost
      </Button>
      <Button variant="link" disabled>
        Link
      </Button>
    </div>
  ),
};

export const VariantTeal: Story = {
  name: "Variant / Teal",
  args: { variant: "teal", children: "Teal" },
};

export const VariantSage: Story = {
  name: "Variant / Sage",
  args: { variant: "sage", children: "Sage" },
};

export const SizeXL: Story = {
  name: "Size / XL",
  args: { size: "xl", children: "Extra Large" },
};

export const AsChildLink: Story = {
  name: "AsChild (renders as <a>)",
  render: () => (
    <Button asChild>
      <a href="/docs">Link rendered as button</a>
    </Button>
  ),
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Icon, type IconName } from "./icon";

const meta = {
  title: "Foundation/Icon",
  component: Icon,
  parameters: { layout: "centered" },
  argTypes: {
    name: { control: "text" },
    size: { control: { type: "number", min: 12, max: 64 } },
    filled: { control: "boolean" },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

const ALL_ICONS: IconName[] = [
  "dumbbell",
  "check",
  "check-circle",
  "clock",
  "timer",
  "flame",
  "trend",
  "bar-chart",
  "plus",
  "plus-circle",
  "minus",
  "x",
  "x-circle",
  "arrow-left",
  "arrow-up",
  "arrow-down",
  "chevron-right",
  "chevron-down",
  "chevron-up",
  "home",
  "history",
  "calendar",
  "settings",
  "user",
  "pencil",
  "trash",
  "grip",
  "play",
  "zap",
  "moon",
  "sun",
  "rotate-ccw",
  "more-vertical",
  "info",
  "save",
];

export const Default: Story = {
  args: { name: "check", size: 24 },
};

export const AllIcons: Story = {
  args: { name: "check" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 48px)", gap: "16px" }}>
      {ALL_ICONS.map((name) => (
        <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <Icon name={name} size={24} aria-label={name} />
          <span style={{ fontSize: "9px" }}>{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const SizeSm: Story = { args: { name: "check", size: 16 } };
export const SizeMd: Story = { args: { name: "check", size: 20 } };
export const SizeLg: Story = { args: { name: "check", size: 32 } };
export const Filled: Story = { args: { name: "check-circle", size: 24, filled: true } };

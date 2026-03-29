import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileCard } from "./profile-card";

const meta: Meta<typeof ProfileCard> = {
  title: "Components/ProfileCard",
  component: ProfileCard,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    name: { control: "text" },
    email: { control: "text" },
    avatarUrl: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileCard>;

export const Default: Story = {
  args: {
    name: "Alice Doe",
    email: "alice@example.com",
    avatarUrl: "https://i.pravatar.cc/80?u=alice",
  },
};

export const WithoutAvatar: Story = {
  args: {
    name: "Bob Smith",
    email: "bob@example.com",
  },
};

export const LongName: Story = {
  args: {
    name: "A Very Long Username That Could Overflow",
    email: "longname@example.com",
    avatarUrl: "https://i.pravatar.cc/80?u=long",
  },
};

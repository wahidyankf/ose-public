import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Navigation } from "./Navigation";

const meta: Meta<typeof Navigation> = {
  title: "Components/Navigation",
  component: Navigation,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: {
        pathname: "/dashboard",
      },
    },
  },
  args: {
    logout: async () => {},
  },
};

export default meta;
type Story = StoryObj<typeof Navigation>;

export const Default: Story = {};

export const CollapsedSidebar: Story = {
  decorators: [
    (Story) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebarCollapsed", "true");
      }
      return <Story />;
    },
  ],
};

export const ExpandedSidebar: Story = {
  decorators: [
    (Story) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebarCollapsed", "false");
      }
      return <Story />;
    },
  ],
};

export const OnMembersPage: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/dashboard/members",
      },
    },
  },
};

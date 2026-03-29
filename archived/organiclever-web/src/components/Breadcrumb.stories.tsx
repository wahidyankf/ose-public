import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import Breadcrumb from "./Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/dashboard",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const DashboardRoot: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/dashboard",
      },
    },
  },
};

export const DashboardMembers: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/dashboard/members",
      },
    },
  },
};

export const DashboardMembersProfile: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/dashboard/members/profile",
      },
    },
  },
};

export const DashboardSettings: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/dashboard/settings",
      },
    },
  },
};

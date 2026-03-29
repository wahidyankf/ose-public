import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LoginPage from "./page";

const meta: Meta<typeof LoginPage> = {
  title: "Pages/Login",
  component: LoginPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/login",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LoginPage>;

export const Default: Story = {};

export const WithError: Story = {
  decorators: [
    (Story) => {
      // Simulate error state by rendering with a mock fetch that fails
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      const cleanup = () => {
        globalThis.fetch = originalFetch;
      };
      setTimeout(cleanup, 5000);
      return <Story />;
    },
  ],
};

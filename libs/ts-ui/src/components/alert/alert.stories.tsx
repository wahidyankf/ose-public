import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AlertCircle, CheckCircle } from "lucide-react";

import { Alert, AlertTitle, AlertDescription } from "./alert";

const meta: Meta<typeof Alert> = {
  title: "Feedback/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "success", "warning", "info"],
    },
  },
  args: {
    variant: "default",
  },
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components to your app using the cli.</AlertDescription>
    </Alert>
  ),
};

export const Interactive: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Alert title</AlertTitle>
      <AlertDescription>Alert description goes here with more details about the message.</AlertDescription>
    </Alert>
  ),
};

export const VariantDefault: Story = {
  name: "Variant / Default",
  render: () => (
    <Alert variant="default">
      <AlertTitle>Default alert</AlertTitle>
      <AlertDescription>This is a default informational alert message.</AlertDescription>
    </Alert>
  ),
};

export const VariantDestructive: Story = {
  name: "Variant / Destructive",
  render: () => (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
    </Alert>
  ),
};

export const WithIconDefault: Story = {
  name: "With Icon / Default",
  render: () => (
    <Alert variant="default">
      <CheckCircle />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Your changes have been saved successfully.</AlertDescription>
    </Alert>
  ),
};

export const WithIconDestructive: Story = {
  name: "With Icon / Destructive",
  render: () => (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again later.</AlertDescription>
    </Alert>
  ),
};

export const TitleOnly: Story = {
  name: "Title Only",
  render: () => (
    <Alert>
      <AlertTitle>Simple notification</AlertTitle>
    </Alert>
  ),
};

export const DescriptionOnly: Story = {
  name: "Description Only",
  render: () => (
    <Alert>
      <AlertDescription>A brief message without a title.</AlertDescription>
    </Alert>
  ),
};

export const VariantSuccess: Story = {
  name: "Variant / Success",
  render: () => (
    <Alert variant="success">
      <CheckCircle />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Operation completed successfully.</AlertDescription>
    </Alert>
  ),
};

export const VariantWarning: Story = {
  name: "Variant / Warning",
  render: () => (
    <Alert variant="warning">
      <AlertCircle />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>Proceed with caution — this action may have consequences.</AlertDescription>
    </Alert>
  ),
};

export const VariantInfo: Story = {
  name: "Variant / Info",
  render: () => (
    <Alert variant="info">
      <AlertTitle>Info</AlertTitle>
      <AlertDescription>Here is some useful information for you.</AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="default">
        <CheckCircle />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>Informational message for the user.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Destructive</AlertTitle>
        <AlertDescription>Something went wrong. Please try again.</AlertDescription>
      </Alert>
    </div>
  ),
};

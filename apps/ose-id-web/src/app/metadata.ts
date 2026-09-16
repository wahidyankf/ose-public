import type { Metadata } from "next";

export const siteMetadata: Metadata = {
  title: {
    default: "OSE ID service status",
    template: "%s | OSE ID",
  },
  description: "Local status surface for the OSE ID identity service. Authentication is not enabled in this build.",
  robots: { index: false, follow: false },
};

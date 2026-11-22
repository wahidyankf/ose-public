import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

// next/font/google downloads and hashes fonts at build time; the unit double returns the CSS variable name only.
vi.mock("next/font/google", () => ({
  Nunito: () => ({ variable: "--font-nunito" }),
  JetBrains_Mono: () => ({ variable: "--font-jetbrains-mono" }),
}));

import RootLayout, { metadata } from "@/app/layout";
import { siteMetadata } from "@/app/metadata";

describe("RootLayout", () => {
  it("renders the document with the English language, the font variables, and the page as body content", () => {
    const tree = RootLayout({ children: "page content" }) as ReactElement<{
      lang: string;
      className: string;
      suppressHydrationWarning: boolean;
      children: ReactElement<{ children: string }>;
    }>;

    expect(tree.type).toBe("html");
    expect(tree.props.lang).toBe("en");
    expect(tree.props.className).toBe("--font-nunito --font-jetbrains-mono");
    expect(tree.props.suppressHydrationWarning).toBe(true);
    expect(tree.props.children.type).toBe("body");
    expect(tree.props.children.props.children).toBe("page content");
  });

  it("exports the site metadata for the document head", () => {
    expect(metadata).toBe(siteMetadata);
  });
});

import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteMetadata } from "./metadata";

export const metadata: Metadata = siteMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

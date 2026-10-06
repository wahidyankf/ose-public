import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { TRPCProvider } from "@/lib/trpc/provider";
import { SearchProvider } from "@/features/search/shell/search-provider";
import { SITE_URL } from "@/lib/site-url";
import { TooltipProvider } from "@open-sharia-enterprise/web-ui";
import "./globals.css";

export const DEFAULT_THEME = "light";

export const metadata: Metadata = {
  title: {
    default: "OSE Platform",
    template: "%s | OSE Platform",
  },
  description:
    "Open-source platform for Sharia-compliant enterprise solutions. Starting with Indonesian regulations, expanding to ERP, fintech, and global markets.",
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme={DEFAULT_THEME} enableSystem>
          <TRPCProvider>
            <TooltipProvider>
              <SearchProvider>{children}</SearchProvider>
            </TooltipProvider>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

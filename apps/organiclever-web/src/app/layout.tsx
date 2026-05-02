import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nunito, JetBrains_Mono } from "next/font/google";
import { siteMetadata } from "./metadata";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning silences React 19's mismatch error on the
    // `data-theme` attribute we set client-side via the inline script below
    // (the standard Next.js theme-flash pattern; the warning is benign).
    <html lang="en" className={`${nunito.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        {/* Inline script runs before React hydration to avoid dark mode flash.
              Reads ol_dark_mode from localStorage and sets data-theme immediately. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=localStorage.getItem('ol_dark_mode')==='true';document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}

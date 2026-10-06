import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import "katex/dist/katex.min.css";
import "../globals.css";
import { SUPPORTED_LOCALES, isValidLocale } from "@/features/i18n/core/config";
import { TRPCProvider } from "@/lib/trpc/provider";
import { SearchProvider } from "@/features/search/shell/search-provider";
import { SITE_URL } from "@/lib/site-url";
import { Header } from "@/features/app-shell/shell/header";
import { Footer } from "@/features/app-shell/shell/footer";
import { SkipLink } from "@/features/app-shell/shell/skip-link";
import { MobileNavOpenProvider } from "@/features/app-shell/shell/mobile-nav-open-provider";

export const metadata: Metadata = {
  title: {
    default: "AyoKoding",
    template: "%s | AyoKoding",
  },
  description:
    "Bilingual educational platform for software engineering - helping the Indonesian tech community learn and grow",
  metadataBase: new URL(SITE_URL),
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <html lang={(await params).locale} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TRPCProvider>
            <SearchProvider>
              <MobileNavOpenProvider>
                <SkipLink locale={locale} />
                <div className="flex min-h-screen flex-col">
                  <Header locale={locale} />
                  <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                    {children}
                  </main>
                  <Footer locale={locale} />
                </div>
              </MobileNavOpenProvider>
            </SearchProvider>
          </TRPCProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-1NHDR7S3GV" />
      </body>
    </html>
  );
}

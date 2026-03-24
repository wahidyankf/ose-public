import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { TRPCProvider } from "@/lib/trpc/provider";
import { SearchProvider } from "@/components/search/search-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    notFound();
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TRPCProvider>
        <SearchProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded"
          >
            Skip to content
          </a>
          <div className="flex min-h-screen flex-col">
            <Header locale={locale} />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer locale={locale} />
          </div>
        </SearchProvider>
      </TRPCProvider>
    </ThemeProvider>
  );
}

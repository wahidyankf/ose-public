"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Button } from "@open-sharia-enterprise/web-ui";
import { ThemeToggle } from "@/features/app-shell/shell/theme-toggle";
import { LanguageSwitcher } from "@/features/i18n/shell/language-switcher";
import { MobileNav } from "@/features/app-shell/shell/mobile-nav";
import { useSearchOpen } from "@/features/search/shell/use-search";
import { t } from "@/features/i18n/core/translations";
import type { Locale } from "@/features/i18n/core/config";
import { PRIMARY_NAV_LINKS } from "@/features/app-shell/core/nav-links";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { useMobileNavOpen } from "@/features/app-shell/shell/use-mobile-nav-open";
import {
  EMPTY_COURSE_PATH_CLIENT_DATA,
  type CoursePathClientData,
} from "@/features/course-paths/shell/course-path-nav";

interface HeaderProps {
  locale: string;
  // Course-paths plan (Cycle 2.9) — optional/additive, threaded through to MobileNav so it can
  // detect an active path context and swap its drawer content.
  pathData?: CoursePathClientData;
}

export function Header({ locale, pathData = EMPTY_COURSE_PATH_CLIENT_DATA }: HeaderProps) {
  const { setOpen: setSearchOpen } = useSearchOpen();
  // Course-paths plan (Cycle 2.9) — lifted from a local useState into a shared context so
  // PathBanner's "open path course list" trigger can open this exact same drawer.
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileNavOpen();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-2 px-4 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={(event) => setMobileOpen(true, event.currentTarget)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href={`/${locale}`} className="text-lg font-bold tracking-tight">
          AyoKoding
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {PRIMARY_NAV_LINKS.map((link) => {
            const href = link.hrefFor(locale as Locale);
            // Active when on the exact page or anywhere within its subtree.
            // aria-current="page" only when on the exact URL — deeper pages get
            // visual emphasis only (aria-current="page" on a non-exact URL is incorrect ARIA).
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={link.labelKey}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  isActive ? "text-foreground underline decoration-primary underline-offset-4" : "text-foreground/80",
                )}
              >
                {t(locale as Locale, link.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          className="hidden gap-2 text-muted-foreground sm:flex"
          onClick={(event) => setSearchOpen(true, event.currentTarget)}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">{t(locale as Locale, "search")}</span>
          <kbd className="pointer-events-none ml-2 hidden rounded border bg-muted px-1.5 font-mono text-xs select-none lg:inline-block">
            {/* Command-key glyph (U+2318, the Mac "place of interest sign") is built from its numeric
                codepoint so the repository's source convention does not encounter the literal
                character in this .tsx file. */}
            {String.fromCharCode(0x2318)}K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={(event) => setSearchOpen(true, event.currentTarget)}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Suspense fallback={null}>
          <LanguageSwitcher locale={locale} />
        </Suspense>
        <ThemeToggle />

        <Suspense fallback={null}>
          <MobileNav locale={locale} open={mobileOpen} onOpenChange={setMobileOpen} pathData={pathData} />
        </Suspense>
      </div>
    </header>
  );
}

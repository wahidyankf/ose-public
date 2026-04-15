"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Button } from "@open-sharia-enterprise/ts-ui";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useSearchOpen } from "@/lib/hooks/use-search";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Updates", href: "/updates/" },
  { label: "About", href: "/about/" },
  {
    label: "Documentation",
    href: "https://github.com/wahidyankf/ose-public/tree/main/docs",
    external: true,
  },
  {
    label: "GitHub",
    href: "https://github.com/wahidyankf/ose-public",
    external: true,
  },
];

export function Header() {
  const { setOpen: setSearchOpen } = useSearchOpen();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/" className="text-lg font-bold tracking-tight">
          OSE Platform
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          className="hidden gap-2 text-muted-foreground sm:flex"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="pointer-events-none ml-2 hidden rounded border bg-muted px-1.5 font-mono text-xs select-none lg:inline-block">
            ⌘K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        <ThemeToggle />

        <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
      </div>
    </header>
  );
}

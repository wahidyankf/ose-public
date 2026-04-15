import { t } from "@/lib/i18n/translations";
import type { Locale } from "@/lib/i18n/config";

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          &copy; {year} AyoKoding &middot;{" "}
          <a
            href="https://github.com/wahidyankf/ose-public/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            FSL-1.1-MIT
          </a>
        </p>
        <a
          href="https://github.com/wahidyankf/ose-public"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          {t(locale as Locale, "openSourceProject")}
        </a>
      </div>
    </footer>
  );
}

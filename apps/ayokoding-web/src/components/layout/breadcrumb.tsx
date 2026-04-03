import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbProps {
  locale: string;
  slug: string;
  segments: { label: string; slug: string }[];
}

export function Breadcrumb({ locale, segments }: BreadcrumbProps) {
  // Exclude last segment — the current page title is already shown in the h1
  const ancestorSegments = segments.slice(0, -1);
  if (ancestorSegments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {ancestorSegments.map((segment, i) => (
          <li key={segment.slug} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
            <Link href={`/${locale}/${segment.slug}`} className="hover:text-foreground">
              {segment.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

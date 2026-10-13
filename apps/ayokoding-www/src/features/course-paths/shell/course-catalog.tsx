import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@open-sharia-enterprise/web-ui";
import { Breadcrumb } from "@/features/navigation/shell/breadcrumb";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { tf } from "@/features/i18n/core/fill";
import { COURSE_CATEGORIES } from "@/features/content/core/course-categories";
import type { CourseCatalogEntry, CourseCatalogGroup } from "../core/course-catalog";
import { CourseMetaRow } from "./course-meta-row";

/**
 * The courses catalog (plan 03, S1 option A): an intro, category jump links, then one section
 * per category with one whole-card link per course. Server component; static at build time.
 */
export interface CourseCatalogProps {
  locale: string;
  title: string;
  breadcrumbSegments: { label: string; slug: string; href?: string }[];
  groups: readonly CourseCatalogGroup[];
}

export function CourseCatalog({ locale, title, breadcrumbSegments, groups }: CourseCatalogProps) {
  const loc = locale as Locale;
  const total = groups.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <article className="min-w-0 flex-1 px-6 py-8 lg:px-8">
      <Breadcrumb locale={locale} slug="learn/courses" segments={breadcrumbSegments} />
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">
        {tf(loc, "catalogSummary", { courses: total, categories: COURSE_CATEGORIES.length })}{" "}
        {t(loc, "catalogEstimateNote")}
      </p>
      <CategoryJumpLinks locale={locale} groups={groups} />
      {groups.map((group) => {
        const id = group.category ? group.category.id : "other-courses";
        const label = group.category ? t(loc, group.category.labelKey) : t(loc, "catalogOtherCourses");
        const blurb = group.category ? t(loc, group.category.blurbKey) : null;
        return (
          <section key={id} aria-labelledby={id} className="mt-10">
            <h2 id={id} className="scroll-mt-20 text-2xl font-bold tracking-tight">
              {label} <span className="text-muted-foreground">({group.entries.length})</span>
            </h2>
            {blurb ? <p className="mt-1 text-muted-foreground">{blurb}</p> : null}
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.entries.map((entry) => (
                <li key={entry.courseId}>
                  <CourseCard locale={locale} entry={entry} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </article>
  );
}

export function CategoryJumpLinks({ locale, groups }: { locale: string; groups: readonly CourseCatalogGroup[] }) {
  const loc = locale as Locale;
  return (
    <nav aria-label={t(loc, "catalogJumpLinksLabel")} className="mt-4">
      <ul className="flex flex-wrap gap-2">
        {groups.map((group) => {
          const id = group.category ? group.category.id : "other-courses";
          const label = group.category ? t(loc, group.category.labelKey) : t(loc, "catalogOtherCourses");
          return (
            <li key={id}>
              <a href={`#${id}`} className="rounded-full border px-3 py-1 text-sm hover:bg-accent">
                {label} ({group.entries.length})
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function CourseCard({ locale, entry }: { locale: string; entry: CourseCatalogEntry }) {
  const href = contentUrl(locale as Locale, entry.slug);
  return (
    <Card className="relative h-full has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
      <CardHeader>
        <CardTitle>
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {entry.title}
          </Link>
        </CardTitle>
        {entry.description ? <CardDescription>{entry.description}</CardDescription> : null}
        <CourseMetaRow
          locale={locale}
          format={entry.format}
          estimatedHours={entry.estimatedHours}
          isOutline={entry.isOutline}
          pathCount={entry.pathCount}
        />
      </CardHeader>
    </Card>
  );
}

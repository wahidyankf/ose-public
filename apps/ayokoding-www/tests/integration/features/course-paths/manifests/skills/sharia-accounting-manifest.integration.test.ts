import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { checkManifestIntegrity } from "../../../../../../src/features/course-paths/core/manifest-integrity";
import { normalizeCourseRef } from "../../../../../../src/features/course-paths/core/manifest";
import { checkPrerequisiteConsistency } from "../../../../../../src/features/course-paths/core/prerequisites";
import { PathManifestSchema } from "../../../../../../src/features/course-paths/core/schemas";

const appRoot = process.cwd();
const coursesRoot = path.join(appRoot, "content/en/learn/courses");
const courseIds = fs
  .readdirSync(coursesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const prerequisites = Object.fromEntries(
  courseIds.map((id) => [
    id,
    (matter(fs.readFileSync(path.join(coursesRoot, id, "_index.md"), "utf8")).data.prerequisites as
      | string[]
      | undefined) ?? [],
  ]),
);
const manifest = PathManifestSchema.parse(
  JSON.parse(
    fs.readFileSync(path.join(appRoot, "src/features/course-paths/manifests/skills/sharia-accounting.json"), "utf8"),
  ),
);

describe("Sharia accounting manifest", () => {
  it("contains the terminal ordered twenty-four-course Sharia accounting path", () => {
    expect(manifest.pathId).toBe("skills/sharia-accounting");
    expect(manifest.arc).toBe("immediately-effective");
    // Order is read from `phases` (the file shape), not the derived `courseOrder`.
    expect(manifest.phases.flatMap((phase) => phase.courses.map((ref) => normalizeCourseRef(ref).id))).toEqual([
      "accounting-foundations",
      "chart-of-accounts-and-data-modeling",
      "financial-statements-and-close-cycle",
      "journal-entries-and-posting-mechanics",
      "accrual-accounting-and-revenue-recognition",
      "accounts-payable-and-procure-to-pay",
      "accounts-receivable-and-order-to-cash",
      "managerial-and-cost-accounting",
      "fixed-assets-and-depreciation",
      "inventory-and-cogs-accounting",
      "lease-and-intangible-asset-accounting",
      "multi-currency-accounting-and-fx-translation",
      "consolidation-and-multi-entity-accounting",
      "financial-reporting-standards-ifrs-vs-gaap",
      "audit-controls-and-compliance",
      "payroll-and-tax-accounting-essentials",
      "treasury-and-cash-management",
      "financial-reporting-and-xbrl",
      "general-ledger-system-architecture",
      "sharia-accounting-and-aaoifi-standards",
      "islamic-contract-modeling-for-systems",
      "zakah-computation-and-reporting-for-systems",
      "sukuk-and-islamic-capital-markets-accounting",
      "sharia-ledger-system-architecture",
    ]);
    expect(checkManifestIntegrity(manifest, courseIds)).toEqual({ unresolvedIds: [], duplicateIds: [] });
    expect(checkPrerequisiteConsistency(manifest, prerequisites, courseIds).violations).toEqual([]);
  });
});

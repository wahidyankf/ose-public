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
const sharedExpected = [
  "erp-foundations-and-history",
  "erp-conceptual-data-model",
  "erp-module-map-and-architecture",
  "erp-document-lifecycle-and-state-machines",
  "erp-posting-rules-and-account-determination",
  "erp-subledger-to-gl-architecture",
  "erp-fiscal-calendar-and-period-close",
  "erp-numbering-sequences-and-uom-conversion",
  "erp-audit-trail-and-change-tracking",
  "procure-to-pay-systems",
  "order-to-cash-systems",
  "erp-procurement-and-fulfillment-exceptions",
  "record-to-report-systems",
  "inventory-and-warehouse-management",
  "erp-inventory-costing-methods",
  "erp-inventory-integrity-and-concurrency",
  "erp-bom-and-routing-architecture",
  "production-planning-and-mrp",
  "demand-and-supply-planning",
  "erp-availability-and-reservations",
  "quality-management-and-inspection",
  "erp-extension-and-customization",
  "erp-integration-patterns",
  "human-capital-management-and-hire-to-retire",
  "multi-company-and-multi-currency-erp",
  "erp-security-and-controls",
  "erp-analytics-and-reporting",
];
const shariaExpected = [
  ...sharedExpected,
  "sharia-compliant-erp-design",
  "islamic-contract-based-transaction-flows",
  "zakat-and-sharia-compliance-modules",
];

describe("terminal ERP manifests", () => {
  for (const name of ["conventional-erp", "sharia-erp"]) {
    it(`${name} publishes its ordered terminal course set`, () => {
      const manifest = PathManifestSchema.parse(
        JSON.parse(
          fs.readFileSync(path.join(appRoot, "src/features/course-paths/manifests/skills", `${name}.json`), "utf8"),
        ),
      );
      expect(manifest.pathId).toBe(`skills/${name}`);
      // Order is read from `phases` (the file shape), not the derived `courseOrder`.
      expect(manifest.phases.flatMap((phase) => phase.courses.map((ref) => normalizeCourseRef(ref).id))).toEqual(
        name === "conventional-erp" ? sharedExpected : shariaExpected,
      );
      expect(checkManifestIntegrity(manifest, courseIds)).toEqual({ unresolvedIds: [], duplicateIds: [] });
      expect(checkPrerequisiteConsistency(manifest, prerequisites, courseIds).violations).toEqual([]);
    });
  }
});

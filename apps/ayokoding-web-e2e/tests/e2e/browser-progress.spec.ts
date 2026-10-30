// Focused browser-progress proof: the browser-owned v1 record survives a
// reload and never travels in a request. This spec runs beside the generated
// canonical-corpus specs and exercises the same helpers.
import { expect, test } from "@playwright/test";
import { gotoPage, statusOf } from "./support/http";
import { assertNoProgressLeak, installRecorder } from "./support/network";
import {
  clearProgress,
  completePage,
  isValidRecord,
  readRaw,
  readRecord,
  writeRecord,
  type ProgressRecord,
} from "./support/storage";
import fixtureRecords from "./fixtures/progress-records.json";

test("completion survives a reload without uploading progress", async ({ page }) => {
  await installRecorder(page);
  await gotoPage(page, "/en");
  expect(statusOf(page)).toBe(200);
  await clearProgress(page);
  await completePage(page, "go-basics/hello-world");
  await page.reload();
  const record = await readRecord(page);
  expect(record.completed).toContain("go-basics/hello-world");
  assertNoProgressLeak(page);
});

test("the current v1 record remains readable", async ({ page }) => {
  await gotoPage(page, "/en");
  const valid = fixtureRecords.validV1 as ProgressRecord;
  expect(isValidRecord(valid)).toBe(true);
  await writeRecord(page, valid);
  await gotoPage(page, "/en/learn/courses/go-basics/learning/setup?path=backend-id");
  expect(statusOf(page)).toBe(200);
  const record = await readRecord(page);
  expect(record.completed).toEqual(["go-basics/setup"]);
  expect(record.lastPath).toBe("backend-id");
  expect(record.version).toBe(1);
  assertNoProgressLeak(page);
});

test("invalid saved progress recovers to an empty valid state", async ({ page }) => {
  await gotoPage(page, "/en");
  await page.evaluate(([key, raw]: [string, string]) => window.localStorage.setItem(key, raw), [
    "ayokoding-learn-progress-v1",
    fixtureRecords.invalidRaw,
  ] as [string, string]);
  await gotoPage(page, "/en/learn/courses/go-basics/learning/setup");
  await completePage(page, "go-basics/setup");
  const record = await readRecord(page);
  expect(record.completed).toContain("go-basics/setup");
  expect(isValidRecord(record)).toBe(true);
  expect(await readRaw(page)).not.toBe(fixtureRecords.invalidRaw);
});

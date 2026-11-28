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
import { pathContaining, primaryCourse, primaryPage } from "./support/witness";

const lessonOne = () => primaryPage(0);
const lessonTwo = () => primaryPage(1);
const keyOf = (lesson: { course: string; slug: string }) => `${lesson.course}/${lesson.slug}`;
const pathId = () => pathContaining(primaryCourse().course.slug).id;
const validRecord = () => ({
  version: 1,
  completed: [keyOf(lessonTwo())],
  lastPath: pathId(),
  lastCourse: lessonTwo().course,
});

test("completion survives a reload without uploading progress", async ({ page }) => {
  await installRecorder(page);
  await gotoPage(page, "/en");
  expect(statusOf(page)).toBe(200);
  await clearProgress(page);
  await completePage(page, keyOf(lessonOne()));
  await page.reload();
  const record = await readRecord(page);
  expect(record.completed).toContain(keyOf(lessonOne()));
  assertNoProgressLeak(page);
});

test("the current v1 record remains readable", async ({ page }) => {
  await gotoPage(page, "/en");
  const valid = validRecord() as ProgressRecord;
  expect(isValidRecord(valid)).toBe(true);
  await writeRecord(page, valid);
  await gotoPage(page, `${lessonTwo().route}?path=${pathId()}`);
  expect(statusOf(page)).toBe(200);
  const record = await readRecord(page);
  expect(record.completed).toEqual([keyOf(lessonTwo())]);
  expect(record.lastPath).toBe(pathId());
  expect(record.version).toBe(1);
  assertNoProgressLeak(page);
});

test("invalid saved progress recovers to an empty valid state", async ({ page }) => {
  await gotoPage(page, "/en");
  await page.evaluate(([key, raw]: [string, string]) => window.localStorage.setItem(key, raw), [
    "ayokoding-learn-progress-v1",
    fixtureRecords.invalidRaw,
  ] as [string, string]);
  await gotoPage(page, lessonTwo().route);
  await completePage(page, keyOf(lessonTwo()));
  const record = await readRecord(page);
  expect(record.completed).toContain(keyOf(lessonTwo()));
  expect(isValidRecord(record)).toBe(true);
  expect(await readRaw(page)).not.toBe(fixtureRecords.invalidRaw);
});

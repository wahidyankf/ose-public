// Browser-storage helpers for the Playwright E2E adapter. Progress lives in
// this origin's localStorage under the same key and v1 schema the app's
// browser helpers prove; these helpers read and write that contract through
// the real storage API. Record construction reuses the app's own progress
// helpers so the suite never redefines the schema.
import { expect, type Page } from "@playwright/test";
import {
  PROGRESS_KEY,
  THEME_KEY,
  clearRecord,
  emptyRecord,
  isValidRecord,
  loadRecord,
  markComplete,
  markIncomplete,
  saveRecord,
  type ProgressRecord,
} from "../../../../ayokoding-web/assets/js/progress";

export { PROGRESS_KEY, THEME_KEY, emptyRecord, isValidRecord };
export type { ProgressRecord } from "../../../../ayokoding-web/assets/js/progress";

// readRaw returns the stored progress value without parsing it.
export async function readRaw(page: Page): Promise<string | null> {
  return page.evaluate((key: string) => window.localStorage.getItem(key), PROGRESS_KEY);
}

// readRecord parses the stored progress value through the app's own loader,
// recovering to an empty valid record exactly like production code.
export async function readRecord(page: Page): Promise<ProgressRecord> {
  const raw = await readRaw(page);
  return loadRecord(() => raw);
}

// writeRecord persists a progress record built by the app's own helpers.
export async function writeRecord(page: Page, record: ProgressRecord): Promise<void> {
  const raw = JSON.stringify(record);
  await page.evaluate(([key, value]: [string, string]) => window.localStorage.setItem(key, value), [
    PROGRESS_KEY,
    raw,
  ] as [string, string]);
}

// completePage marks one page complete through the app's own helper.
export async function completePage(page: Page, slug: string): Promise<ProgressRecord> {
  const record = markComplete(await readRecord(page), slug);
  await writeRecord(page, record);
  return record;
}

// uncompletePage removes one page through the app's own helper.
export async function uncompletePage(page: Page, slug: string): Promise<ProgressRecord> {
  const record = markIncomplete(await readRecord(page), slug);
  await writeRecord(page, record);
  return record;
}

// clearProgress removes only the progress key, like the reset control.
export async function clearProgress(page: Page): Promise<void> {
  await page.evaluate((key: string) => window.localStorage.removeItem(key), PROGRESS_KEY);
  expect(await readRaw(page)).toBeNull();
}

// storedKeys returns every localStorage key on this origin.
export async function storedKeys(page: Page): Promise<string[]> {
  return page.evaluate(() => Object.keys(window.localStorage));
}

// storedValue returns one unrelated stored value for the reset assertions.
export async function storedValue(page: Page, key: string): Promise<string | null> {
  return page.evaluate((name: string) => window.localStorage.getItem(name), key);
}

// setStoredValue writes one unrelated stored value for the reset assertions.
export async function setStoredValue(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(([name, stored]: [string, string]) => window.localStorage.setItem(name, stored), [key, value] as [
    string,
    string,
  ]);
}

export { clearRecord, loadRecord, markComplete, markIncomplete, saveRecord };

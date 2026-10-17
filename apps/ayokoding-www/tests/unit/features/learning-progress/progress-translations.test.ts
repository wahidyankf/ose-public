import { describe, expect, it } from "vitest";
import { tf } from "@/features/i18n/core/fill";
import { t, translations } from "@/features/i18n/core/translations";

const NEW_KEYS = [
  "statusDone",
  "statusInProgress",
  "statusNotStarted",
  "progressSavedInBrowser",
  "progressYourProgress",
  "progressCoreCoursesDone",
  "progressCoursesDone",
  "progressCoreComplete",
  "progressPhaseDone",
  "progressPagesDone",
  "progressStorageUnavailable",
];

describe("learning progress translation keys", () => {
  it("has an Indonesian value for every English key", () => {
    const missing = Object.keys(translations.en).filter((key) => !(key in translations.id));

    expect(missing).toEqual([]);
  });

  it("defines every new progress and status key in both locales", () => {
    const missing = NEW_KEYS.filter((key) => t("en", key) === key || t("id", key) === key);

    expect(missing).toEqual([]);
  });

  it("keeps the progress templates literal in both locales", () => {
    expect(tf("en", "progressPagesDone", { done: 2, total: 5 })).toBe("2 of 5 pages done");
    expect(tf("id", "progressPagesDone", { done: 2, total: 5 })).toBe("2 dari 5 halaman selesai");
    expect(tf("en", "progressCoreCoursesDone", { done: 3, total: 13 })).toBe("3 of 13 core courses done");
    expect(tf("id", "progressCoreCoursesDone", { done: 3, total: 13 })).toBe("3 dari 13 kursus inti selesai");
  });
});

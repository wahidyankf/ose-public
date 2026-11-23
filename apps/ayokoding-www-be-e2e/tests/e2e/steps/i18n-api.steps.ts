// @scenario specs/apps/ayokoding/www/behaviours/backend/i18n/i18n-api.feature: Content is served in the requested locale
// @scenario specs/apps/ayokoding/www/behaviours/backend/i18n/i18n-api.feature: Requesting a slug prefixed with an invalid locale is rejected
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { state } from "./helpers";

const { Then } = createBdd();

// Phrases that the e2e content fixtures hold in each language.
const PHRASE_BY_LANGUAGE: Readonly<Record<string, string>> = {
  English: "Examples 1–26 establish Go's daily toolchain",
  Indonesian: "Selamat datang di pusat pembelajaran AyoKoding",
};

Then('the response "frontmatter" should indicate locale {string}', async ({}, locale: string) => {
  expect((state.pageResult as { locale: string }).locale).toBe(locale);
});

Then('the response "html" should contain {word}-language content', async ({}, language: string) => {
  expect((state.pageResult as { html: string }).html).toContain(PHRASE_BY_LANGUAGE[language]);
});

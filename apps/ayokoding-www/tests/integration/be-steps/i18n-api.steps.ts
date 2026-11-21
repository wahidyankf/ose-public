import path from "node:path";
import { TRPCError } from "@trpc/server";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { integrationCaller } from "./helpers/integration-caller";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/i18n/i18n-api.feature"),
);

// Phrases that the integration content fixtures hold in each language.
const PHRASE_BY_LANGUAGE: Readonly<Record<string, string>> = {
  English: "Examples 1–26 establish Go's daily toolchain",
  Indonesian: "Selamat datang di pusat pembelajaran AyoKoding",
};

/** The Examples cell carries the locale prefix; the client call takes the slug without it. */
function bareSlug(locale: string, slugWithLocale: string): string {
  return slugWithLocale.slice(locale.length + 1);
}

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", async () => {
      await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/i18n/i18n-api.feature: Content is served in the requested locale
  ScenarioOutline("Content is served in the requested locale", ({ Given, When, Then, And }, examples) => {
    const locale = String(examples["locale"]);
    const slug = String(examples["slug"]);
    const language = String(examples["language"]);
    let result: Awaited<ReturnType<typeof integrationCaller.content.getBySlug>>;

    Given('a page exists at slug "<slug>" under locale "<locale>"', async () => {
      await expect(
        integrationCaller.content.getBySlug({ locale, slug: bareSlug(locale, slug) }),
      ).resolves.toMatchObject({ locale });
    });
    When('the client calls content.getBySlug with slug "<slug>"', async () => {
      result = await integrationCaller.content.getBySlug({ locale, slug: bareSlug(locale, slug) });
    });
    Then('the response "frontmatter" should indicate locale "<locale>"', () => expect(result.locale).toBe(locale));
    And('the response "html" should contain <language>-language content', () =>
      expect(result.html).toContain(PHRASE_BY_LANGUAGE[language]),
    );
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/i18n/i18n-api.feature: Requesting a slug prefixed with an invalid locale is rejected
  Scenario("Requesting a slug prefixed with an invalid locale is rejected", ({ When, Then }) => {
    let error: unknown;
    When(
      'the client calls content.getBySlug with slug "fr/learn/courses/just-enough-go/learning/beginner"',
      async () => {
        try {
          const invalidInput = {
            locale: "fr",
            slug: "learn/courses/just-enough-go/learning/beginner",
          } as unknown as Parameters<typeof integrationCaller.content.getBySlug>[0];
          await integrationCaller.content.getBySlug(invalidInput);
        } catch (caught) {
          error = caught;
        }
      },
    );
    Then("the response should reject the invalid locale as a bad request", () => {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
    });
  });
});

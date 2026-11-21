import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { learnReorgRedirects } from "../../../src/redirects/learn-reorg";
import { learnThreeBucketRedirects } from "../../../src/redirects/learn-three-bucket";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-reorg-redirects.feature",
  ),
);

describeFeature(feature, ({ Scenario, Background }) => {
  let redirectsLoaded = false;
  let destination: string | undefined;

  Background(({ Given }) => {
    Given("the app is running", () => {
      redirectsLoaded = learnReorgRedirects.length > 0;
      destination = undefined;
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-reorg-redirects.feature: platform-web redirects to platforms/web under its legacy bucket address
  Scenario("platform-web redirects to platforms/web under its legacy bucket address", ({ When, Then }) => {
    When('a visitor navigates to "/en/learn/software-engineering/platform-web"', () => {
      expect(redirectsLoaded).toBe(true);
      const rule = learnReorgRedirects.find(
        ({ source }) => source === "/en/learn/software-engineering/platform-web/:path*",
      );
      const firstDestination = rule?.destination.replace("/:path*", "");
      const bucketRule = learnThreeBucketRedirects.find(
        ({ source }) => source === "/en/learn/software-engineering/:path*",
      );
      destination = bucketRule?.destination.replace(":path*", "platforms/web");
      expect(firstDestination).toBe("/en/learn/software-engineering/platforms/web");
      expect(rule?.permanent).toBe(true);
      expect(bucketRule?.permanent).toBe(true);
    });
    Then('the current URL should contain "/en/learn/legacy/software-engineering/platforms/web"', () => {
      expect(destination).toBe("/en/learn/legacy/software-engineering/platforms/web");
    });
  });
});

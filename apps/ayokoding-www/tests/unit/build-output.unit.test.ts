import { expect, it } from "vitest";
import { standaloneOutputFromEnv } from "../../src/build-output";

it("keeps standalone output when the switch is unset", () => {
  expect(standaloneOutputFromEnv({})).toBe("standalone");
});

it("turns standalone output off when the switch is exactly off", () => {
  expect(standaloneOutputFromEnv({ AYOKODING_WWW_STANDALONE_OUTPUT: "off" })).toBeUndefined();
});

it.each(["", "on", "OFF", " off"])("keeps standalone output when the switch is %j", (value) => {
  expect(standaloneOutputFromEnv({ AYOKODING_WWW_STANDALONE_OUTPUT: value })).toBe("standalone");
});

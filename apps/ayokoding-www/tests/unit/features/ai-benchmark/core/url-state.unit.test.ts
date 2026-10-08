import { describe, expect, it } from "vitest";
import { DEFAULT_SUBSTITUTE_HARNESS } from "@/features/ai-benchmark/core/data/benchmarks";
import { PARAM_KEYS, decodeState, encodeState } from "@/features/ai-benchmark/core/url-state";

const knownSub = (id: string) => id === "gpt-5.6-terra";

describe("decodeState", () => {
  it("reads known harness, tier, and substitute target values", () => {
    const params = new URLSearchParams("harness=cursor&tier=planning&sub=gpt-5.6-terra");
    expect(decodeState(params, knownSub)).toEqual({
      harness: "cursor",
      tier: "planning",
      sub: "gpt-5.6-terra",
      subHarness: undefined,
    });
  });

  it("reads the new harnesses as known filter values", () => {
    expect(decodeState(new URLSearchParams("harness=command-code")).harness).toBe("command-code");
    expect(decodeState(new URLSearchParams("harness=command-code-pro")).harness).toBe("command-code-pro");
  });

  it("drops unknown values instead of throwing", () => {
    const params = new URLSearchParams("harness=vim&tier=opus&sub=nope&sub-harness=vim&class=haiku");
    expect(decodeState(params, knownSub)).toEqual({
      harness: undefined,
      tier: undefined,
      sub: undefined,
      subHarness: undefined,
    });
  });

  it("reads each offered substitute harness", () => {
    for (const h of ["command-code-pro", "command-code", "opencode-go"] as const) {
      expect(decodeState(new URLSearchParams(`sub-harness=${h}`)).subHarness).toBe(h);
    }
  });

  it("drops a substitute harness the finder does not offer, even if it is a known filter harness", () => {
    expect(decodeState(new URLSearchParams("sub-harness=cursor")).subHarness).toBeUndefined();
    expect(decodeState(new URLSearchParams("sub-harness=")).subHarness).toBeUndefined();
  });

  it("keeps the substitute harness apart from the filter harness", () => {
    const state = decodeState(new URLSearchParams("harness=cursor&sub-harness=command-code"));
    expect(state.harness).toBe("cursor");
    expect(state.subHarness).toBe("command-code");
  });

  it("uses the first value of a duplicated parameter", () => {
    expect(decodeState(new URLSearchParams("harness=cursor&harness=codex-cli"), knownSub).harness).toBe("cursor");
    expect(decodeState(new URLSearchParams("sub-harness=command-code&sub-harness=opencode-go")).subHarness).toBe(
      "command-code",
    );
  });

  it("treats every substitute target as unknown by default", () => {
    expect(decodeState(new URLSearchParams("sub=gpt-5.6-terra")).sub).toBeUndefined();
  });
});

describe("encodeState", () => {
  it("omits unset values so the default state is an empty query", () => {
    expect(encodeState({}).toString()).toBe("");
  });

  it("writes every set value under its key", () => {
    const qs = encodeState({ harness: "opencode-go", tier: "fast", sub: "gpt-5.6-terra", subHarness: "command-code" });
    expect(qs.get(PARAM_KEYS.harness)).toBe("opencode-go");
    expect(qs.get(PARAM_KEYS.tier)).toBe("fast");
    expect(qs.get(PARAM_KEYS.sub)).toBe("gpt-5.6-terra");
    expect(qs.get(PARAM_KEYS.subHarness)).toBe("command-code");
  });

  it("omits the default substitute harness so the common URL stays short", () => {
    expect(encodeState({ sub: "gpt-5.6-terra", subHarness: DEFAULT_SUBSTITUTE_HARNESS }).toString()).toBe(
      "sub=gpt-5.6-terra",
    );
  });

  it("round-trips through decodeState", () => {
    const state = { harness: "cursor", tier: "execution", sub: "gpt-5.6-terra", subHarness: "opencode-go" } as const;
    expect(decodeState(encodeState(state), knownSub)).toEqual(state);
  });

  it("round-trips the default substitute harness to unset", () => {
    const decoded = decodeState(encodeState({ subHarness: DEFAULT_SUBSTITUTE_HARNESS }));
    expect(decoded.subHarness).toBeUndefined();
  });
});

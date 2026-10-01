import { describe, expect, it } from "vitest";
import { PARAM_KEYS, decodeState, encodeState } from "@/features/ai-benchmark/core/url-state";

const knownSub = (id: string) => id === "gpt-5.6-terra";

describe("decodeState", () => {
  it("reads known harness, tier, and substitute target values", () => {
    const params = new URLSearchParams("harness=cursor&tier=planning&sub=gpt-5.6-terra");
    expect(decodeState(params, knownSub)).toEqual({ harness: "cursor", tier: "planning", sub: "gpt-5.6-terra" });
  });

  it("drops unknown values instead of throwing", () => {
    const params = new URLSearchParams("harness=vim&tier=opus&sub=nope&class=haiku");
    expect(decodeState(params, knownSub)).toEqual({ harness: undefined, tier: undefined, sub: undefined });
  });

  it("uses the first value of a duplicated parameter", () => {
    expect(decodeState(new URLSearchParams("harness=cursor&harness=codex-cli"), knownSub).harness).toBe("cursor");
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
    const qs = encodeState({ harness: "opencode-go", tier: "fast", sub: "gpt-5.6-terra" });
    expect(qs.get(PARAM_KEYS.harness)).toBe("opencode-go");
    expect(qs.get(PARAM_KEYS.tier)).toBe("fast");
    expect(qs.get(PARAM_KEYS.sub)).toBe("gpt-5.6-terra");
  });

  it("round-trips through decodeState", () => {
    const state = { harness: "cursor", tier: "execution", sub: "gpt-5.6-terra" } as const;
    expect(decodeState(encodeState(state), knownSub)).toEqual(state);
  });
});

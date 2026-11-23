/**
 * Unit tests for the APP_ENV tier env-file loader of organiclever-www.
 *
 * These cover the behaviour the removed env-loader feature used to describe (see the repository spec review). Each test
 * drives `loadOrganicLeverWwwEnvironment()` with an in-memory file port and an isolated `env`
 * object (a plain record, not the real `process.env`), so this Unit suite never touches the
 * filesystem or ambient process environment.
 */
import path from "path";
import { describe, expect, it } from "vitest";
import { type TierEnvPort } from "@open-sharia-enterprise/ts-env-loader";
import { loadOrganicLeverWwwEnvironment } from "../../src/environment-bootstrap";

type EnvRecord = Record<string, string | undefined>;

function inMemoryTierEnv(files: Record<string, string>): TierEnvPort {
  return {
    exists: (filePath) => Object.hasOwn(files, filePath),
    load: (filePath, env) => {
      const source = files[filePath];
      if (source === undefined) return;
      for (const line of source.split("\n")) {
        const separator = line.indexOf("=");
        if (separator < 1) continue;
        const key = line.slice(0, separator);
        if (env[key] === undefined) env[key] = line.slice(separator + 1);
      }
    },
  };
}

const appDir = "/synthetic/organiclever-www";

describe("organiclever-www env-file loader", () => {
  it("organiclever-www bootstrap selects the staging tier file", () => {
    const port = inMemoryTierEnv({
      [path.join(appDir, ".env.stag")]: "ORGANICLEVER_WWW_BOOTSTRAP_MARKER=stag-value\n",
    });
    const env: EnvRecord = { APP_ENV: "stag" };

    loadOrganicLeverWwwEnvironment({ appDir, env, port });

    expect(env).toEqual({ APP_ENV: "stag", ORGANICLEVER_WWW_BOOTSTRAP_MARKER: "stag-value" });
  });

  it("organiclever-www process env wins over the local tier file", () => {
    const port = inMemoryTierEnv({ [path.join(appDir, ".env.local")]: "SOME_VAR=file-value\n" });
    const env: EnvRecord = { APP_ENV: "local", SOME_VAR: "process-value" };

    loadOrganicLeverWwwEnvironment({ appDir, env, port });

    expect(env["SOME_VAR"]).toBe("process-value");
  });

  it("organiclever-www tolerates a missing tier file", () => {
    const port = inMemoryTierEnv({});
    expect(port.exists(path.join(appDir, ".env.stag"))).toBe(false);
    const env: EnvRecord = { APP_ENV: "stag", EXISTING_VAR: "already-set" };

    expect(() => loadOrganicLeverWwwEnvironment({ appDir, env, port })).not.toThrow();
    expect(env["EXISTING_VAR"]).toBe("already-set");
  });

  it.each([".env", ".env.production", ".env.local"])(
    "organiclever-www fails loudly on a stray auto-loaded env file (%s)",
    (file) => {
      const port = inMemoryTierEnv({
        [path.join(appDir, ".env.stag")]: "VAR=value\n",
        [path.join(appDir, file)]: "VAR=other\n",
      });

      let thrown: unknown;
      try {
        loadOrganicLeverWwwEnvironment({ appDir, env: { APP_ENV: "stag" }, port });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toContain(file);
      expect((thrown as Error).message).toContain(".env.stag");
    },
  );
});

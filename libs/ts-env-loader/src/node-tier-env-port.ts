import { existsSync } from "node:fs";
import dotenv from "dotenv";
import type { ProcessPort, TierEnvPort } from "./index";

/** The one file-system call the tier port makes. Unit tests drive {@link createTierEnvPort} with a double. */
export interface FileSystemDriver {
  existsSync(filePath: string): boolean;
}

/** The one dotenv call the tier port makes. Unit tests drive {@link createTierEnvPort} with a double. */
export interface DotenvDriver {
  config(options: { path: string; override: boolean; processEnv: Record<string, string> }): unknown;
}

/**
 * Builds a tier port over a file-system driver and a dotenv driver. The production binding below
 * passes the real Node and dotenv functions; unit tests pass doubles, so the mapping is proven
 * without touching the disk.
 */
export function createTierEnvPort(fileSystem: FileSystemDriver, dotenvDriver: DotenvDriver): TierEnvPort {
  return {
    exists: (filePath) => fileSystem.existsSync(filePath),
    load(filePath, env) {
      dotenvDriver.config({
        path: filePath,
        override: false,
        processEnv: env as unknown as Record<string, string>,
      });
    },
  };
}

/** Production adapter for the Node filesystem and dotenv parser. */
export const nodeTierEnvPort: TierEnvPort = createTierEnvPort({ existsSync }, { config: dotenv.config });

/** Production adapter for the process working directory and environment. */
export const nodeProcessPort: ProcessPort = { cwd: () => process.cwd(), env: process.env };

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  processAllIndexFiles,
  type IndexGeneratorPort,
  type ProcessResult,
} from "../features/content/shell/index-generator";

export interface GenerateIndexesOptions {
  contentDir: string;
  mode: "generate" | "validate";
  port?: IndexGeneratorPort;
  log?: (message: string) => void;
  errorLog?: (message: string) => void;
}

/** Runs the index generation with injected I/O; returns the process exit code. */
export async function runGenerateIndexes(options: GenerateIndexesOptions): Promise<number> {
  const log = options.log ?? console.log;
  const errorLog = options.errorLog ?? console.error;
  const result: ProcessResult = await processAllIndexFiles(options.contentDir, options.mode, options.port);

  if (result.errors.length > 0) {
    errorLog("Errors:");
    for (const err of result.errors) {
      errorLog(`  ${err}`);
    }
  }

  if (options.mode === "validate" && result.changed.length > 0) {
    errorLog(`${result.changed.length} _index.md file(s) are out of date:`);
    for (const f of result.changed) {
      errorLog(`  ${f}`);
    }
    errorLog('\nRun "npx tsx src/scripts/generate-indexes.ts" to fix.');
    return 1;
  }

  if (options.mode === "generate" && result.changed.length > 0) {
    log(`Updated ${result.changed.length} _index.md file(s).`);
  }
  return 0;
}

async function main() {
  const mode = process.argv.includes("--validate") ? "validate" : "generate";
  const contentDir = path.resolve(process.cwd(), "content");
  process.exit(await runGenerateIndexes({ contentDir, mode: mode as "generate" | "validate" }));
}

// Run the I/O shell only when invoked directly as a script, never when imported (e.g. by the unit
// tests, which exercise runGenerateIndexes with a port double).
const invokedDirectly =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

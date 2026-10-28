import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// `next build` type-checks the tsconfig it is pointed at. The production image copies only the app's build inputs
// (not the sibling apps), so the build-time config must not read the tests tree, which can import sibling-app files.
// The project's own `typecheck` target keeps checking tests through the default tsconfig.json.

const APP_ROOT = path.resolve(import.meta.dirname, "../..").replaceAll("\\", "/");
const APPS_DIR = path.posix.dirname(APP_ROOT);
const TESTS_DIR = `${APP_ROOT}/tests/`;
const BUILD_TSCONFIG = "tsconfig.build.json";

type ResolvedConfig = { fileNames: string[]; options: ts.CompilerOptions };

function resolveConfig(configFileName: string): ResolvedConfig {
  const configPath = path.join(APP_ROOT, configFileName);
  const read = ts.readConfigFile(configPath, ts.sys.readFile);
  if (read.error !== undefined) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, APP_ROOT, undefined, configPath);
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"));
  }
  return { fileNames: parsed.fileNames.map((file) => file.replaceAll("\\", "/")), options: parsed.options };
}

function sourceFilesReachedBy({ fileNames, options }: ResolvedConfig): string[] {
  const program = ts.createProgram({ rootNames: fileNames, options });
  return program
    .getSourceFiles()
    .map((file) => file.fileName.replaceAll("\\", "/"))
    .filter((file) => !file.includes("/node_modules/"));
}

function propertyKey(name: ts.PropertyName): string | undefined {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
}

/** Collects the top-level keys of every `typescript: { ... }` object literal in next.config.ts. */
function nextTypescriptSettings(): Map<string, ts.Expression> {
  const configPath = path.join(APP_ROOT, "next.config.ts");
  const source = ts.createSourceFile(configPath, readFileSync(configPath, "utf8"), ts.ScriptTarget.Latest, true);
  const settings = new Map<string, ts.Expression>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      propertyKey(node.name) === "typescript" &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = propertyKey(property.name);
        if (key !== undefined) settings.set(key, property.initializer);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return settings;
}

describe("ayokoding-www build type-check configuration", () => {
  it("keeps the project typecheck covering the tests tree through tsconfig.json", () => {
    const { fileNames } = resolveConfig("tsconfig.json");
    expect(fileNames.some((file) => file.startsWith(TESTS_DIR))).toBe(true);
  });

  it("excludes every file under the tests tree from the build-time tsconfig", () => {
    const { fileNames } = resolveConfig(BUILD_TSCONFIG);
    expect(fileNames.filter((file) => file.startsWith(TESTS_DIR))).toEqual([]);
  });

  it("type-checks exactly the non-test files that the default config checks", () => {
    const build = resolveConfig(BUILD_TSCONFIG).fileNames;
    const expected = resolveConfig("tsconfig.json")
      .fileNames.filter((file) => !file.startsWith(TESTS_DIR))
      .sort();
    expect([...build].sort()).toEqual(expected);
  });

  it("does not reach another app from the build-time program", () => {
    const foreign = sourceFilesReachedBy(resolveConfig(BUILD_TSCONFIG)).filter(
      (file) => file.startsWith(`${APPS_DIR}/`) && !file.startsWith(`${APP_ROOT}/`),
    );
    expect(foreign).toEqual([]);
  });

  it("makes next.config.ts select the build-time tsconfig without ignoring build errors", () => {
    const settings = nextTypescriptSettings();
    const tsconfigPath = settings.get("tsconfigPath");
    expect(tsconfigPath !== undefined && ts.isStringLiteral(tsconfigPath) ? tsconfigPath.text : undefined).toBe(
      BUILD_TSCONFIG,
    );
    expect(settings.has("ignoreBuildErrors")).toBe(false);
  });
});

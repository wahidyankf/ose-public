import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { delimiter, isAbsolute, join, resolve } from "node:path";
import test from "node:test";

// The mutator is invoked by Rhino with an index snapshot: it may rewrite the paths it is given and
// nothing else, because the gate compares the worktree with the paths it selected. A formatter that
// writes a cache beside the files it reads fails that comparison, so each case also asserts the
// workspace gained no directory of its own.
const formatStaged = resolve(import.meta.dirname, "format-staged");
const snapshotConfigScript = resolve(import.meta.dirname, "prettier-snapshot-config.mjs");
const repositoryRoot = resolve(import.meta.dirname, "..");
const repositoryNodeModules = join(repositoryRoot, "node_modules");
const repositoryBin = join(repositoryNodeModules, ".bin");

const unformatted = 'value = {  "a":1,\n  "b":   2 }\n';
const formatted = 'value = {"a": 1, "b": 2}\n';

const unformattedJava = [
  "public class Greeter{",
  "  private final String name;",
  "",
  "    public Greeter(String name){this.name=name;}",
  "  public String greet(){",
  '      return "Hello, "+name+"!";',
  "  }",
  "}",
  "",
].join("\n");
const formattedJava = [
  "public class Greeter {",
  "",
  "  private final String name;",
  "",
  "  public Greeter(String name) {",
  "    this.name = name;",
  "  }",
  "",
  "  public String greet() {",
  '    return "Hello, " + name + "!";',
  "  }",
  "}",
  "",
].join("\n");

const markdownWithJavaFence = [
  "# Notes",
  "",
  "```java",
  "public class A{",
  "    void f(){int x=1;}",
  "}",
  "```",
  "",
].join("\n");

const unformattedJson = '{"a":1}\n';
const formattedJson = '{ "a": 1 }\n';
const unformattedSql = "select  *   from t where a=1;\n";
const formattedSql = "select\n  *\nfrom\n  t\nwhere\n  a = 1;\n";

// The repository's own shape: the SQL and Tailwind plugins apply everywhere, and the Java plugin is
// scoped to `*.java` so that Prettier's Markdown embed never formats a ```java fence with it. An
// override's plugin list replaces the top-level one for its files, so it restates the others to keep
// the top-level `tailwindStylesheet` option known to a plugin that is loaded.
const scopedJavaConfig = {
  printWidth: 120,
  proseWrap: "preserve",
  plugins: ["prettier-plugin-sql", "prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./apps/organiclever-app-web/src/app/globals.css",
  overrides: [
    {
      files: "*.java",
      options: { plugins: ["prettier-plugin-java", "prettier-plugin-sql", "prettier-plugin-tailwindcss"] },
    },
  ],
};

function workspace() {
  const root = mkdtempSync(join(tmpdir(), "ose-format-staged-"));
  const project = join(root, "apps", "project");
  mkdirSync(project, { recursive: true });
  writeFileSync(join(project, "pyproject.toml"), "[tool.ruff]\nline-length = 120\n");
  return { root, project };
}

// The Prettier arm reads `.prettierrc.json` and runs `scripts/prettier-snapshot-config.mjs` from the
// snapshot root, and it finds the repository's node_modules from the `prettier` binary on PATH, so a
// Java case needs both files in the workspace and the repository's bin directory on PATH. The
// config is the thing under test, so a case passes its own, or the repository's, as text.
function javaWorkspace(config = `${JSON.stringify(scopedJavaConfig)}\n`) {
  const { root, project } = workspace();
  writeFileSync(join(root, ".prettierrc.json"), config);
  mkdirSync(join(root, "scripts"));
  copyFileSync(snapshotConfigScript, join(root, "scripts", "prettier-snapshot-config.mjs"));
  return { root, project };
}

const javaEnvironment = { ...process.env, PATH: `${repositoryBin}${delimiter}${process.env.PATH}` };

test("formats a selected Python path without leaving a cache directory in the workspace", () => {
  const { root, project } = workspace();
  try {
    writeFileSync(join(project, "module.py"), unformatted);

    execFileSync(formatStaged, ["apps/project/module.py"], { cwd: root, stdio: "pipe" });

    assert.equal(readFileSync(join(project, "module.py"), "utf8"), formatted);
    assert.deepEqual(readdirSync(root), ["apps"]);
    assert.deepEqual(readdirSync(project).sort(), ["module.py", "pyproject.toml"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("leaves an unselected Python path untouched", () => {
  const { root, project } = workspace();
  try {
    writeFileSync(join(project, "selected.py"), unformatted);
    writeFileSync(join(project, "unselected.py"), unformatted);

    execFileSync(formatStaged, ["apps/project/selected.py"], { cwd: root, stdio: "pipe" });

    assert.equal(readFileSync(join(project, "selected.py"), "utf8"), formatted);
    assert.equal(readFileSync(join(project, "unselected.py"), "utf8"), unformatted);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ignores a selected path that the snapshot deleted", () => {
  const { root, project } = workspace();
  try {
    writeFileSync(join(project, "module.py"), unformatted);

    execFileSync(formatStaged, ["apps/project/deleted.py", "apps/project/module.py"], { cwd: root, stdio: "pipe" });

    assert.equal(readFileSync(join(project, "module.py"), "utf8"), formatted);
    assert.deepEqual(readdirSync(root), ["apps"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formats a selected Java path with Prettier without leaving files in the workspace", () => {
  const { root, project } = javaWorkspace();
  try {
    writeFileSync(join(project, "Greeter.java"), unformattedJava);

    execFileSync(formatStaged, ["apps/project/Greeter.java"], { cwd: root, stdio: "pipe", env: javaEnvironment });

    assert.equal(readFileSync(join(project, "Greeter.java"), "utf8"), formattedJava);
    assert.deepEqual(readdirSync(root).sort(), [".prettierrc.json", "apps", "scripts"]);
    assert.deepEqual(readdirSync(join(root, "scripts")), ["prettier-snapshot-config.mjs"]);
    assert.deepEqual(readdirSync(project).sort(), ["Greeter.java", "pyproject.toml"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("leaves an unselected Java path untouched", () => {
  const { root, project } = javaWorkspace();
  try {
    writeFileSync(join(project, "Selected.java"), unformattedJava);
    writeFileSync(join(project, "Unselected.java"), unformattedJava);

    execFileSync(formatStaged, ["apps/project/Selected.java"], { cwd: root, stdio: "pipe", env: javaEnvironment });

    assert.equal(readFileSync(join(project, "Selected.java"), "utf8"), formattedJava);
    assert.equal(readFileSync(join(project, "Unselected.java"), "utf8"), unformattedJava);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("does not route Java through the Spotless wrapper", () => {
  const source = readFileSync(formatStaged, "utf8");

  assert.doesNotMatch(source, /format-java\.sh/);
  assert.doesNotMatch(source, /java_paths/);
});

function formatMixedWorkspace(config) {
  const { root, project } = javaWorkspace(config);
  writeFileSync(join(project, "Greeter.java"), unformattedJava);
  writeFileSync(join(project, "notes.md"), markdownWithJavaFence);
  writeFileSync(join(project, "data.json"), unformattedJson);
  writeFileSync(join(project, "query.sql"), unformattedSql);

  const run = spawnSync(
    formatStaged,
    ["apps/project/Greeter.java", "apps/project/notes.md", "apps/project/data.json", "apps/project/query.sql"],
    { cwd: root, encoding: "utf8", env: javaEnvironment },
  );
  // A warning is noise the pre-commit hook would repeat on every Java commit, and it means a loaded
  // option lost its plugin: a plugin list in an override replaces the top-level one for its files.
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, "");
  return { root, project };
}

function assertJavaFormattedAndMarkdownFenceUntouched({ root, project }) {
  assert.equal(readFileSync(join(project, "Greeter.java"), "utf8"), formattedJava);
  assert.equal(readFileSync(join(project, "notes.md"), "utf8"), markdownWithJavaFence);
  assert.equal(readFileSync(join(project, "data.json"), "utf8"), formattedJson);
  assert.equal(readFileSync(join(project, "query.sql"), "utf8"), formattedSql);
  assert.deepEqual(readdirSync(root).sort(), [".prettierrc.json", "apps", "scripts"]);
}

test("formats Java but leaves a java fence in a selected Markdown path byte-for-byte untouched", () => {
  const workspaceFiles = formatMixedWorkspace(`${JSON.stringify(scopedJavaConfig)}\n`);
  try {
    assertJavaFormattedAndMarkdownFenceUntouched(workspaceFiles);
  } finally {
    rmSync(workspaceFiles.root, { recursive: true, force: true });
  }
});

test("the repository's own Prettier config scopes the Java plugin away from Markdown fences", () => {
  const workspaceFiles = formatMixedWorkspace(readFileSync(join(repositoryRoot, ".prettierrc.json"), "utf8"));
  try {
    assertJavaFormattedAndMarkdownFenceUntouched(workspaceFiles);
  } finally {
    rmSync(workspaceFiles.root, { recursive: true, force: true });
  }
});

// The snapshot formatter turns the plugin names in a staged `.prettierrc.json` into absolute paths
// inside the repository's node_modules, so a snapshot can never name code it carries itself. An
// override's plugin list is loaded by Prettier exactly like the top-level one, so it gets the same
// resolution and the same refusals.
function snapshotConfig(config, nodeModulesDirectory = repositoryNodeModules) {
  const root = mkdtempSync(join(tmpdir(), "ose-snapshot-config-"));
  try {
    const configPath = join(root, ".prettierrc.json");
    const outputPath = join(root, "resolved.json");
    writeFileSync(configPath, JSON.stringify(config));
    execFileSync(
      process.execPath,
      [snapshotConfigScript, configPath, repositoryRoot, nodeModulesDirectory, root, outputPath],
      { stdio: "pipe" },
    );
    return JSON.parse(readFileSync(outputPath, "utf8"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const resolvePlugin = createRequire(join(repositoryRoot, "package.json")).resolve;

function refuses(message) {
  return (error) => {
    assert.match(String(error.stderr), message);
    return true;
  };
}

test("the snapshot formatter resolves override plugin names to absolute paths inside node_modules", () => {
  const resolved = snapshotConfig({
    plugins: ["prettier-plugin-sql"],
    overrides: [
      { files: "*.java", options: { plugins: ["prettier-plugin-java"], printWidth: 100 } },
      { files: "*.md", options: { proseWrap: "always" } },
    ],
  });

  const java = resolvePlugin("prettier-plugin-java");
  assert.ok(isAbsolute(java) && java.startsWith(`${repositoryNodeModules}/`));
  assert.deepEqual(resolved.plugins, [resolvePlugin("prettier-plugin-sql")]);
  assert.deepEqual(resolved.overrides, [
    { files: "*.java", options: { plugins: [java], printWidth: 100 } },
    { files: "*.md", options: { proseWrap: "always" } },
  ]);
});

for (const [place, withPlugins] of [
  ["a top-level", (plugins) => ({ plugins })],
  ["an override", (plugins) => ({ overrides: [{ files: "*.java", options: { plugins } }] })],
]) {
  test(`the snapshot formatter refuses an absolute plugin path in ${place} list`, () => {
    assert.throws(
      () => snapshotConfig(withPlugins([join(repositoryNodeModules, "prettier-plugin-java", "dist", "index.cjs")])),
      refuses(/the Prettier plugin list must not contain path-shaped entries/),
    );
  });

  test(`the snapshot formatter refuses a plugin path that climbs with .. in ${place} list`, () => {
    assert.throws(
      () => snapshotConfig(withPlugins(["prettier-plugin-java/../prettier-plugin-sql"])),
      refuses(/the Prettier plugin list must not contain path-shaped entries/),
    );
  });

  test(`the snapshot formatter refuses ${place} plugin list that is not package names`, () => {
    assert.throws(
      () => snapshotConfig(withPlugins([42])),
      refuses(/the Prettier plugin list must contain only package names/),
    );
    assert.throws(
      () => snapshotConfig(withPlugins("prettier-plugin-java")),
      refuses(/the Prettier plugin list must contain only package names/),
    );
  });

  test(`the snapshot formatter refuses ${place} plugin that resolves outside node_modules`, () => {
    assert.throws(
      () => snapshotConfig(withPlugins(["prettier-plugin-java"]), join(repositoryRoot, "scripts")),
      refuses(/the Prettier plugin resolves outside node_modules: prettier-plugin-java/),
    );
  });
}

test("the snapshot formatter refuses an overrides value that is not a list", () => {
  assert.throws(
    () => snapshotConfig({ overrides: { files: "*.java", options: { plugins: ["prettier-plugin-java"] } } }),
    refuses(/the Prettier overrides must be a list/),
  );
});

// Lesson fences mirror their course files byte for byte: sync copies file bytes into fences, so the
// commit hook must never reformat code inside lesson fences, while Markdown elsewhere keeps embedded
// formatting.
const lessonMarkdownWithTsFence = [
  "# Lesson",
  "",
  "```ts",
  'const greeting="hello";',
  "console.log( greeting );",
  "```",
  "",
].join("\n");

function lessonWorkspace() {
  const root = mkdtempSync(join(tmpdir(), "ose-format-staged-sync-"));
  writeFileSync(join(root, ".prettierrc.json"), "{}\n");
  mkdirSync(join(root, "scripts"), { recursive: true });
  copyFileSync(snapshotConfigScript, join(root, "scripts", "prettier-snapshot-config.mjs"));
  return root;
}

test("leaves a ts fence in a lesson under apps/ayokoding-www/content byte-for-byte untouched", () => {
  const root = lessonWorkspace();
  const lesson = join(
    "apps",
    "ayokoding-www",
    "content",
    "en",
    "learn",
    "courses",
    "green-python",
    "learning",
    "lesson.md",
  );
  try {
    mkdirSync(join(root, "apps", "ayokoding-www", "content", "en", "learn", "courses", "green-python", "learning"), {
      recursive: true,
    });
    writeFileSync(join(root, lesson), lessonMarkdownWithTsFence);

    execFileSync(formatStaged, [lesson], { cwd: root, stdio: "pipe", env: javaEnvironment });

    assert.equal(readFileSync(join(root, lesson), "utf8"), lessonMarkdownWithTsFence);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("still formats a ts fence in Markdown outside apps/ayokoding-www/content", () => {
  const root = lessonWorkspace();
  try {
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "docs", "notes.md"), lessonMarkdownWithTsFence);

    execFileSync(formatStaged, ["docs/notes.md"], { cwd: root, stdio: "pipe", env: javaEnvironment });

    assert.notEqual(readFileSync(join(root, "docs", "notes.md"), "utf8"), lessonMarkdownWithTsFence);
    assert.match(readFileSync(join(root, "docs", "notes.md"), "utf8"), /const greeting = "hello";/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

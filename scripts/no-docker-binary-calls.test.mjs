// The supported container flows run the Podman binary only. An executed `docker` argv, a `docker <subcommand>` command
// line, or a Docker daemon socket reaches a Docker daemon that rootless Podman hosts do not have, and fails with
// "permission denied ... /var/run/docker.sock". Documentation, image names, `--format docker` (a buildah value), and
// `com.docker.compose.*` labels (which Podman Compose also sets) are not calls and are not flagged. Intentional data
// strings that look like calls are listed in ALLOWLIST with a reason, and a stale entry fails the suite too.
import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join, relative, resolve, sep } from "node:path";
import test from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const SELF = "scripts/no-docker-binary-calls.test.mjs";
const SCANNED_ROOTS = ["apps", "infra", "libs", "scripts", ".github"];
const ROOT_FILES = ["package.json"];
const SKIPPED_DIRS = new Set([
  ".features-gen",
  ".git",
  ".next",
  ".nx",
  "bin",
  "content",
  "coverage",
  "dist",
  "generated-reports",
  "local-tmp",
  "node_modules",
  "obj",
  "playwright-report",
  "target",
  "test-results",
  "worktrees",
]);
const CODE_EXTENSIONS = new Set([
  ".bash",
  ".cjs",
  ".cs",
  ".fs",
  ".fsx",
  ".go",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".mjs",
  ".mts",
  ".py",
  ".rs",
  ".sh",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const MANIFEST_NAMES = new Set(["Makefile", "makefile", "package.json", "project.json"]);

// Each entry names a file whose docker hit is intentional data, never executed, and says why.
const ALLOWLIST = [
  {
    file: "scripts/public-safety/tests/cases/140-cidr-network-prefix.sh",
    reason: "a printf fixture: the docker command line is text the public-safety preflight scans, never executed",
  },
];

const DOCKER_SUBCOMMANDS =
  "compose|build|buildx|run|exec|ps|pull|push|images?|network|volume|info|version|login|logout|inspect|logs|cp|rm|rmi|stop|start|tag|system|container|context|load|save|kill|events|commit|create";

const RULES = [
  {
    name: "docker binary run as argv[0]",
    pattern:
      /(?:\bspawn(?:Sync)?|\bexeca(?:Sync)?|\bexec(?:Sync|File|FileSync)?|\bfork|\bCommand(?:::new)?|\bProcessBuilder|\bProcessStartInfo|\bPopen|\bsubprocess\.\w+|\bProcess\.Start|\bFileName\s*=)\s*\(?\s*(?:\[\s*)?(["'`])docker\1/g,
  },
  {
    name: "docker binary as an argv array element before a subcommand",
    pattern: new RegExp(`(["'\`])docker\\1\\s*,\\s*(["'\`])(?:${DOCKER_SUBCOMMANDS})\\2`, "g"),
  },
  {
    name: "docker command line in a shell, script, or manifest",
    pattern: new RegExp(
      `(?:^|[\\s;&|(\`"']|\\$\\()docker\\s+(?:${DOCKER_SUBCOMMANDS}|--version|--help)(?![\\w-])|\\b(?:which|command -v|type|hash)\\s+docker\\b`,
      "gm",
    ),
  },
  {
    name: "Docker daemon socket or environment",
    pattern: /DOCKER_HOST|DOCKER_CONTEXT|docker\.sock/g,
  },
];

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : filesUnder(path);
    return [path];
  });
}

const toRepoPath = (path) => relative(ROOT, path).split(sep).join("/");

// Executed code: a code or workflow extension, a named manifest, or an extensionless helper under a scripts directory.
function isExecutedCode(file) {
  const name = basename(file);
  if (MANIFEST_NAMES.has(name)) return true;
  if (CODE_EXTENSIONS.has(extname(name))) return true;
  return extname(name) === "" && file.split("/").includes("scripts");
}

const executedFiles = [
  ...SCANNED_ROOTS.flatMap((root) => filesUnder(resolve(ROOT, root))).map(toRepoPath),
  ...ROOT_FILES,
]
  .filter((file) => isExecutedCode(file) && file !== SELF)
  .sort();

const readRepo = (file) => readFileSync(resolve(ROOT, file), "utf8");

// Returns one `file:line: rule: line text` entry per docker call found in the text.
function hitsIn(file, text) {
  if (text.includes("\0")) return [];
  const lines = text.split("\n");
  return RULES.flatMap(({ name, pattern }) =>
    [...text.matchAll(pattern)].map((match) => {
      const line = text.slice(0, match.index).split("\n").length;
      return `${file}:${line}: ${name}: ${lines[line - 1].trim().slice(0, 160)}`;
    }),
  );
}

const allowedFiles = new Set(ALLOWLIST.map((entry) => entry.file));

test("the scan reaches the executed-code files of the supported container flows", () => {
  for (const expected of [
    "apps/ose-be-e2e/steps/backend-process.ts",
    "apps/organiclever-be-e2e/steps/backend-process.ts",
    "apps/ose-be/scripts/run-e2e.sh",
    "apps/organiclever-be/scripts/run-e2e.sh",
    "apps/ose-be-e2e/project.json",
    "package.json",
    ".github/workflows/non-product-full-quality.yml",
  ]) {
    assert.ok(executedFiles.includes(expected), `${expected} is not scanned`);
  }
});

test("no executed file runs the docker binary, a docker command line, or a Docker daemon socket", () => {
  const offenders = executedFiles
    .filter((file) => !allowedFiles.has(file))
    .flatMap((file) => hitsIn(file, readRepo(file)));
  assert.deepEqual(offenders, []);
});

test("every allowlist entry names a scanned file that still holds a docker hit and states a reason", () => {
  for (const { file, reason } of ALLOWLIST) {
    assert.ok(reason?.trim().length > 0, `${file} has no reason`);
    assert.ok(executedFiles.includes(file), `${file} is not a scanned file`);
    assert.ok(
      hitsIn(file, readRepo(file)).length > 0,
      `${file} no longer holds a docker hit; drop its allowlist entry`,
    );
  }
});

test("the detector flags a docker binary call and passes podman, buildah, and compose labels", () => {
  const flagged = [
    'const result = spawnSync(\n    "docker",\n    ["compose", "exec"],\n  );',
    'exec.Command("docker", "compose", "up")',
    'argv := []string{"docker", "compose", "up"}',
    'subprocess.run(["docker", "build", "."])',
    'cmd := "docker compose -f x.yml up"',
    "docker network create lab",
    "if ! command -v docker >/dev/null; then exit 1; fi",
    "DOCKER_HOST=unix:///var/run/docker.sock docker ps",
  ];
  for (const sample of flagged) {
    assert.ok(hitsIn("fixture", sample).length > 0, `not flagged: ${sample}`);
  }

  const passed = [
    'spawnSync(\n    "podman",\n    ["compose", "exec"],\n  );',
    'argv = append(argv, "build", "--layers", "--format", "docker")',
    '"build", "--layers", "--format", "docker",\n    "--tag", tag,',
    "podman build --layers --format docker -f apps/ose-be/Dockerfile .",
    "BUILDAH_FORMAT=docker && scripts/container-runtime-check --compose",
    "--filter label=com.docker.compose.service=web",
    "FROM docker.io/library/node:24-alpine AS deps",
    'executable("docker-compose", "exit 90");',
  ];
  for (const sample of passed) {
    assert.deepEqual(hitsIn("fixture", sample), [], `wrongly flagged: ${sample}`);
  }
});

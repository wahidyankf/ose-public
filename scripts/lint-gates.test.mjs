import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

// The three lint gates receive every staged or changed path from Rhino and must pick out their own
// file type. A selector that misses a file is a gate that passes without looking, so each case below
// proves both directions: a finding at the warning threshold fails, and an unselected or clean path
// passes.
const lintShell = resolve(import.meta.dirname, "lint-shell");
const lintDockerfiles = resolve(import.meta.dirname, "lint-dockerfiles");
const lintWorkflows = resolve(import.meta.dirname, "lint-workflows");

// shellcheck SC2034 (unused variable) is warning-level; SC2086 (unquoted expansion) is info-level.
const shellWarning = "#!/usr/bin/env bash\nunused=1\n";
const shellInfoOnly = "#!/usr/bin/env bash\nset -euo pipefail\necho $1\n";
// hadolint DL3025 (shell-form CMD) is warning-level.
const dockerWarning = "FROM alpine:3.20\nCMD node server.js\n";
const dockerClean = 'FROM alpine:3.20\nCMD ["true"]\n';
const workflowClean = [
  "name: clean",
  "on: push",
  "jobs:",
  "  build:",
  "    runs-on: ubuntu-latest",
  "    steps:",
  "      - run: echo ok",
  "",
].join("\n");
// An undefined job in `needs` is an actionlint error.
const workflowBroken = [
  "name: broken",
  "on: push",
  "jobs:",
  "  build:",
  "    runs-on: ubuntu-latest",
  "    needs: [missing]",
  "    steps:",
  "      - run: echo ok",
  "",
].join("\n");

function workspace(files) {
  const root = mkdtempSync(join(tmpdir(), "ose-lint-gates-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function run(script, root, paths) {
  return spawnSync(script, paths, { cwd: root, encoding: "utf8" });
}

function withWorkspace(files, body) {
  const root = workspace(files);
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("lint-shell fails on a warning-level finding in a selected *.sh path", () => {
  withWorkspace({ "tools/bad.sh": shellWarning }, (root) => {
    const result = run(lintShell, root, ["tools/bad.sh"]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /SC2034/);
  });
});

test("lint-shell passes a script whose only findings are below the warning threshold", () => {
  withWorkspace({ "tools/info.sh": shellInfoOnly }, (root) => {
    assert.equal(run(lintShell, root, ["tools/info.sh"]).status, 0);
  });
});

test("lint-shell selects an extensionless file by its shell shebang", () => {
  withWorkspace({ "bin/wrapper": shellWarning.replace("bash", "sh") }, (root) => {
    assert.equal(run(lintShell, root, ["bin/wrapper"]).status, 1);
  });
});

test("lint-shell ignores non-shell, extensionless non-shell, and deleted paths", () => {
  withWorkspace(
    {
      "docs/notes.md": shellWarning,
      "conf/Caddyfile": "example.com {\n  reverse_proxy 127.0.0.1:8000\n}\n",
      "bin/tool": "#!/usr/bin/env python3\nunused = 1\n",
    },
    (root) => {
      const result = run(lintShell, root, ["docs/notes.md", "conf/Caddyfile", "bin/tool", "tools/deleted.sh"]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    },
  );
});

test("lint-dockerfiles fails on a warning-level finding in every Dockerfile name form", () => {
  for (const path of ["app/Dockerfile", "infra/Dockerfile.be.dev", "infra/api.Dockerfile"]) {
    withWorkspace({ [path]: dockerWarning }, (root) => {
      const result = run(lintDockerfiles, root, [path]);
      assert.equal(result.status, 1, path);
      assert.match(result.stdout, /DL3025/, path);
    });
  }
});

test("lint-dockerfiles passes a clean Dockerfile and ignores unselected and deleted paths", () => {
  withWorkspace(
    { "app/Dockerfile": dockerClean, "app/Dockerfile.dockerignore": "node_modules\n", "app/run.sh": dockerWarning },
    (root) => {
      const result = run(lintDockerfiles, root, [
        "app/Dockerfile",
        "app/Dockerfile.dockerignore",
        "app/run.sh",
        "app/deleted/Dockerfile",
      ]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    },
  );
});

test("lint-workflows lints every workflow when any workflow path changes", () => {
  withWorkspace(
    { ".github/workflows/clean.yml": workflowClean, ".github/workflows/broken.yml": workflowBroken },
    (root) => {
      // Only the clean file changed, yet a caller can break against an unchanged file, so the whole
      // workflow set is linted.
      const result = run(lintWorkflows, root, [".github/workflows/clean.yml"]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /broken\.yml/);
    },
  );
});

test("lint-workflows is triggered by a local composite action change", () => {
  withWorkspace(
    { ".github/workflows/broken.yml": workflowBroken, ".github/actions/setup-x/action.yml": "name: x\n" },
    (root) => {
      assert.equal(run(lintWorkflows, root, [".github/actions/setup-x/action.yml"]).status, 1);
    },
  );
});

test("lint-workflows passes a clean workflow set and skips a change set without workflow paths", () => {
  withWorkspace({ ".github/workflows/clean.yml": workflowClean }, (root) => {
    assert.equal(run(lintWorkflows, root, [".github/workflows/clean.yml"]).status, 0);
  });
  withWorkspace({ ".github/workflows/broken.yml": workflowBroken, "README.md": "# r\n" }, (root) => {
    assert.equal(run(lintWorkflows, root, ["README.md"]).status, 0);
  });
});

// A gate whose binary is missing fails rather than skips. The pull-request surface runs in CI's
// repository-policy job, so that job has to install the pinned tools before it runs the surface,
// and each tool has to stay declared under `toolchains` so doctor reports it locally.
test("CI installs, and the registry declares, every lint gate binary before the pull-request surface", () => {
  const workflow = readFileSync(".github/workflows/pr-quality-gate.yml", "utf8");
  const action = readFileSync(".github/actions/setup-lint-tools/action.yml", "utf8");
  const config = readFileSync("repo-config.yml", "utf8");

  const job = [];
  let current = null;
  for (const line of workflow.split("\n")) {
    const header = /^ {2}([a-z][a-z0-9-]*):\s*$/.exec(line);
    if (header) current = header[1];
    if (current === "repository-policy") job.push(line);
  }
  const setup = job.findIndex((line) => /uses:\s*\.\/\.github\/actions\/setup-lint-tools\s*$/.test(line));
  const surface = job.findIndex((line) => line.includes("gate run --surface pull-request"));
  assert.ok(setup >= 0, "the repository-policy job never uses setup-lint-tools");
  assert.ok(surface > setup, "setup-lint-tools must run before the pull-request surface");

  for (const binary of ["shellcheck", "hadolint", "actionlint"]) {
    assert.match(
      action,
      new RegExp(`install -m 0755 \\S+ "\\$bin/${binary}"`),
      `setup-lint-tools never installs ${binary}`,
    );
    assert.match(
      config,
      new RegExp(`- \\{ id: ${binary}, executable: ${binary}, probe: \\[--version\\], required: true \\}`),
      `repo-config.yml toolchains does not declare ${binary}`,
    );
    assert.match(config, new RegExp(`- id: ${binary}\\n\\s+type: check`), `repo-config.yml declares no ${binary} gate`);
  }
});

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

// The mutator is invoked by Rhino with an index snapshot: it may rewrite the paths it is given and
// nothing else, because the gate compares the worktree with the paths it selected. A formatter that
// writes a cache beside the files it reads fails that comparison, so each case also asserts the
// workspace gained no directory of its own.
const formatStaged = resolve(import.meta.dirname, "format-staged");

const unformatted = 'value = {  "a":1,\n  "b":   2 }\n';
const formatted = 'value = {"a": 1, "b": 2}\n';

function workspace() {
  const root = mkdtempSync(join(tmpdir(), "ose-format-staged-"));
  const project = join(root, "apps", "project");
  mkdirSync(project, { recursive: true });
  writeFileSync(join(project, "pyproject.toml"), "[tool.ruff]\nline-length = 120\n");
  return { root, project };
}

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

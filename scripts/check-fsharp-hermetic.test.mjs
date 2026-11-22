// Proves the F# hermeticity scan in both directions: each forbidden API family is found in a unit-test
// file, and the places where such text is not code (comments, string and test-name literals, a
// field named File) are not flagged. A scan that misses a violation passes without looking, so the
// first group of cases plants one violation per family.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

import { codeOnly } from "./check-fsharp-hermetic.mjs";

const script = resolve(import.meta.dirname, "check-fsharp-hermetic.mjs");

function project(files) {
  const root = mkdtempSync(join(tmpdir(), "ose-fsharp-hermetic-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function run(root, args = []) {
  return spawnSync(process.execPath, [script, root, ...args], { cwd: root, encoding: "utf8" });
}

function withProject(files, body) {
  const root = project(files);
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const unitFile = (body) => `module Tests.Sample\n\nopen Xunit\n\n${body}\n`;

test("a clean unit-test tree passes", () => {
  withProject({ "tests/unit/Tests/Pure.fs": unitFile("let add a b = a + b") }, (root) => {
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /clean: 1 unit-test file\(s\) scanned/);
  });
});

const planted = [
  ["file system", 'let read () = System.IO.File.ReadAllText "x"'],
  ["file system", 'let read () = File.Exists "x"'],
  ["file system", 'let read () = Path.Combine("a", "b")'],
  ["file system", 'let info () = FileInfo("x")'],
  ["clock", "let now () = DateTime.UtcNow"],
  ["clock", "let now () = System.DateTime.Now"],
  ["clock", "let timer () = Stopwatch.StartNew()"],
  ["network", "let client () = new HttpClient()"],
  ["network", 'let socket () = TcpClient("localhost", 80)'],
  ["network", "let net () = System.Net.Dns.GetHostName()"],
  ["environment", 'let env () = Environment.GetEnvironmentVariable "APP_ENV"'],
  ["process", 'let run () = Process.Start "ls"'],
  ["randomness", "let id () = Guid.NewGuid()"],
  ["randomness", "let roll () = Random().Next()"],
];

for (const [category, line] of planted) {
  test(`a ${category} reference in a unit test is a finding: ${line}`, () => {
    withProject({ "tests/unit/Tests/Planted.fs": unitFile(line) }, (root) => {
      const result = run(root);
      assert.equal(result.status, 1, result.stdout);
      assert.match(result.stderr, new RegExp(`Planted\\.fs:5: ${category}: `));
    });
  });
}

test("a reference inside an interpolation hole is code and is a finding", () => {
  withProject({ "tests/unit/Tests/Hole.fs": unitFile('let s p = $"value {File.ReadAllText p}"') }, (root) => {
    const result = run(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Hole\.fs:5: file system/);
  });
});

test("comments, string literals, and test names are not code", () => {
  const body = [
    "// DateTime.UtcNow in a line comment",
    "(* File.ReadAllText in a block comment *)",
    'let text = "System.IO and Environment.GetEnvironmentVariable"',
    'let verbatim = @"C:\\File.Exists"',
    'let triple = """Process.Start inside a triple string"""',
    'let interpolatedText = $"literal Random text {1 + 1}"',
    "let quote = '\"'",
    "[<Fact>]",
    "let ``File.Exists is a test name`` () = ()",
  ].join("\n");
  withProject({ "tests/unit/Tests/Quiet.fs": unitFile(body) }, (root) => {
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
  });
});

test("a namespace or in-memory type is not an I/O reference", () => {
  const body = [
    "open System.IO",
    "open System.Net",
    "let writer () = new StringWriter()",
    "let status () = System.Net.HttpStatusCode.OK",
    'let missing () = FileNotFoundException("in memory")',
    "let handled (handler: HttpMessageHandler) = new HttpClient(handler)",
  ].join("\n");
  withProject({ "tests/unit/Tests/Doubles.fs": unitFile(body) }, (root) => {
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
  });
});

test("a record field named File is not a file-system call", () => {
  withProject(
    { "tests/unit/Tests/Field.fs": unitFile("let size (finding: {| File: string |}) = finding.File.Length") },
    (root) => {
      const result = run(root);
      assert.equal(result.status, 0, result.stderr);
    },
  );
});

test("a character literal does not hide a later violation on the same line", () => {
  withProject({ "tests/unit/Tests/Char.fs": unitFile('let pair = (\'"\', File.Exists "x")') }, (root) => {
    const result = run(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Char\.fs:5: file system/);
  });
});

test("the one allow-listed spec loader is skipped and reported", () => {
  withProject(
    {
      "tests/unit/Behaviour/SpecLoader.fs": unitFile('let scenarios () = Directory.GetFiles("specs")'),
      "tests/unit/Tests/Pure.fs": unitFile("let add a b = a + b"),
    },
    (root) => {
      const result = run(root, ["--allow", "tests/unit/Behaviour/SpecLoader.fs"]);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /1 unit-test file\(s\) scanned .*1 allow-listed/);
    },
  );
});

test("an allow-listed file that does not exist fails, so a stale allow-list cannot widen the scan", () => {
  withProject({ "tests/unit/Tests/Pure.fs": unitFile("let add a b = a + b") }, (root) => {
    const result = run(root, ["--allow", "tests/unit/Missing.fs"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /allow-listed file does not exist/);
  });
});

test("an empty unit-test tree fails instead of passing over nothing", () => {
  withProject({ "tests/unit/README.md": "no sources here\n" }, (root) => {
    const result = run(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /an empty scan is not a pass/);
  });
});

test("a missing unit-test directory fails", () => {
  withProject({ "src/Lib.fs": unitFile("let add a b = a + b") }, (root) => {
    const result = run(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no unit-test directory/);
  });
});

test("build output directories are not scanned", () => {
  withProject(
    {
      "tests/unit/Tests/Pure.fs": unitFile("let add a b = a + b"),
      "tests/unit/obj/Generated.fs": unitFile("let now () = DateTime.UtcNow"),
    },
    (root) => {
      const result = run(root);
      assert.equal(result.status, 0, result.stderr);
    },
  );
});

test("codeOnly keeps line count and blanks literal text", () => {
  const source = 'let a = "File.Exists"\n// DateTime.Now\nlet b = 1\n';
  const blanked = codeOnly(source);
  assert.equal(blanked.split("\n").length, source.split("\n").length);
  assert.doesNotMatch(blanked, /File\.Exists|DateTime\.Now/);
  assert.match(blanked, /let b = 1/);
});

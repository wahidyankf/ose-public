#!/usr/bin/env node
// Enforces hermetic unit tests for F# projects (contract rule C21, decision D26).
//
// Usage:
//   node scripts/check-fsharp-hermetic.mjs <project-dir> [--allow <path-under-project-dir>]
//
// Scans every .fs file under <project-dir>/tests/unit and fails on a reference to a clock, file system,
// network, environment, process, or randomness API. Comments and string or test-name literals are not
// code, so they never trigger a finding. Interpolation holes ({...} inside $"..." strings) are code.
//
// --allow names the one shared spec loader of the project (the file that locates .feature files). It
// is skipped whole, and it must exist, so a stale allow-list fails instead of silently widening.
// Exit codes: 0 clean, 1 findings or an empty scan, 2 usage error.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Each rule names an I/O call, constructor, or member, not a namespace or type that also serves in-memory
// doubles: `open System.Net` for HttpStatusCode, `StringWriter`, or an in-process TestServer client is not
// a reference to the network, so it is not a finding. The categories follow the contract's list.
export const FORBIDDEN = [
  {
    category: "file system",
    pattern:
      /(?<![\w.])(?:System\.IO\.|IO\.)?(?:File|Directory|Path)\.|\b(?:System\.IO\.)?(?:FileInfo|DirectoryInfo|FileStream)\b/,
  },
  {
    category: "clock",
    pattern:
      /\b(?:DateTime|DateTimeOffset)\.(?:UtcNow|Now|Today)\b|\bStopwatch\b|\bThread\.Sleep\b|\bTask\.Delay\b|\bSystem\.Timers\b/,
  },
  {
    category: "network",
    pattern:
      /\bSystem\.Net\.Sockets\b|\bDns\.|\bTcpClient\b|\bUdpClient\b|\bWebClient\b|\bWebRequest\b|\bSocketsHttpHandler\b|(?<![\w.])(?:System\.Net\.Http\.)?HttpClient\s*\(\s*\)/,
  },
  {
    category: "environment",
    pattern: /\bEnvironment\.(?!NewLine\b)/,
  },
  {
    category: "process",
    pattern: /\bProcess\.|\bProcessStartInfo\b/,
  },
  {
    category: "randomness",
    pattern: /\bRandom\b|\bRandomNumberGenerator\b|\bGuid\.NewGuid\b/,
  },
];

// Returns the source with every comment and literal's text replaced by spaces, keeping line breaks and
// columns so a finding keeps its line number. Interpolation holes are left as code.
export function codeOnly(source) {
  const out = source.split("");
  const n = source.length;
  const blank = (from, to) => {
    for (let k = from; k < to && k < n; k++) {
      if (out[k] !== "\n") out[k] = " ";
    }
  };

  // Scans a string whose opening quote(s) start at `start`, returns the index after its close.
  const scanString = (start, { interpolated, verbatim, triple }) => {
    const delimiter = triple ? '"""' : '"';
    let j = start + (triple ? 3 : 1);
    if (interpolated) {
      // Keep the "$" prefix of an interpolated string as a blank, as the quotes are.
      blank(start - 1, start);
    }
    blank(start, j);
    while (j < n) {
      const c = source[j];
      if (!triple && !verbatim && c === "\\") {
        blank(j, j + 2);
        j += 2;
        continue;
      }
      if (verbatim && c === '"' && source[j + 1] === '"') {
        blank(j, j + 2);
        j += 2;
        continue;
      }
      if (source.startsWith(delimiter, j)) {
        blank(j, j + delimiter.length);
        return j + delimiter.length;
      }
      if (interpolated && c === "{") {
        if (source[j + 1] === "{") {
          blank(j, j + 2);
          j += 2;
          continue;
        }
        // An interpolation hole is code: leave it unblanked up to its matching close brace.
        let depth = 0;
        while (j < n) {
          if (source[j] === "{") depth++;
          if (source[j] === "}") depth--;
          j++;
          if (depth === 0) break;
        }
        continue;
      }
      blank(j, j + 1);
      j++;
    }
    return n;
  };

  let i = 0;
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];

    if (c === "/" && next === "/") {
      let end = source.indexOf("\n", i);
      if (end === -1) end = n;
      blank(i, end);
      i = end;
      continue;
    }

    if (c === "(" && next === "*" && source[i + 2] !== ")") {
      let depth = 0;
      let j = i;
      while (j < n) {
        if (source[j] === "(" && source[j + 1] === "*") {
          depth++;
          j += 2;
        } else if (source[j] === "*" && source[j + 1] === ")") {
          depth--;
          j += 2;
          if (depth === 0) break;
        } else {
          j++;
        }
      }
      blank(i, j);
      i = j;
      continue;
    }

    if (c === "`" && next === "`") {
      let end = source.indexOf("``", i + 2);
      end = end === -1 ? n : end + 2;
      blank(i, end);
      i = end;
      continue;
    }

    // A character literal such as '"' or '\'' must not open a string.
    if (c === "'") {
      const charLiteral = /^'(?:\\.|[^'\\\n])'/.exec(source.slice(i, i + 8));
      if (charLiteral) {
        blank(i, i + charLiteral[0].length);
        i += charLiteral[0].length;
        continue;
      }
    }

    let prefix = 0;
    let interpolated = false;
    let verbatim = false;
    if (c === "$" && (next === '"' || (next === "@" && source[i + 2] === '"'))) {
      interpolated = true;
      verbatim = next === "@";
      prefix = verbatim ? 2 : 1;
    } else if (c === "@" && next === '"') {
      verbatim = true;
      prefix = 1;
    }
    if (c === '"' || prefix > 0) {
      const quoteAt = i + (prefix > 0 ? prefix : 0);
      const triple = source.startsWith('"""', quoteAt);
      const start = quoteAt;
      if (prefix > 0) {
        // Blank the "$" or "@" prefix character(s) before the quote.
        blank(i, quoteAt);
      }
      const end = scanString(start, { interpolated, verbatim, triple });
      i = end;
      continue;
    }

    i += 1;
  }

  return out.join("");
}

// Lists the .fs files under dir, skipping build output, in a stable order.
function fsFiles(dir) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current).sort()) {
      if (entry === "bin" || entry === "obj") continue;
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".fs")) {
        found.push(full);
      }
    }
  };
  walk(dir);
  return found;
}

// Scans one project. Returns { scanned, allowed, findings } where findings are { file, line, category, text }.
export function scanProject(projectDir, allowed = []) {
  const unitDir = join(projectDir, "tests", "unit");
  if (!existsSync(unitDir) || !statSync(unitDir).isDirectory()) {
    throw new Error(`no unit-test directory at ${relative(process.cwd(), unitDir) || unitDir}`);
  }
  const allowedAbsolute = new Set();
  for (const path of allowed) {
    const full = resolve(projectDir, path);
    if (!existsSync(full) || !statSync(full).isFile()) {
      throw new Error(`allow-listed file does not exist: ${path}`);
    }
    allowedAbsolute.add(full);
  }

  const files = fsFiles(unitDir);
  if (files.length === 0) {
    throw new Error(`no .fs files under ${relative(process.cwd(), unitDir) || unitDir}; an empty scan is not a pass`);
  }

  const findings = [];
  let scanned = 0;
  for (const file of files) {
    if (allowedAbsolute.has(resolve(file))) continue;
    scanned += 1;
    const source = readFileSync(file, "utf8");
    const original = source.split("\n");
    const code = codeOnly(source).split("\n");
    code.forEach((codeLine, index) => {
      for (const rule of FORBIDDEN) {
        if (rule.pattern.test(codeLine)) {
          findings.push({
            file,
            line: index + 1,
            category: rule.category,
            text: original[index].trim(),
          });
        }
      }
    });
  }
  return { scanned, allowed: allowedAbsolute.size, findings };
}

function display(path) {
  const rel = relative(process.cwd(), path);
  return rel.startsWith("..") ? path : rel.split(sep).join("/");
}

function main(argv) {
  let projectDir;
  const allowed = [];
  for (let k = 0; k < argv.length; k++) {
    if (argv[k] === "--allow") {
      const value = argv[k + 1];
      if (!value) {
        console.error("check-fsharp-hermetic: --allow needs a path");
        return 2;
      }
      allowed.push(value);
      k++;
    } else if (projectDir === undefined) {
      projectDir = argv[k];
    } else {
      console.error(`check-fsharp-hermetic: unexpected argument ${argv[k]}`);
      return 2;
    }
  }
  if (projectDir === undefined) {
    console.error("usage: check-fsharp-hermetic.mjs <project-dir> [--allow <path-under-project-dir>]");
    return 2;
  }

  let result;
  try {
    result = scanProject(projectDir, allowed);
  } catch (error) {
    console.error(`check-fsharp-hermetic: ${error.message}`);
    return 1;
  }

  for (const finding of result.findings) {
    console.error(`${display(finding.file)}:${finding.line}: ${finding.category}: ${finding.text}`);
  }
  if (result.findings.length > 0) {
    console.error(
      `check-fsharp-hermetic: ${result.findings.length} forbidden reference(s) in unit tests of ${projectDir}; ` +
        "inject a double at a port, or move the test to the integration level",
    );
    return 1;
  }
  console.log(
    `check-fsharp-hermetic: clean: ${result.scanned} unit-test file(s) scanned under ${projectDir}/tests/unit, ` +
      `${result.allowed} allow-listed`,
  );
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2));
}

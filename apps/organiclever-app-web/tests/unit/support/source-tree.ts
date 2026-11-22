// A read-only view of the app's source files, the port that the source scans depend on.
// Unit tests drive the scans with the in-memory double below; the real file-system adapter
// lives in tests/integration/support, so no unit test touches the disk.

export interface SourceTree {
  /** True when `relativePath` names an existing file or directory. */
  exists(relativePath: string): boolean;
  /** Relative paths of every file under `relativeDir`, recursively; empty when the directory is absent. */
  listFiles(relativeDir: string): string[];
  /** The text of one file. */
  readText(relativePath: string): string;
}

/** The in-memory double: files map a relative path (with `/`) to their text. */
export function memorySourceTree(files: Record<string, string>): SourceTree {
  const paths = Object.keys(files);
  return {
    exists: (relativePath) => paths.some((p) => p === relativePath || p.startsWith(`${relativePath}/`)),
    listFiles: (relativeDir) => paths.filter((p) => p.startsWith(`${relativeDir}/`)),
    readText: (relativePath) => {
      const text = files[relativePath];
      if (text === undefined) {
        throw new Error(`no such file in the double: ${relativePath}`);
      }
      return text;
    },
  };
}

const CANONICAL_WEB_UI = "@open-sharia-enterprise/web-ui";
const SOURCE_ROOT = "src";

export interface WebUiScan {
  /** Source files that import the canonical design-system package. */
  consumers: string[];
  /** Source files that name the retired `ts-ui` alias. */
  aliasOffenders: string[];
}

/** Scans `src` for design-system consumption (decision #26: web-ui, never ts-ui). */
export function scanWebUi(tree: SourceTree): WebUiScan {
  const sources = tree.listFiles(SOURCE_ROOT).filter((file) => /\.tsx?$/.test(file));
  const importsCanonical = new RegExp(`from ["']${CANONICAL_WEB_UI}["']`);
  return {
    consumers: sources.filter((file) => importsCanonical.test(tree.readText(file))),
    aliasOffenders: sources.filter((file) => /@open-sharia-enterprise\/ts-ui/.test(tree.readText(file))),
  };
}

const LANDING_PATHS = ["src/contexts/landing", "tests/unit/steps/landing"];

/** The landing paths that the organiclever web split (Phase 6) removed and that still exist. */
export function landingRemnants(tree: SourceTree): string[] {
  return LANDING_PATHS.filter((relativePath) => tree.exists(relativePath));
}

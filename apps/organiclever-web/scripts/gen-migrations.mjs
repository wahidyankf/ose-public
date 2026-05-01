import { readdirSync, writeFileSync } from "fs";

const MIGRATION_DIR = "src/lib/journal/migrations";
const OUTPUT = `${MIGRATION_DIR}/index.generated.ts`;
const FILENAME_RX = /^(\d{4}_\d{2}_\d{2}T\d{2}_\d{2}_\d{2}__[a-z0-9_]{1,60})\.ts$/;

const files = readdirSync(MIGRATION_DIR)
  .filter((f) => f !== "index.generated.ts" && f !== "index.ts")
  .filter((f) => f.endsWith(".ts"))
  .filter((f) => !f.includes(".test."));

for (const f of files) {
  if (!FILENAME_RX.test(f)) {
    throw new Error(`Migration filename violates convention: ${f}`);
  }
}

const sorted = files.sort();
const imports = sorted.map((f, i) => `import * as m${i} from "./${f.replace(/\.ts$/, "")}";`).join("\n");
const arr = sorted.map((_, i) => `m${i}`).join(", ");

writeFileSync(
  OUTPUT,
  `// AUTO-GENERATED — do not edit. Run \`npm run gen:migrations\`.\n\n${imports}\n\nimport type { PGlite, Transaction } from "@electric-sql/pglite";\ntype Queryable = PGlite | Transaction;\nexport interface Migration { id: string; up: (db: Queryable) => Promise<void>; down?: (db: Queryable) => Promise<void>; }\n\nexport const MIGRATIONS: Migration[] = [${arr}];\n`,
);

console.log(`Generated ${OUTPUT} with ${sorted.length} migration(s).`);

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gherkinRoot = path.resolve(__dirname, "../../specs/apps/demo/be/gherkin");

export default {
  default: {
    paths: [`${gherkinRoot}/**/*.feature`],
    import: ["tests/unit/bdd/hooks.ts", "tests/unit/bdd/world.ts", "tests/unit/bdd/steps/**/*.ts"],
    loader: ["tsx"],
    format: ["progress", "json:coverage/cucumber-unit-report.json"],
    worldParameters: {},
  },
};

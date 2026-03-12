import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gherkinRoot = path.resolve(__dirname, "../../specs/apps/demo-be/gherkin");

export default {
  default: {
    paths: [`${gherkinRoot}/**/*.feature`],
    require: ["tests/integration/hooks.ts", "tests/integration/steps/**/*.ts"],
    requireModule: ["tsx/cjs"],
    format: ["progress", "json:coverage/cucumber-report.json"],
    worldParameters: {},
  },
};

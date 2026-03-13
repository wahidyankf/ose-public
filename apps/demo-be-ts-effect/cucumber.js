export default {
  default: {
    paths: ["../../specs/apps/demo/be/gherkin/**/*.feature"],
    import: ["tests/integration/hooks.ts", "tests/integration/world.ts", "tests/integration/steps/**/*.ts"],
    loader: ["tsx"],
    format: ["progress", "json:coverage/cucumber-report.json"],
    worldParameters: {},
  },
};

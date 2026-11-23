// ESLint flat config. It runs one rule that oxlint cannot express: a zero-argument `new Date()` reads the clock, so
// unit tests (Test and Gate Contract C21) must pass a fixed Date. oxlint bans the other clock, randomness,
// environment, file-system, and network APIs in apps/ose-www/oxlint.json.
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["tests/unit/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "Unit tests are hermetic: no clock. Pass a fixed Date.",
        },
      ],
    },
  },
];

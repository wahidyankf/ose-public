# Behaviours — web-ui

Gherkin feature files for [web-ui](../../../../libs/web-ui/README.md), one folder per component, primitive, or shared
concern.

```
specs/libs/web-ui/behaviours/
├── alert/
├── app-header/
├── badge/
├── button/
├── card/
├── code-block/
├── command/
├── dialog/
├── dropdown-menu/
├── highlight-text/
├── hue-picker/
├── icon/
├── info-tip/
├── input/
├── label/
├── primitives/
├── progress-ring/
├── resizable-panel/
├── scroll-area/
├── scroll-to-top/
├── search-component/
├── separator/
├── sheet/
├── side-nav/
├── stat-card/
├── table/
├── tab-bar/
├── tabs/
├── textarea/
├── theme-toggle/
├── toggle/
├── tooltip/
├── utils/
└── visual/
```

## Consumption

`nx run web-ui:test:unit` binds every scenario here to a unit test under `libs/web-ui/tests/unit/`: a vitest-cucumber
`*.steps.tsx` file, or a hand-written test that cites the scenario in a `// @scenario` comment. `nx run web-ui:test:e2e`
binds them to the Playwright BDD steps under `libs/web-ui/tests/e2e/steps/`, which cover the integration and e2e levels.
A scenario tagged `@integration-exempt` or `@e2e-exempt` names its reach reason and the unit test that proves it instead.

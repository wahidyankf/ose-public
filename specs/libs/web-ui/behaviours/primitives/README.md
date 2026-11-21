# Primitives entry

Gherkin scenario for the primitives sub-barrel (`libs/web-ui/src/primitives/index.ts`): the base components and the
primitives-only components are exported from it. The scenario is exempt from the integration and e2e levels because it
states the package export map, which no browser page or local resource reaches; its unit test is the proof.

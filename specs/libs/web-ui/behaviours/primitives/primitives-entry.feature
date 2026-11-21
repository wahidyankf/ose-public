Feature: Primitives entry

  # Exemption(integration): the claim is about the package export map, which no local file, network, or process boundary is reached through; the consuming bundler resolves it at build time; alternative-proof: web-ui:test:unit / tests/unit/primitives/index.test.ts
  @integration-exempt
  # Exemption(e2e): the claim is about the package export map, which no browser page or served route reaches; the consuming bundler resolves it at build time; alternative-proof: web-ui:test:unit / tests/unit/primitives/index.test.ts
  @e2e-exempt
  # Behaviour: WUI-032
  # Behaviour: WUI-035
  Scenario: Consumers import the base Badge, Button, Card, Dialog, and Sheet plus CodeBlock, CopyButton, and ResizablePanel from the primitives entry
    When the primitives entry is imported
    Then the primitives entry exports Badge, Button, Card, Dialog, Sheet, CodeBlock, CopyButton, and ResizablePanel

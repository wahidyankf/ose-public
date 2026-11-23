Feature: Class name utility

  # Exemption(integration): cn is a pure string function that reads no file, network, process, or database; its output has no boundary beyond its arguments; alternative-proof: web-ui:test:unit / tests/unit/utils/cn.unit.test.ts cn joins class names and lets the later Tailwind utility win a conflict
  @integration-exempt
  # Exemption(e2e): cn is a pure string function with no browser, storage, or server boundary of its own; alternative-proof: web-ui:test:unit / tests/unit/utils/cn.unit.test.ts cn joins class names and lets the later Tailwind utility win a conflict
  @e2e-exempt
  # Behaviour: WUI-001
  Scenario: cn joins class names and lets the later Tailwind utility win a conflict
    When cn is called with "px-2 text-sm" and "px-4"
    Then the joined class name is "text-sm px-4"

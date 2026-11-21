Feature: Persisted width parsing

  # Exemption(integration): parsePersistedWidth is a pure function over a string and reads no file, network, process, or database; alternative-proof: web-ui:test:unit / tests/unit/primitives/resizable-panel/width-model.test.ts parsePersistedWidth returns nothing for text that is not a number
  @integration-exempt
  # Exemption(e2e): parsePersistedWidth is a pure function with no browser, storage, or server boundary of its own; the storage read happens in the hook, which the resizable-panel scenarios exercise; alternative-proof: web-ui:test:unit / tests/unit/primitives/resizable-panel/width-model.test.ts parsePersistedWidth returns nothing for text that is not a number
  @e2e-exempt
  # Behaviour: WUI-036
  Scenario Outline: parsePersistedWidth returns nothing for text that is not a number
    When parsePersistedWidth reads the stored text "<text>"
    Then the parsed width is nothing

    Examples:
      | text  |
      | wide  |
      | 12px  |
      | NaN   |

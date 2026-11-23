Feature: Component visual baselines

  # Behaviour: WUI-052
  Scenario: Alert, Button, Card, Dialog, Input, and Label match their visual baselines
    When the Alert, Button, Card, Dialog, Input, and Label are each rendered in their base state
    Then the six base component screenshots match their committed visual baselines

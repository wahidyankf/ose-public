---
description: A TypeScript (Vitest) and Go (Godog) Red-Green-Refactor worked example, and the Gherkin-to-test chain for BDD.
when_to_use: Use as a concrete reference for what a Red-Green-Refactor cycle looks like in TypeScript, Go, or from a Gherkin scenario.
---

# Examples

## TypeScript (Vitest)

```typescript
// Red: write failing test
import { describe, it, expect } from "vitest";
import { calculateDiscount } from "./pricing";

describe("calculateDiscount", () => {
  it("applies 10% discount to positive price", () => {
    expect(calculateDiscount(100, 0.1)).toBe(90);
  });
});

// Run: npx nx run [project]:test:unit  → FAIL (calculateDiscount not defined)

// Green: implement minimum code
export function calculateDiscount(price: number, rate: number): number {
  return price * (1 - rate);
}

// Run: npx nx run [project]:test:unit  → PASS

// Refactor: add type guard, improve naming if needed — keep tests green
```

## Go (Godog / standard testing)

```go
// Red: write failing test
func TestCalculateDiscount(t *testing.T) {
    result := calculateDiscount(100, 0.1)
    if result != 90 {
        t.Errorf("expected 90, got %v", result)
    }
}

// Run: go test ./... → FAIL (calculateDiscount undefined)

// Green: implement
func calculateDiscount(price float64, rate float64) float64 {
    return price * (1 - rate)
}

// Run: go test ./... → PASS
```

## Gherkin-to-Test Chain (BDD)

For behaviour driven by a Gherkin scenario in `prd.md`:

```gherkin
Scenario: 10% discount reduces price
  Given a product priced at 100
  When a 10% discount is applied
  Then the final price should be 90
```

This Gherkin scenario directly becomes the first failing step implementation (Godog for Go,
Playwright for E2E, Vitest describe/it for TypeScript). See
[plan-writing-gherkin-criteria skill](../../../../.agents/skills/plan-writing-gherkin-criteria/SKILL.md)
and [Acceptance Criteria Convention](../../infra/acceptance-criteria.md).

The delivery outcome section references the canonical scenario by stable ID or exact title and
uses separate detailed RED/GREEN/REFACTOR checkboxes. Do not duplicate the full `Given/When/Then`
in `delivery.md`; preserve the failing binding/test and its RED evidence in implementation notes. See
[Gherkin-Tagged Delivery Steps](./gherkin-tagged-delivery-steps.md#gherkin-tagged-delivery-steps).

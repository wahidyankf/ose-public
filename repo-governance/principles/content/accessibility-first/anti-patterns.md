---
description: Common accessibility mistakes - color-only signaling, missing alt text, red-green combinations, and low-contrast text.
when_to_use: Use when auditing content or diagrams for accessibility anti-patterns before publishing.
---

# Anti-Patterns

## Using Color Alone

FAIL: **Problem**: Information conveyed only through color.

```text
graph TD
    A[Task]:::red
    B[Task]:::green

    classDef red fill:#FF0000
    classDef green fill:#00FF00
```

**Why it's bad**: Red-blind and green-blind users cannot distinguish these. Information is lost.

PASS: **Solution**: Combine color with text labels and shapes.

```mermaid
graph TD
    accTitle: Using Color Alone
    accDescr: Shows Error State Orange Circle, Success State Teal Rectangle.
    A["Error State<br/>(Orange Circle)"]:::orange
    B["Success State<br/>(Teal Rectangle)"]:::teal

    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

## Missing Alt Text

FAIL: **Problem**: Images without descriptive alt text.

```markdown
![](screenshot.png)
```

**Why it's bad**: Screen reader users have no idea what the image shows.

## Red-Green Combinations

FAIL: **Problem**: Using red and green together.

**Why it's bad**: ~99% of color-blind users cannot distinguish red from green. Both appear as brownish-yellow.

## Low Contrast Text

FAIL: **Problem**: Light gray text on white background.

```css
color: #cccccc;
background: #ffffff;
/* Contrast: 1.6:1 - FAILS WCAG AA */
```

**Why it's bad**: Hard to read for everyone, impossible for vision-impaired users.

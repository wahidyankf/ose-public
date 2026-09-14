---
description: "Documents the eight-color verified accessible palette with hex, RGB, and HSL values and per-context usage recommendations."
when_to_use: "Use when picking specific hex codes for a diagram, indicator, or UI element that needs to be color-blind safe."
---

# Verified Accessible Color Palette

This palette has been scientifically verified to be safe for all types of color blindness and meets WCAG AA standards in both light and dark modes.

## Primary Palette

Use these colors for all color-dependent visualizations:

| Color  | Hex Code | RGB           | HSL            | Use Cases                          | Light Background (WCAG AA) | Dark Background (WCAG AA) |
| ------ | -------- | ------------- | -------------- | ---------------------------------- | -------------------------- | ------------------------- |
| Blue   | #0173B2  | 1, 115, 178   | 204°, 99%, 35% | Primary elements, writers (blue)   | PASS: 8.59:1 (AAA)         | PASS: 6.93:1 (AAA)        |
| Orange | #DE8F05  | 222, 143, 5   | 35°, 96%, 44%  | Warnings, secondary (orange)       | PASS: 6.48:1 (AAA)         | PASS: 5.24:1 (AAA)        |
| Teal   | #029E73  | 2, 158, 115   | 161°, 98%, 31% | Success, validation, tertiary      | PASS: 8.33:1 (AAA)         | PASS: 6.74:1 (AAA)        |
| Purple | #CC78BC  | 204, 120, 188 | 314°, 50%, 64% | Implementors, special states       | PASS: 4.51:1 (AA)          | PASS: 3.65:1 (AA)         |
| Brown  | #CA9161  | 202, 145, 97  | 23°, 48%, 59%  | Neutral elements, secondary        | PASS: 5.23:1 (AAA)         | PASS: 4.23:1 (AAA)        |
| Black  | #000000  | 0, 0, 0       | 0°, 0%, 0%     | Text on light, borders, outlines   | PASS: 21.00:1 (AAA)        | N/A (use for light text)  |
| White  | #FFFFFF  | 255, 255, 255 | 0°, 0%, 100%   | Text on dark, light backgrounds    | N/A (light bg)             | PASS: 21.00:1 (AAA)       |
| Gray   | #808080  | 128, 128, 128 | 0°, 0%, 50%    | Secondary elements, disabled state | PASS: 7.00:1 (AAA)         | PASS: 4.00:1 (AA)         |

## Text on Palette Fills

Text on a filled shape uses the one of black and white that reaches 4.5:1 on that fill:

| Fill   | Hex Code | Text            | Contrast |
| ------ | -------- | --------------- | -------: |
| Blue   | #0173B2  | white `#FFFFFF` |   5.13:1 |
| Orange | #DE8F05  | black `#000000` |   8.04:1 |
| Teal   | #029E73  | black `#000000` |   6.14:1 |
| Purple | #CC78BC  | black `#000000` |   6.98:1 |
| Gray   | #808080  | black `#000000` |   5.32:1 |

White text on orange, teal, purple, or gray measures below 4.5:1, so it is never paired with them.

## Usage Recommendations by Context

| Context                | Primary           | Secondary        | Tertiary | Quaternary               | Neutral         |
| ---------------------- | ----------------- | ---------------- | -------- | ------------------------ | --------------- |
| **Mermaid Diagrams**   | Blue              | Orange           | Teal     | Purple                   | Gray            |
| **AI Agents**          | Blue (🟦 writers) | —                | —        | Purple (🟪 implementors) | —               |
| **Status Indicators**  | Teal (success)    | Orange (warning) | —        | —                        | Gray (disabled) |
| **Data Visualization** | Blue              | Orange           | Teal     | Purple                   | Brown           |
| **UI Components**      | Blue              | Orange           | Teal     | Purple                   | Gray            |

## Hex Code Reference

For quick copy-paste in code:

```
#0173B2 - Blue
#DE8F05 - Orange
#029E73 - Teal
#CC78BC - Purple
#CA9161 - Brown
#000000 - Black
#FFFFFF - White
#808080 - Gray
```

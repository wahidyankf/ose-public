# Accessibility Reference

## Per-Component ARIA Checklists

### Button

| Attribute       | When Required     | Example                     |
| --------------- | ----------------- | --------------------------- |
| `aria-label`    | Icon-only buttons | `aria-label="Close dialog"` |
| `aria-disabled` | Disabled state    | `aria-disabled={true}`      |
| `aria-pressed`  | Toggle buttons    | `aria-pressed={isActive}`   |
| `aria-expanded` | Show/hide content | `aria-expanded={isOpen}`    |
| `aria-busy`     | Loading state     | `aria-busy={isLoading}`     |

### Input / TextField

| Attribute                | When Required    | Example                          |
| ------------------------ | ---------------- | -------------------------------- |
| `aria-invalid`           | Validation error | `aria-invalid={!!error}`         |
| `aria-describedby`       | Error/help text  | `aria-describedby="email-error"` |
| `aria-required`          | Required field   | `aria-required={true}`           |
| `autocomplete`           | Common fields    | `autocomplete="email"`           |
| `inputmode`              | Mobile keyboard  | `inputmode="numeric"`            |
| `id` + `<label htmlFor>` | Always           | `<label htmlFor="email">`        |

### Dialog / Modal

| Attribute          | When Required | Example                          |
| ------------------ | ------------- | -------------------------------- |
| `aria-modal`       | Always        | `aria-modal={true}`              |
| `aria-labelledby`  | Title element | `aria-labelledby="dialog-title"` |
| `aria-describedby` | Description   | `aria-describedby="dialog-desc"` |
| Focus trap         | Always        | Radix handles automatically      |
| Focus restore      | Always        | Radix handles automatically      |

### Menu / Dropdown

| Attribute         | When Required  | Example                         |
| ----------------- | -------------- | ------------------------------- |
| `role="menu"`     | Container      | Radix provides automatically    |
| `role="menuitem"` | Each item      | Radix provides automatically    |
| `aria-expanded`   | Trigger button | `aria-expanded={isOpen}`        |
| `aria-haspopup`   | Trigger button | `aria-haspopup="menu"`          |
| Arrow key nav     | Always         | Up/Down navigate, Enter selects |

### Tooltip

| Attribute          | When Required  | Example                      |
| ------------------ | -------------- | ---------------------------- |
| `role="tooltip"`   | Content        | Radix provides automatically |
| `aria-describedby` | Trigger        | Radix provides automatically |
| Keyboard           | Shows on focus | Radix handles automatically  |
| Delay              | Min 300ms show | `delayDuration={300}`        |

## Keyboard Navigation

| Component | Tab           | Enter/Space | Escape | Arrow Keys     |
| --------- | ------------- | ----------- | ------ | -------------- |
| Button    | Focus         | Activate    | —      | —              |
| Input     | Focus         | —           | —      | —              |
| Dialog    | First element | —           | Close  | —              |
| Menu      | Trigger       | Open/select | Close  | Navigate items |
| Tooltip   | Shows         | —           | —      | —              |
| Tabs      | Active tab    | Select tab  | —      | Switch tabs    |

## Focus-Visible Pattern

```tsx
// Standard focus ring
className = "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// Destructive actions
className = "focus-visible:ring-2 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40";
```

## Reduced Motion

```tsx
// Tailwind prefix
<div className="transition-colors motion-reduce:transition-none">
```

## Hit Target Sizes

| Context     | Minimum | Tailwind            |
| ----------- | ------- | ------------------- |
| Desktop     | 24px    | `min-h-6 min-w-6`   |
| Mobile      | 44px    | `min-h-11 min-w-11` |
| Icon button | 36px    | `size-9`            |

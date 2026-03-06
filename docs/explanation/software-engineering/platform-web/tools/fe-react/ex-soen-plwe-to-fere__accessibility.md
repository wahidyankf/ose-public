---
title: "React Accessibility"
description: Accessibility standards and patterns for inclusive React applications
category: explanation
subcategory: platform-web
tags:
  - react
  - accessibility
  - a11y
  - aria
  - wcag
related:
  - ./ex-soen-plwe-fere__best-practices.md
principles:
  - explicit-over-implicit
updated: 2026-01-25
---

# React Accessibility

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [TypeScript React](./README.md) > Accessibility

**Related Guides**:

- [Best Practices](ex-soen-plwe-to-fere__best-practices.md) - Accessibility standards
- [Styling](ex-soen-plwe-to-fere__styling.md) - Accessible styling

## Overview

Accessibility ensures applications are usable by everyone, including people with disabilities. This guide covers ARIA attributes, semantic HTML, keyboard navigation, screen readers, and WCAG AA compliance.

**Target Audience**: Developers building inclusive React applications, particularly Islamic finance platforms serving diverse global communities.

**React Version**: React 19.0 with TypeScript 5+
**Standard**: WCAG 2.1 Level AA

## Semantic HTML

### Use Native Elements

```typescript
// ❌ Bad - div soup
export const BadButton: React.FC = () => (
  <div onClick={() => console.log('Clicked')} style={{ cursor: 'pointer' }}>
    Click me
  </div>
);

// ✅ Good - semantic button
export const GoodButton: React.FC = () => (
  <button onClick={() => console.log('Clicked')}>
    Click me
  </button>
);

// ❌ Bad - divs for list
export const BadList: React.FC<{ items: string[] }> = ({ items }) => (
  <div>
    {items.map(item => (
      <div key={item}>{item}</div>
    ))}
  </div>
);

// ✅ Good - semantic list
export const GoodList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul>
    {items.map(item => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);
```

## ARIA Attributes

### Common ARIA Patterns

```typescript
// Modal dialog
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="modal"
    >
      <h2 id={titleId}>{title}</h2>
      <div>{children}</div>
      <button onClick={onClose} aria-label="Close dialog">
        ×
      </button>
    </div>
  );
};

// Alert
export const Alert: React.FC<{ message: string; type: 'error' | 'warning' | 'info' }> = ({
  message,
  type,
}) => (
  <div
    role="alert"
    aria-live="assertive"
    className={`alert alert-${type}`}
  >
    {message}
  </div>
);

// Loading spinner
export const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = 'Loading',
}) => (
  <div role="status" aria-live="polite">
    <div className="spinner" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
);
```

## Keyboard Navigation

### Focus Management

```typescript
import { useEffect, useRef } from 'react';

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus first focusable element in modal
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    } else {
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      className="modal"
    >
      {children}
    </div>
  );
};
```

### Focus Trap

```typescript
import { useEffect, useRef } from 'react';

export function useFocusTrap(enabled: boolean) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled]);

  return ref;
}

// Usage
export const Dialog: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const dialogRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div ref={dialogRef as any} role="dialog">
      <button>First</button>
      <button>Second</button>
      <button>Last</button>
    </div>
  );
};
```

## Screen Reader Support

### Accessible Form Labels

```typescript
export const DonationForm: React.FC = () => {
  const amountId = useId();
  const emailId = useId();

  return (
    <form>
      <div>
        <label htmlFor={amountId}>
          Donation Amount
          <span aria-label="required">*</span>
        </label>
        <input
          id={amountId}
          type="number"
          required
          aria-required="true"
          aria-describedby={`${amountId}-hint`}
        />
        <small id={`${amountId}-hint`}>
          Minimum donation is $10
        </small>
      </div>

      <div>
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          type="email"
          aria-invalid={/* has error */}
          aria-describedby={/* error message id */}
        />
      </div>
    </form>
  );
};
```

### Live Regions

```typescript
export const DonationProgress: React.FC<{ raised: number; goal: number }> = ({
  raised,
  goal,
}) => {
  const percentage = (raised / goal) * 100;

  return (
    <div>
      <div className="progress-bar" role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percentage}% of goal reached`}
      >
        <div style={{ width: `${percentage}%` }} />
      </div>

      <div aria-live="polite" aria-atomic="true">
        {raised} of {goal} raised ({percentage.toFixed(1)}%)
      </div>
    </div>
  );
};
```

## Related Documentation

- **[Best Practices](ex-soen-plwe-to-fere__best-practices.md)** - Accessibility standards
- **[Styling](ex-soen-plwe-to-fere__styling.md)** - Accessible styling
- **[Forms](ex-soen-plwe-to-fere__forms.md)** - Accessible forms

---

**Last Updated**: 2026-01-25

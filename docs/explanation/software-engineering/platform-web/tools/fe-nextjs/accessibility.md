---
title: Next.js Accessibility
description: Comprehensive guide to building accessible Next.js applications with WCAG AA compliance, ARIA patterns, keyboard navigation, and screen reader support
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - accessibility
  - wcag
  - aria
  - keyboard-navigation
  - screen-readers
  - a11y
principles:
  - accessibility-first
  - simplicity-over-complexity
created: 2026-01-26
---

# Next.js Accessibility

Building accessible applications ensures everyone can use your software regardless of disability. This guide covers WCAG AA compliance, ARIA patterns, keyboard navigation, screen reader support, and testing strategies for Next.js applications.

## 📋 Quick Reference

- [WCAG Standards](#-wcag-standards) - Web Content Accessibility Guidelines
- [Semantic HTML](#-semantic-html) - Accessible markup structure
- [ARIA Patterns](#-aria-patterns) - Accessible Rich Internet Applications
- [Keyboard Navigation](#-keyboard-navigation) - Full keyboard accessibility
- [Screen Reader Support](#-screen-reader-support) - VoiceOver, NVDA, JAWS
- [Focus Management](#-focus-management) - Focus indicators and trapping
- [Color and Contrast](#-color-and-contrast) - WCAG AA color requirements
- [Form Accessibility](#-form-accessibility) - Labels, errors, validation
- [Images and Media](#-images-and-media) - Alt text and captions
- [Accessible Components](#-accessible-components) - Buttons, modals, dropdowns
- [Skip Links](#-skip-links) - Navigation shortcuts
- [Responsive Accessibility](#-responsive-accessibility) - Mobile considerations
- [Testing Accessibility](#-testing-accessibility) - Tools and techniques
- [OSE Platform Examples](#-ose-platform-examples) - Islamic finance a11y patterns
- [Accessibility Checklist](#-accessibility-checklist) - Production compliance
- [Related Documentation](#-related-documentation) - Cross-references

## 📜 WCAG Standards

**WCAG (Web Content Accessibility Guidelines)** define international accessibility standards with three compliance levels: A, AA, and AAA. This guide targets **WCAG 2.1 Level AA** as the production standard.

### Four WCAG Principles (POUR)

**Perceivable**: Information must be presentable to users in ways they can perceive.

- Provide text alternatives for non-text content
- Provide captions and alternatives for multimedia
- Create content that can be presented in different ways
- Make it easier for users to see and hear content

**Operable**: User interface components must be operable.

- Make all functionality available from keyboard
- Provide users enough time to read and use content
- Do not design content that causes seizures
- Help users navigate and find content

**Understandable**: Information and operation must be understandable.

- Make text readable and understandable
- Make content appear and operate in predictable ways
- Help users avoid and correct mistakes

**Robust**: Content must be robust enough for reliable interpretation.

- Maximize compatibility with current and future tools
- Use valid HTML
- Ensure compatibility with assistive technologies

### WCAG 2.1 AA Requirements

**Level A (Basic)**:

- Non-text content has text alternatives
- Time-based media has alternatives
- Content is adaptable
- Content is distinguishable
- All functionality available via keyboard
- Users can control timing
- Content does not cause seizures
- Pages are navigable
- Text is readable
- Pages appear and operate predictably
- Input assistance provided
- Content compatible with assistive technologies

**Level AA (Production Standard)**:

- Audio has captions
- Video has audio descriptions
- Visual presentation adjustable
- Color contrast ratio at least 4.5:1 (3:1 for large text)
- Images of text not used (except logos)
- Multiple ways to find pages
- Headings and labels describe topic
- Focus visible
- Three or more flashes per second
- Error suggestions provided
- Error prevention for legal/financial/data

## 🏷️ Semantic HTML

Use semantic HTML5 elements for automatic accessibility.

### Semantic Structure

```typescript
// Good - Semantic HTML
export function ArticlePage() {
  return (
    <>
      <header>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <article>
          <header>
            <h1>Article Title</h1>
            <p>Published on <time dateTime="2026-01-26">January 26, 2026</time></p>
          </header>

          <section>
            <h2>Section Heading</h2>
            <p>Content</p>
          </section>

          <footer>
            <p>Author: John Doe</p>
          </footer>
        </article>

        <aside>
          <h2>Related Articles</h2>
          <ul>
            <li><a href="/article-2">Article 2</a></li>
          </ul>
        </aside>
      </main>

      <footer>
        <p>&copy; 2026 Company Name</p>
      </footer>
    </>
  );
}
```

### Heading Hierarchy

```typescript
// Correct heading hierarchy
export function ZakatDashboard() {
  return (
    <main>
      <h1>Zakat Dashboard</h1>

      <section>
        <h2>Recent Calculations</h2>
        <article>
          <h3>Calculation #1</h3>
          <p>Details</p>
        </article>
        <article>
          <h3>Calculation #2</h3>
          <p>Details</p>
        </article>
      </section>

      <section>
        <h2>Payment History</h2>
        <h3>2026</h3>
        <ul>
          <li>Payment 1</li>
        </ul>
        <h3>2025</h3>
        <ul>
          <li>Payment 2</li>
        </ul>
      </section>
    </main>
  );
}
```

### Lists

```typescript
// Use semantic lists
export function NavigationMenu() {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/zakat">Zakat</a></li>
        <li><a href="/murabaha">Murabaha</a></li>
        <li><a href="/waqf">Waqf</a></li>
      </ul>
    </nav>
  );
}

// Ordered list for steps
export function Tutorial() {
  return (
    <article>
      <h2>How to Calculate Zakat</h2>
      <ol>
        <li>Determine your total wealth</li>
        <li>Calculate the nisab threshold</li>
        <li>Apply the 2.5% rate</li>
        <li>Distribute to eligible recipients</li>
      </ol>
    </article>
  );
}

// Description list for term-definition pairs
export function Glossary() {
  return (
    <dl>
      <dt>Zakat</dt>
      <dd>Obligatory charity paid annually by eligible Muslims</dd>

      <dt>Nisab</dt>
      <dd>Minimum wealth threshold for zakat obligation</dd>

      <dt>Murabaha</dt>
      <dd>Islamic cost-plus financing contract</dd>
    </dl>
  );
}
```

## 🎭 ARIA Patterns

**ARIA (Accessible Rich Internet Applications)** enhances semantic HTML with additional accessibility information.

### ARIA Landmarks

```typescript
// Use ARIA landmarks for page regions
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header role="banner">
        <nav role="navigation" aria-label="Main navigation">
          {/* Navigation */}
        </nav>
      </header>

      <main role="main">
        {children}
      </main>

      <aside role="complementary" aria-label="Related information">
        {/* Sidebar */}
      </aside>

      <footer role="contentinfo">
        {/* Footer content */}
      </footer>
    </>
  );
}
```

### ARIA Labels and Descriptions

```typescript
'use client';

export function SearchForm() {
  return (
    <form role="search" aria-label="Search zakat calculations">
      <label htmlFor="search-input">Search:</label>
      <input
        id="search-input"
        type="search"
        aria-describedby="search-hint"
        placeholder="Enter keywords"
      />
      <span id="search-hint" className="sr-only">
        Search by amount, date, or status
      </span>
      <button type="submit" aria-label="Submit search">
        Search
      </button>
    </form>
  );
}

// Icon button with aria-label
export function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Delete calculation"
      className="icon-button"
    >
      <TrashIcon aria-hidden="true" />
    </button>
  );
}
```

### ARIA Live Regions

```typescript
'use client';

import { useState } from 'react';

export function ZakatCalculator() {
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const zakatAmount = 250;
    setResult(`Zakat due: $${zakatAmount}`);
  };

  return (
    <div>
      <button onClick={calculate}>Calculate Zakat</button>

      {/* Announce results to screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={result ? '' : 'sr-only'}
      >
        {result}
      </div>
    </div>
  );
}

// Loading state announcement
export function DataTable() {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      {loading && (
        <div role="status" aria-live="polite" aria-busy="true">
          Loading data...
        </div>
      )}
      <table>{/* Table content */}</table>
    </div>
  );
}
```

### Dialog (Modal) Pattern

```typescript
'use client';

import { useEffect, useRef } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus close button when dialog opens
      closeButtonRef.current?.focus();

      // Trap focus within dialog
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="dialog-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="dialog-title">{title}</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="dialog-close"
          >
            ×
          </button>
        </div>

        <div className="dialog-body">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### Accordion Pattern

```typescript
'use client';

import { useState } from 'react';

interface AccordionItemProps {
  id: string;
  title: string;
  content: string;
}

export function Accordion({ items }: { items: AccordionItemProps[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="accordion">
      {items.map((item) => (
        <div key={item.id} className="accordion-item">
          <h3>
            <button
              id={`accordion-header-${item.id}`}
              aria-expanded={expandedId === item.id}
              aria-controls={`accordion-panel-${item.id}`}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="accordion-trigger"
            >
              {item.title}
              <span aria-hidden="true">
                {expandedId === item.id ? '−' : '+'}
              </span>
            </button>
          </h3>

          <div
            id={`accordion-panel-${item.id}`}
            role="region"
            aria-labelledby={`accordion-header-${item.id}`}
            hidden={expandedId !== item.id}
            className="accordion-panel"
          >
            <p>{item.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## ⌨️ Keyboard Navigation

Ensure all interactive elements are keyboard accessible.

### Keyboard Support Requirements

```typescript
// All interactive elements must be keyboard accessible
export function InteractiveElements() {
  return (
    <div>
      {/* Native button - keyboard accessible by default */}
      <button onClick={() => alert('Clicked')}>
        Native Button
      </button>

      {/* Custom div button - needs tabindex and keyboard handler */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => alert('Clicked')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            alert('Clicked');
          }
        }}
      >
        Custom Button
      </div>

      {/* Link - keyboard accessible by default */}
      <a href="/zakat">Navigate to Zakat</a>
    </div>
  );
}
```

### Focus Order and Tab Index

```typescript
'use client';

export function Form() {
  return (
    <form>
      {/* Natural tab order */}
      <label htmlFor="name">Name:</label>
      <input id="name" type="text" />

      <label htmlFor="email">Email:</label>
      <input id="email" type="email" />

      {/* Skip this element in tab order */}
      <div tabIndex={-1}>Decorative element</div>

      {/* Explicitly in tab order */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {}}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {}
        }}
      >
        Custom Interactive Element
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Custom Keyboard Shortcuts

```typescript
'use client';

import { useEffect } from 'react';

export function KeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+S: Search
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }

      // Alt+H: Home
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = '/';
      }

      // Escape: Close modal
      if (e.key === 'Escape') {
        // Close modal logic
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div>
      <p>
        Keyboard shortcuts:
        <kbd>Alt+S</kbd> Search,
        <kbd>Alt+H</kbd> Home,
        <kbd>Esc</kbd> Close
      </p>
    </div>
  );
}
```

## 📢 Screen Reader Support

Optimize content for screen readers (VoiceOver, NVDA, JAWS).

### Screen Reader Only Text

```css
/* styles/globals.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

```typescript
// Usage
export function IconButton() {
  return (
    <button aria-label="Delete calculation">
      <TrashIcon aria-hidden="true" />
      <span className="sr-only">Delete calculation</span>
    </button>
  );
}
```

### Meaningful Link Text

```typescript
// BAD - Vague link text
export function BadLinks() {
  return (
    <div>
      <p>
        To learn more about zakat,{' '}
        <a href="/zakat-guide">click here</a>.
      </p>
    </div>
  );
}

// GOOD - Descriptive link text
export function GoodLinks() {
  return (
    <div>
      <p>
        Learn more about{' '}
        <a href="/zakat-guide">zakat calculation methods</a>.
      </p>

      {/* Or with aria-label for context */}
      <p>
        <a href="/zakat-guide" aria-label="Read the complete zakat calculation guide">
          Read more
        </a>
      </p>
    </div>
  );
}
```

### Table Accessibility

```typescript
export function DataTable() {
  return (
    <table>
      <caption>Zakat Calculations for 2026</caption>
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Wealth</th>
          <th scope="col">Nisab</th>
          <th scope="col">Zakat Due</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">2026-01-15</th>
          <td>$10,000</td>
          <td>$5,000</td>
          <td>$250</td>
        </tr>
        <tr>
          <th scope="row">2026-02-15</th>
          <td>$12,000</td>
          <td>$5,000</td>
          <td>$300</td>
        </tr>
      </tbody>
    </table>
  );
}
```

## 🎯 Focus Management

Manage focus indicators and focus trapping.

### Focus Indicators

```css
/* styles/globals.css */

/* Default focus indicator */
*:focus {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
}

/* Focus visible (keyboard only) */
*:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
}

/* Remove outline for mouse clicks */
*:focus:not(:focus-visible) {
  outline: none;
}

/* Custom focus styles for buttons */
button:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
}
```

### Focus Trap

```typescript
'use client';

import { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function FocusTrap({ children, isActive }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown as any);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [isActive]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}
```

## 🎨 Color and Contrast

Ensure sufficient color contrast and don't rely solely on color.

### WCAG AA Contrast Requirements

```css
/* Minimum contrast ratios */

/* Normal text (< 24px or < 19px bold) */
/* Contrast ratio: at least 4.5:1 */
.normal-text {
  color: #212121; /* Dark text */
  background-color: #ffffff; /* White background */
  /* Contrast ratio: 16.1:1 ✓ */
}

/* Large text (≥ 24px or ≥ 19px bold) */
/* Contrast ratio: at least 3:1 */
.large-text {
  font-size: 24px;
  color: #757575; /* Gray text */
  background-color: #ffffff;
  /* Contrast ratio: 4.6:1 ✓ */
}

/* Interactive elements (buttons, links) */
/* Contrast ratio: at least 3:1 with adjacent colors */
.button-primary {
  background-color: #4caf50; /* Green */
  color: #ffffff; /* White text */
  /* Contrast ratio: 4.5:1 ✓ */
}

/* Focus indicators */
/* Contrast ratio: at least 3:1 with background */
button:focus-visible {
  outline: 2px solid #1976d2; /* Blue outline */
  outline-offset: 2px;
  /* Contrast with white: 7.2:1 ✓ */
}
```

### Don't Rely on Color Alone

```typescript
// BAD - Color only to indicate status
export function BadStatusIndicator({ status }: { status: 'success' | 'error' }) {
  return (
    <div style={{ color: status === 'success' ? 'green' : 'red' }}>
      Status
    </div>
  );
}

// GOOD - Color + icon + text
export function GoodStatusIndicator({ status }: { status: 'success' | 'error' }) {
  return (
    <div className={status === 'success' ? 'status-success' : 'status-error'}>
      {status === 'success' ? (
        <>
          <CheckIcon aria-hidden="true" />
          <span>Success</span>
        </>
      ) : (
        <>
          <ErrorIcon aria-hidden="true" />
          <span>Error</span>
        </>
      )}
    </div>
  );
}
```

## 📝 Form Accessibility

Create accessible forms with proper labels, errors, and validation.

### Form Labels

```typescript
export function AccessibleForm() {
  return (
    <form>
      {/* Explicit label association */}
      <div>
        <label htmlFor="wealth-input">Total Wealth ($):</label>
        <input
          id="wealth-input"
          type="number"
          name="wealth"
          required
          aria-required="true"
        />
      </div>

      {/* Label wrapping input */}
      <div>
        <label>
          Nisab Threshold ($):
          <input type="number" name="nisab" required />
        </label>
      </div>

      {/* Checkbox with label */}
      <div>
        <input
          id="lunar-year"
          type="checkbox"
          name="lunarYear"
        />
        <label htmlFor="lunar-year">Use lunar year calculation</label>
      </div>

      {/* Radio group with fieldset */}
      <fieldset>
        <legend>Payment Frequency:</legend>
        <div>
          <input
            id="frequency-monthly"
            type="radio"
            name="frequency"
            value="monthly"
          />
          <label htmlFor="frequency-monthly">Monthly</label>
        </div>
        <div>
          <input
            id="frequency-quarterly"
            type="radio"
            name="frequency"
            value="quarterly"
          />
          <label htmlFor="frequency-quarterly">Quarterly</label>
        </div>
      </fieldset>

      <button type="submit">Calculate Zakat</button>
    </form>
  );
}
```

### Form Validation and Errors

```typescript
'use client';

import { useState } from 'react';

export function ZakatForm() {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [wealth, setWealth] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!wealth) {
      newErrors.wealth = 'Wealth is required';
    } else if (parseFloat(wealth) <= 0) {
      newErrors.wealth = 'Wealth must be positive';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus first error
      document.getElementById('wealth-input')?.focus();
      return;
    }

    // Submit form
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Zakat calculation form">
      <div>
        <label htmlFor="wealth-input">Total Wealth ($):</label>
        <input
          id="wealth-input"
          type="number"
          value={wealth}
          onChange={(e) => setWealth(e.target.value)}
          aria-invalid={!!errors.wealth}
          aria-describedby={errors.wealth ? 'wealth-error' : undefined}
        />
        {errors.wealth && (
          <div id="wealth-error" role="alert" className="error">
            {errors.wealth}
          </div>
        )}
      </div>

      <button type="submit">Calculate</button>
    </form>
  );
}
```

## 🖼️ Images and Media

Provide text alternatives for all non-text content.

### Image Alt Text

```typescript
import Image from 'next/image';

export function ImageExamples() {
  return (
    <div>
      {/* Informative image */}
      <Image
        src="/zakat-calculation-chart.png"
        alt="Bar chart showing zakat calculations by month for 2026"
        width={800}
        height={400}
      />

      {/* Decorative image */}
      <Image
        src="/decorative-pattern.png"
        alt=""
        aria-hidden="true"
        width={100}
        height={100}
      />

      {/* Functional image (link) */}
      <a href="/">
        <Image
          src="/logo.png"
          alt="OSE Platform home page"
          width={200}
          height={50}
        />
      </a>

      {/* Complex image with longdesc */}
      <figure>
        <Image
          src="/complex-diagram.png"
          alt="Zakat calculation flowchart"
          width={800}
          height={600}
        />
        <figcaption>
          <details>
            <summary>Detailed description</summary>
            <p>
              This flowchart shows the complete process of calculating zakat.
              Step 1: Determine total wealth including cash, gold, silver...
            </p>
          </details>
        </figcaption>
      </figure>
    </div>
  );
}
```

### Video Accessibility

```typescript
export function VideoPlayer() {
  return (
    <div>
      <video
        controls
        aria-label="Zakat calculation tutorial"
      >
        <source src="/zakat-tutorial.mp4" type="video/mp4" />
        <track
          kind="captions"
          src="/zakat-tutorial-captions-en.vtt"
          srclang="en"
          label="English"
          default
        />
        <track
          kind="captions"
          src="/zakat-tutorial-captions-ar.vtt"
          srclang="ar"
          label="Arabic"
        />
        <track
          kind="descriptions"
          src="/zakat-tutorial-descriptions.vtt"
          srclang="en"
          label="Audio descriptions"
        />
        <p>
          Your browser doesn't support HTML video.
          <a href="/zakat-tutorial.mp4">Download the video</a> instead.
        </p>
      </video>
    </div>
  );
}
```

## 🧩 Accessible Components

Build accessible reusable components.

### Accessible Button

```typescript
'use client';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button-${variant} button-${size}`}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="spinner" aria-hidden="true" />
      )}
      <span className={loading ? 'sr-only' : ''}>
        {children}
      </span>
    </button>
  );
}
```

### Accessible Dropdown

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  items: { label: string; onClick: () => void }[];
}

export function Dropdown({ trigger, items }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="dropdown" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="dropdown-menu"
      >
        {trigger}
      </button>

      {isOpen && (
        <ul
          id="dropdown-menu"
          role="menu"
          className="dropdown-menu"
        >
          {items.map((item, index) => (
            <li key={index} role="none">
              <button
                role="menuitem"
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="dropdown-item"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 🔗 Skip Links

Provide skip links for keyboard navigation.

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <a href="#navigation" className="skip-link">
          Skip to navigation
        </a>

        <header>
          <nav id="navigation">
            {/* Navigation */}
          </nav>
        </header>

        <main id="main-content">
          {children}
        </main>

        <footer>
          {/* Footer */}
        </footer>
      </body>
    </html>
  );
}
```

```css
/* styles/globals.css */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #4caf50;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## 📱 Responsive Accessibility

Ensure accessibility across devices.

### Touch Targets

```css
/* Minimum touch target size: 44x44px */
button,
a {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Spacing between touch targets */
.button-group {
  display: flex;
  gap: 8px; /* At least 8px between targets */
}
```

### Responsive Text

```css
/* Ensure text can be resized up to 200% */
html {
  font-size: 16px;
}

body {
  font-size: 1rem;
  line-height: 1.5;
}

/* Use rem for responsive sizing */
h1 {
  font-size: 2rem; /* 32px at base size */
}

h2 {
  font-size: 1.5rem; /* 24px at base size */
}

/* Allow text zoom without horizontal scrolling */
body {
  overflow-x: hidden;
  word-wrap: break-word;
}
```

## 🧪 Testing Accessibility

Tools and techniques for testing accessibility.

### Automated Testing

```bash
# Install axe-core for automated testing
npm install -D @axe-core/react jest-axe
```

```typescript
// __tests__/accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ZakatCalculator } from '@/components/ZakatCalculator';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<ZakatCalculator />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist

- [ ] **Keyboard Navigation**: Tab through all interactive elements
- [ ] **Screen Reader**: Test with VoiceOver (Mac), NVDA (Windows), JAWS (Windows)
- [ ] **Zoom**: Test at 200% zoom
- [ ] **High Contrast**: Test in high contrast mode
- [ ] **Color Blindness**: Use color blindness simulator
- [ ] **Focus Indicators**: Verify visible focus on all interactive elements
- [ ] **ARIA**: Validate ARIA attributes with browser dev tools
- [ ] **Forms**: Test form validation and error announcements
- [ ] **Headings**: Verify proper heading hierarchy
- [ ] **Alt Text**: Verify all images have appropriate alt text

### Lighthouse Accessibility Audit

```bash
# Run Lighthouse audit
npx lighthouse https://your-site.com --only-categories=accessibility --view
```

## 🕌 OSE Platform Examples

Accessible Islamic finance components.

### Accessible Zakat Calculator

```typescript
'use client';

import { useState } from 'react';

export function AccessibleZakatCalculator() {
  const [wealth, setWealth] = useState('');
  const [nisab, setNisab] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!wealth) newErrors.wealth = 'Wealth is required';
    if (!nisab) newErrors.nisab = 'Nisab is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const wealthNum = parseFloat(wealth);
    const nisabNum = parseFloat(nisab);

    if (wealthNum >= nisabNum) {
      setResult(wealthNum * 0.025);
    } else {
      setResult(0);
    }

    setErrors({});
  };

  return (
    <section aria-labelledby="calculator-heading">
      <h2 id="calculator-heading">Zakat Calculator</h2>

      <form onSubmit={calculate} aria-label="Zakat calculation form">
        <div>
          <label htmlFor="wealth-input">
            Total Wealth ($):
            <span aria-label="required">*</span>
          </label>
          <input
            id="wealth-input"
            type="number"
            value={wealth}
            onChange={(e) => setWealth(e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.wealth}
            aria-describedby={errors.wealth ? 'wealth-error' : 'wealth-hint'}
          />
          <span id="wealth-hint" className="hint">
            Enter your total eligible wealth
          </span>
          {errors.wealth && (
            <div id="wealth-error" role="alert" className="error">
              {errors.wealth}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="nisab-input">
            Nisab Threshold ($):
            <span aria-label="required">*</span>
          </label>
          <input
            id="nisab-input"
            type="number"
            value={nisab}
            onChange={(e) => setNisab(e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.nisab}
            aria-describedby={errors.nisab ? 'nisab-error' : 'nisab-hint'}
          />
          <span id="nisab-hint" className="hint">
            Current nisab threshold (updated annually)
          </span>
          {errors.nisab && (
            <div id="nisab-error" role="alert" className="error">
              {errors.nisab}
            </div>
          )}
        </div>

        <button type="submit">Calculate Zakat</button>
      </form>

      {result !== null && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="result"
        >
          <h3>Result</h3>
          {result > 0 ? (
            <p>
              Zakat due: <strong>${result.toFixed(2)}</strong>
            </p>
          ) : (
            <p>Your wealth is below the nisab threshold. No zakat is due.</p>
          )}
        </div>
      )}
    </section>
  );
}
```

## ✅ Accessibility Checklist

Production accessibility checklist:

### Content

- [ ] Proper heading hierarchy (single H1, sequential headings)
- [ ] Descriptive link text (no "click here")
- [ ] Alt text for all meaningful images
- [ ] Captions for videos
- [ ] Transcripts for audio content
- [ ] Text alternatives for complex images (charts, diagrams)

### Semantic HTML

- [ ] Use semantic HTML5 elements (header, nav, main, article, aside, footer)
- [ ] Proper list markup (ul, ol, dl)
- [ ] Fieldset and legend for form groups
- [ ] Table headers with proper scope

### ARIA

- [ ] ARIA landmarks used appropriately
- [ ] ARIA labels for icon buttons
- [ ] ARIA live regions for dynamic content
- [ ] ARIA states (aria-expanded, aria-selected, aria-checked)
- [ ] ARIA descriptions for complex interactions

### Keyboard

- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order
- [ ] Visible focus indicators
- [ ] No keyboard traps
- [ ] Skip links provided
- [ ] Escape key closes modals

### Color and Contrast

- [ ] Color contrast at least 4.5:1 for normal text
- [ ] Color contrast at least 3:1 for large text and UI components
- [ ] Information not conveyed by color alone
- [ ] Focus indicators have 3:1 contrast with background

### Forms

- [ ] All inputs have associated labels
- [ ] Required fields marked with aria-required
- [ ] Error messages announced to screen readers
- [ ] Validation errors linked with aria-describedby

### Media

- [ ] Images have alt text
- [ ] Decorative images have empty alt (`alt=""`)
- [ ] Videos have captions
- [ ] Videos have audio descriptions

### Testing

- [ ] Tested with keyboard only
- [ ] Tested with screen reader (VoiceOver, NVDA, JAWS)
- [ ] Tested at 200% zoom
- [ ] Automated accessibility audit passed (axe, Lighthouse)
- [ ] Manual WCAG 2.1 AA compliance verified

## 🔗 Related Documentation

- [Next.js README](./README.md) - Next.js overview and getting started
- [Next.js Styling](styling.md) - Color contrast and focus indicators
- [Next.js Components](best-practices.md) - Accessible component patterns

---

**Next Steps:**

- Review [Next.js Styling](styling.md) for accessible color usage
- Explore [Next.js Testing](testing.md) for accessibility testing
- Check [Next.js Security](security.md) for secure accessible forms

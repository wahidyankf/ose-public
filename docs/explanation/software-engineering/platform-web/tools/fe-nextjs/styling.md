---
title: Next.js Styling
description: Comprehensive guide to styling Next.js applications with CSS Modules, Tailwind CSS, CSS-in-JS, and next/font optimization
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - styling
  - css
  - tailwind
  - css-modules
  - fonts
  - theming
  - responsive-design
principles:
  - simplicity-over-complexity
  - explicit-over-implicit
  - accessibility-first
created: 2026-01-26
---

# Next.js Styling

Next.js provides multiple styling solutions optimized for performance, developer experience, and production builds. This guide covers all styling approaches from CSS Modules to Tailwind CSS, CSS-in-JS solutions, font optimization, theming, and responsive design patterns.

## 📋 Quick Reference

- [CSS Modules](#-css-modules) - Scoped CSS with zero runtime overhead
- [Tailwind CSS](#-tailwind-css) - Utility-first CSS framework integration
- [Global Styles](#-global-styles) - Application-wide styling patterns
- [CSS-in-JS](#-css-in-js) - Runtime styling with styled-components and Emotion
- [Font Optimization](#-font-optimization) - next/font for performance
- [Theming](#-theming) - Dark mode and theme management
- [Responsive Design](#-responsive-design) - Mobile-first patterns
- [RTL Support](#-rtl-support) - Right-to-left languages for Arabic
- [Performance](#-performance) - CSS optimization strategies
- [OSE Platform Examples](#-ose-platform-examples) - Islamic design patterns
- [Best Practices](#-best-practices) - Production styling guidelines
- [Related Documentation](#-related-documentation) - Cross-references

## 🎨 CSS Modules

**CSS Modules** are the recommended default styling approach in Next.js, providing locally-scoped CSS with zero runtime overhead and automatic code splitting.

### Basic CSS Modules

```typescript
// components/ZakatCalculator/ZakatCalculator.tsx
import styles from './ZakatCalculator.module.css';

export function ZakatCalculator() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Zakat Calculator</h2>
      <form className={styles.form}>
        <input className={styles.input} type="number" />
        <button className={styles.button}>Calculate</button>
      </form>
    </div>
  );
}
```

```css
/* components/ZakatCalculator/ZakatCalculator.module.css */
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
}

.button {
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button:hover {
  background-color: var(--primary-dark);
}
```

### Composing Styles

```css
/* components/Card/Card.module.css */
.base {
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.elevated {
  composes: base;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.interactive {
  composes: elevated;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}
```

```typescript
// components/Card/Card.tsx
import styles from './Card.module.css';

interface CardProps {
  variant?: 'base' | 'elevated' | 'interactive';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({ variant = 'base', children, onClick }: CardProps) {
  return (
    <div className={styles[variant]} onClick={onClick}>
      {children}
    </div>
  );
}
```

### Conditional Classes

```typescript
// components/Alert/Alert.tsx
import styles from './Alert.module.css';

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export function Alert({ type, message }: AlertProps) {
  return (
    <div className={`${styles.alert} ${styles[type]}`}>
      {message}
    </div>
  );
}
```

```css
/* components/Alert/Alert.module.css */
.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
}

.info {
  background-color: #e3f2fd;
  border-color: #2196f3;
  color: #1565c0;
}

.success {
  background-color: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.warning {
  background-color: #fff3e0;
  border-color: #ff9800;
  color: #e65100;
}

.error {
  background-color: #ffebee;
  border-color: #f44336;
  color: #c62828;
}
```

### Dynamic Styles with CSS Variables

```typescript
// components/ProgressBar/ProgressBar.tsx
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
}

export function ProgressBar({ progress, color = '#4caf50' }: ProgressBarProps) {
  return (
    <div
      className={styles.container}
      style={{ '--progress': `${progress}%`, '--color': color } as React.CSSProperties}
    >
      <div className={styles.bar} />
    </div>
  );
}
```

```css
/* components/ProgressBar/ProgressBar.module.css */
.container {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  width: var(--progress);
  background-color: var(--color);
  transition: width 0.3s ease-in-out;
}
```

## 🎨 Tailwind CSS

**Tailwind CSS** is a utility-first CSS framework that integrates seamlessly with Next.js for rapid UI development.

### Installation and Setup

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e8f5e9",
          100: "#c8e6c9",
          500: "#4caf50",
          600: "#43a047",
          700: "#388e3c",
        },
        secondary: {
          50: "#e3f2fd",
          500: "#2196f3",
          700: "#1976d2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        arabic: ["var(--font-amiri)", "serif"],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

export default config;
```

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-inter: "Inter", sans-serif;
    --font-amiri: "Amiri", serif;
  }

  body {
    @apply bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 rounded-lg px-4 py-2 font-semibold text-white transition-colors duration-200;
  }

  .card {
    @apply rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800;
  }
}
```

### Tailwind with Components

```typescript
// components/ZakatCard.tsx
interface ZakatCardProps {
  title: string;
  amount: number;
  description: string;
}

export function ZakatCard({ title, amount, description }: ZakatCardProps) {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-4">
        ${amount.toLocaleString()}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
```

### Responsive Utilities

```typescript
// components/Dashboard.tsx
export function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ZakatCard title="Total Zakat" amount={2500} description="This year" />
        <ZakatCard title="Pending" amount={500} description="Next payment" />
        <ZakatCard title="Paid" amount={2000} description="Completed" />
      </div>

      {/* Responsive flex layout */}
      <div className="mt-8 flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Recent Calculations</h2>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Payment History</h2>
        </div>
      </div>
    </div>
  );
}
```

### Custom Utilities

```typescript
// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      // Custom utilities
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
};
```

```typescript
// Usage with custom animations
export function Notification({ message }: { message: string }) {
  return (
    <div className="animate-fade-in card">
      {message}
    </div>
  );
}
```

## 🌍 Global Styles

Global styles apply to the entire application and should be imported in the root layout.

### Global CSS Structure

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS Variables */
:root {
  /* Colors */
  --primary-color: #4caf50;
  --primary-dark: #388e3c;
  --primary-light: #81c784;

  --secondary-color: #2196f3;
  --secondary-dark: #1976d2;

  --text-primary: #212121;
  --text-secondary: #757575;

  --border-color: #e0e0e0;
  --background: #ffffff;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 200ms ease-in-out;
  --transition-slow: 300ms ease-in-out;
}

/* Dark mode variables */
[data-theme="dark"] {
  --primary-color: #81c784;
  --primary-dark: #66bb6a;

  --text-primary: #f5f5f5;
  --text-secondary: #bdbdbd;

  --border-color: #424242;
  --background: #121212;
}

/* Base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family:
    var(--font-inter),
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
  color: var(--text-primary);
  background-color: var(--background);
  line-height: 1.6;
}

/* Typography */
h1,
h2,
h3,
h4,
h5,
h6 {
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: var(--spacing-md);
}

h1 {
  font-size: var(--font-size-3xl);
}

h2 {
  font-size: var(--font-size-2xl);
}

h3 {
  font-size: var(--font-size-xl);
}

p {
  margin-bottom: var(--spacing-md);
}

/* Links */
a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* Focus styles for accessibility */
*:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Utility classes */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

### Importing Global Styles

```typescript
// app/layout.tsx
import './globals.css';
import { Inter, Amiri } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic'],
  variable: '--font-amiri',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${amiri.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

## 💅 CSS-in-JS

Next.js supports CSS-in-JS libraries with special configuration for Server Components.

### styled-components Setup

```bash
npm install styled-components
npm install -D @types/styled-components
```

```typescript
// lib/registry.tsx
'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== 'undefined') return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
```

```typescript
// app/layout.tsx
import StyledComponentsRegistry from '@/lib/registry';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
```

### styled-components Usage

```typescript
// components/Button.tsx
'use client';

import styled from 'styled-components';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const StyledButton = styled.button<ButtonProps>`
  padding: ${props => {
    switch (props.size) {
      case 'sm': return '0.5rem 1rem';
      case 'lg': return '1rem 2rem';
      default: return '0.75rem 1.5rem';
    }
  }};

  font-size: ${props => {
    switch (props.size) {
      case 'sm': return '0.875rem';
      case 'lg': return '1.125rem';
      default: return '1rem';
    }
  }};

  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  ${props => {
    switch (props.variant) {
      case 'secondary':
        return `
          background-color: #2196f3;
          color: white;
          border: none;

          &:hover {
            background-color: #1976d2;
          }
        `;
      case 'outline':
        return `
          background-color: transparent;
          color: #4caf50;
          border: 2px solid #4caf50;

          &:hover {
            background-color: #4caf50;
            color: white;
          }
        `;
      default:
        return `
          background-color: #4caf50;
          color: white;
          border: none;

          &:hover {
            background-color: #388e3c;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #4caf50;
    outline-offset: 2px;
  }
`;

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <StyledButton variant={variant} size={size} {...props}>
      {children}
    </StyledButton>
  );
}
```

### Emotion Setup

```bash
npm install @emotion/react @emotion/styled
npm install -D @emotion/cache
```

```typescript
// lib/emotion-cache.tsx
'use client';

import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { useState } from 'react';

export default function EmotionRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cache] = useState(() => {
    const cache = createCache({ key: 'css' });
    cache.compat = true;
    return cache;
  });

  useServerInsertedHTML(() => {
    return (
      <style
        data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: Object.values(cache.inserted).join(' '),
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
```

### Emotion Usage

```typescript
// components/Card.tsx
'use client';

import styled from '@emotion/styled';
import { css } from '@emotion/react';

const cardBase = css`
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
`;

const Card = styled.div<{ interactive?: boolean }>`
  ${cardBase}

  ${props => props.interactive && css`
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
  `}
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #212121;
`;

const CardContent = styled.p`
  color: #757575;
  line-height: 1.6;
`;

interface CardComponentProps {
  title: string;
  content: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function CardComponent({
  title,
  content,
  interactive,
  onClick
}: CardComponentProps) {
  return (
    <Card interactive={interactive} onClick={onClick}>
      <CardTitle>{title}</CardTitle>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
```

## 🔤 Font Optimization

**next/font** automatically optimizes fonts with zero layout shift and improved performance.

### Google Fonts

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono, Amiri } from 'next/font/google';

// Primary font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Monospace for code
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

// Arabic font for Islamic content
const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-amiri',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${robotoMono.variable} ${amiri.variable}`}
    >
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Local Fonts

```typescript
// app/layout.tsx
import localFont from 'next/font/local';

const customFont = localFont({
  src: [
    {
      path: './fonts/CustomFont-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/CustomFont-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-custom',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={customFont.variable}>
      <body className={customFont.className}>{children}</body>
    </html>
  );
}
```

### Font Loading Strategies

```typescript
// Preload fonts for critical pages
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true, // Default: true
  adjustFontFallback: true, // Minimize layout shift
});

// Subset optimization
const interOptimized = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "600", "700"], // Only load needed weights
});

// Variable fonts
const interVariable = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  // Variable fonts support all weights without separate files
});
```

### Using Font Variables in CSS

```css
/* globals.css */
body {
  font-family:
    var(--font-inter),
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

code,
pre {
  font-family: var(--font-roboto-mono), monospace;
}

/* Arabic content */
[lang="ar"],
.arabic-text {
  font-family: var(--font-amiri), serif;
  direction: rtl;
}
```

## 🌓 Theming

Implement dark mode and custom themes with CSS variables and theme providers.

### CSS Variables Theming

```typescript
// components/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Get saved theme or system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

```css
/* app/globals.css */
:root,
[data-theme="light"] {
  --background: #ffffff;
  --foreground: #212121;

  --primary: #4caf50;
  --primary-foreground: #ffffff;

  --secondary: #2196f3;
  --secondary-foreground: #ffffff;

  --muted: #f5f5f5;
  --muted-foreground: #757575;

  --border: #e0e0e0;
  --input: #e0e0e0;

  --card: #ffffff;
  --card-foreground: #212121;
}

[data-theme="dark"] {
  --background: #121212;
  --foreground: #f5f5f5;

  --primary: #81c784;
  --primary-foreground: #121212;

  --secondary: #64b5f6;
  --secondary-foreground: #121212;

  --muted: #1e1e1e;
  --muted-foreground: #bdbdbd;

  --border: #424242;
  --input: #424242;

  --card: #1e1e1e;
  --card-foreground: #f5f5f5;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
```

### Theme Toggle Component

```typescript
// components/ThemeToggle.tsx
'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-[var(--border)]
                 bg-[var(--card)] hover:bg-[var(--muted)]
                 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
```

### Tailwind Dark Mode

```typescript
// tailwind.config.ts
const config: Config = {
  darkMode: "class", // Use class-based dark mode
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
    },
  },
};
```

```typescript
// Using Tailwind dark mode
export function Card() {
  return (
    <div className="bg-white dark:bg-gray-800
                    text-gray-900 dark:text-gray-100
                    border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold">Card Title</h3>
      <p className="text-gray-600 dark:text-gray-400">Card content</p>
    </div>
  );
}
```

## 📱 Responsive Design

Implement mobile-first responsive designs with media queries and responsive utilities.

### CSS Media Queries

```css
/* Mobile first approach */
.container {
  padding: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }

  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

/* Large desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Tailwind Responsive Utilities

```typescript
// Responsive component with Tailwind
export function Dashboard() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card />
        <Card />
        <Card />
        <Card />
      </div>

      {/* Responsive flex direction */}
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <div className="flex-1">Sidebar</div>
        <div className="flex-2">Main content</div>
      </div>

      {/* Responsive text sizes */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
        Responsive Heading
      </h1>

      {/* Responsive visibility */}
      <div className="hidden lg:block">
        Only visible on large screens
      </div>

      <div className="lg:hidden">
        Only visible on small/medium screens
      </div>
    </div>
  );
}
```

### Container Queries

```css
/* Modern container queries for component-level responsiveness */
.card-container {
  container-type: inline-size;
  container-name: card;
}

.card {
  padding: 1rem;
}

@container card (min-width: 400px) {
  .card {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 1rem;
  }
}

@container card (min-width: 600px) {
  .card {
    padding: 2rem;
  }
}
```

### Responsive Typography

```css
/* Fluid typography with clamp() */
h1 {
  font-size: clamp(2rem, 5vw, 3rem);
}

h2 {
  font-size: clamp(1.5rem, 4vw, 2.25rem);
}

p {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.6;
}

/* Responsive line-height */
@media (max-width: 768px) {
  body {
    line-height: 1.5;
  }
}

@media (min-width: 769px) {
  body {
    line-height: 1.6;
  }
}
```

## 🌐 RTL Support

Support right-to-left languages like Arabic for Islamic content.

### RTL Configuration

```typescript
// app/[lang]/layout.tsx
import { Amiri } from 'next/font/google';

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic'],
  variable: '--font-amiri',
});

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const isRTL = params.lang === 'ar';

  return (
    <html
      lang={params.lang}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={amiri.variable}
    >
      <body>{children}</body>
    </html>
  );
}
```

### RTL-Aware Styles

```css
/* Logical properties for RTL support */
.button {
  margin-inline-start: 1rem; /* margin-left in LTR, margin-right in RTL */
  margin-inline-end: 0;
  padding-inline: 1rem; /* padding-left and padding-right */
  padding-block: 0.5rem; /* padding-top and padding-bottom */
}

.card {
  border-inline-start: 4px solid var(--primary);
  text-align: start; /* left in LTR, right in RTL */
}

/* RTL-specific overrides when needed */
[dir="rtl"] .icon {
  transform: scaleX(-1); /* Flip icons horizontally */
}

/* Tailwind RTL support */
.button {
  @apply ms-4; /* margin-start (logical property) */
  @apply ps-2 pe-4; /* padding-start, padding-end */
}
```

### Bidirectional Components

```typescript
// components/BilingualCard.tsx
interface BilingualCardProps {
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
  lang: 'en' | 'ar';
}

export function BilingualCard({
  titleEn,
  titleAr,
  contentEn,
  contentAr,
  lang
}: BilingualCardProps) {
  const isRTL = lang === 'ar';
  const title = isRTL ? titleAr : titleEn;
  const content = isRTL ? contentAr : contentEn;

  return (
    <div
      className={`card ${isRTL ? 'font-arabic' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p>{content}</p>
    </div>
  );
}
```

## ⚡ Performance

Optimize CSS for production performance.

### CSS Module Code Splitting

CSS Modules are automatically code-split per component, loading only necessary styles.

```typescript
// Each component loads its own CSS
import styles from "./ZakatCalculator.module.css"; // Only loaded with component
import cardStyles from "./Card.module.css"; // Separate bundle
```

### Critical CSS Inlining

```typescript
// next.config.ts
const config: NextConfig = {
  experimental: {
    optimizeCss: true, // Experimental: inline critical CSS
  },
};
```

### Purging Unused CSS

```typescript
// tailwind.config.ts
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Tailwind automatically purges unused styles in production
};
```

### CSS Optimization

```typescript
// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  // PostCSS automatically runs with optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default config;
```

### Bundle Analysis

```bash
npm install -D @next/bundle-analyzer
```

```typescript
// next.config.ts
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const config: NextConfig = {
  // Your config
};

export default bundleAnalyzer(config);
```

```bash
# Analyze bundle
ANALYZE=true npm run build
```

## 🕌 OSE Platform Examples

Real-world styling examples for Islamic finance features.

### Zakat Calculator with Islamic Design

```typescript
// components/ZakatCalculator.tsx
import styles from './ZakatCalculator.module.css';

export function ZakatCalculator() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.islamicPattern} />
        <h2 className={styles.title}>
          <span className={styles.arabic}>حاسبة الزكاة</span>
          <span className={styles.english}>Zakat Calculator</span>
        </h2>
      </div>

      <form className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Total Wealth</label>
          <div className={styles.inputWrapper}>
            <span className={styles.currency}>$</span>
            <input
              type="number"
              className={styles.input}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className={styles.resultCard}>
          <p className={styles.resultLabel}>Zakat Due</p>
          <p className={styles.resultAmount}>$250.00</p>
          <p className={styles.resultNote}>2.5% of eligible wealth</p>
        </div>

        <button type="submit" className={styles.button}>
          Calculate Zakat
        </button>
      </form>
    </div>
  );
}
```

```css
/* components/ZakatCalculator.module.css */
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  position: relative;
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  border-radius: 1rem;
  color: white;
  overflow: hidden;
}

.islamicPattern {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.1) 10px,
      rgba(255, 255, 255, 0.1) 20px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.1) 10px,
      rgba(255, 255, 255, 0.1) 20px
    );
  opacity: 0.3;
}

.title {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.arabic {
  font-family: var(--font-amiri), serif;
  font-size: 2rem;
  font-weight: 700;
}

.english {
  font-size: 1.5rem;
  font-weight: 600;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-weight: 600;
  color: var(--text-primary);
}

.inputWrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency {
  position: absolute;
  left: 1rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #4caf50;
}

.resultCard {
  padding: 1.5rem;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 0.75rem;
  text-align: center;
}

.resultLabel {
  font-size: 0.875rem;
  color: #388e3c;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.resultAmount {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 0.25rem;
}

.resultNote {
  font-size: 0.875rem;
  color: #558b2f;
}

.button {
  padding: 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.button:hover {
  background-color: #388e3c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}
```

### Murabaha Application Card

```typescript
// components/MurabahaCard.tsx
'use client';

import styles from './MurabahaCard.module.css';

interface MurabahaCardProps {
  productName: string;
  purchasePrice: number;
  profitRate: number;
  installmentPeriod: number;
}

export function MurabahaCard({
  productName,
  purchasePrice,
  profitRate,
  installmentPeriod,
}: MurabahaCardProps) {
  const totalProfit = purchasePrice * (profitRate / 100);
  const totalAmount = purchasePrice + totalProfit;
  const monthlyPayment = totalAmount / installmentPeriod;

  return (
    <div className={styles.card}>
      <div className={styles.badge}>Murabaha Financing</div>

      <h3 className={styles.productName}>{productName}</h3>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Purchase Price</span>
          <span className={styles.detailValue}>
            ${purchasePrice.toLocaleString()}
          </span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Profit Rate</span>
          <span className={styles.detailValue}>{profitRate}%</span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Period</span>
          <span className={styles.detailValue}>{installmentPeriod} months</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Total Amount</span>
          <span className={`${styles.detailValue} ${styles.highlight}`}>
            ${totalAmount.toLocaleString()}
          </span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Monthly Payment</span>
          <span className={`${styles.detailValue} ${styles.highlight}`}>
            ${monthlyPayment.toLocaleString()}
          </span>
        </div>
      </div>

      <button className={styles.applyButton}>
        Apply for Financing
      </button>
    </div>
  );
}
```

```css
/* components/MurabahaCard.module.css */
.card {
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
}

.productName {
  font-size: 1.5rem;
  font-weight: 700;
  color: #212121;
  margin-bottom: 1.5rem;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.detailRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detailLabel {
  color: #757575;
  font-size: 0.875rem;
}

.detailValue {
  color: #212121;
  font-weight: 600;
}

.detailValue.highlight {
  color: #2196f3;
  font-size: 1.125rem;
  font-weight: 700;
}

.divider {
  height: 1px;
  background: #e0e0e0;
  margin: 0.5rem 0;
}

.applyButton {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.applyButton:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.applyButton:active {
  transform: scale(0.98);
}
```

## 📚 Best Practices

### 1. Choose the Right Styling Solution

```typescript
// CSS Modules for component-scoped styles (recommended default)
import styles from './Component.module.css';

// Tailwind for utility-first rapid development
<div className="p-4 bg-white rounded-lg shadow-md" />

// CSS-in-JS for dynamic theming and runtime styles
const Button = styled.button`
  background: ${props => props.variant === 'primary' ? '#4caf50' : '#2196f3'};
`;
```

### 2. Use CSS Variables for Theming

```css
:root {
  --primary: #4caf50;
  --spacing-md: 1rem;
}

.button {
  background-color: var(--primary);
  padding: var(--spacing-md);
}
```

### 3. Optimize Font Loading

```typescript
// Preload critical fonts
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// Use variable fonts when possible
const interVariable = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
```

### 4. Mobile-First Responsive Design

```css
/* Start with mobile styles */
.container {
  padding: 1rem;
}

/* Add desktop styles */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

### 5. Accessibility in Styling

```css
/* Sufficient color contrast */
.text {
  color: #212121; /* WCAG AA compliant */
  background: #ffffff;
}

/* Focus indicators */
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6. Performance Optimization

```typescript
// Code-split CSS with dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});

// Use CSS Modules for automatic code splitting
import styles from './Component.module.css'; // Only loaded with component
```

### 7. Consistent Naming Conventions

```css
/* BEM naming for CSS Modules */
.card {
}
.card__header {
}
.card__title {
}
.card--highlighted {
}

/* Or simple semantic naming */
.container {
}
.title {
}
.content {
}
.button {
}
```

## 🔗 Related Documentation

- [Next.js README](./README.md) - Next.js overview and getting started
- [Next.js Configuration](configuration.md) - next.config.ts and environment setup
- [Next.js Performance](performance.md) - Optimization strategies
- [Next.js Accessibility](accessibility.md) - WCAG compliance
- [TypeScript Guide](typescript.md) - TypeScript integration
- [React Styling](../fe-react/styling.md) - React styling patterns

---

**Next Steps:**

- Explore [Next.js TypeScript](typescript.md) for type-safe styling
- Review [Next.js Accessibility](accessibility.md) for WCAG AA compliance
- Check [Next.js Performance](performance.md) for CSS optimization
- Read [Next.js Configuration](configuration.md) for build setup

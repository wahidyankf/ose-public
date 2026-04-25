---
title: "React Styling"
description: Styling approaches and patterns for React applications
category: explanation
subcategory: platform-web
tags:
  - react
  - styling
  - css
  - tailwind
  - css-modules
related:
  - ./best-practices.md
principles:
  - explicit-over-implicit
---

# React Styling

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [TypeScript React](./README.md) > Styling

**Related Guides**:

- [Best Practices](best-practices.md) - Styling standards
- [Accessibility](accessibility.md) - Accessible styling

## Overview

React supports multiple styling approaches. This guide covers CSS Modules, Tailwind CSS, CSS-in-JS, theming, and responsive design patterns.

**Target Audience**: Developers building styled React applications, particularly Islamic finance platforms requiring consistent design systems and responsive layouts.

**React Version**: React 19.0 with TypeScript 5+

## CSS Modules

### Basic Usage

```typescript
// DonationCard.module.css
.card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.card_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card_title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.card_amount {
  font-size: 24px;
  font-weight: 700;
  color: #2e7d32;
}

// DonationCard.tsx
import styles from './DonationCard.module.css';

export const DonationCard: React.FC<{ donation: Donation }> = ({ donation }) => (
  <div className={styles.card}>
    <div className={styles.card_header}>
      <h3 className={styles.card_title}>{donation.campaignName}</h3>
      <span className={styles.card_amount}>{donation.amount}</span>
    </div>
  </div>
);
```

### Conditional Classes

```typescript
import styles from './Button.module.css';
import clsx from 'clsx';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  disabled,
  children,
}) => (
  <button
    className={clsx(
      styles.button,
      styles[`button_${variant}`],
      styles[`button_${size}`],
      disabled && styles.button_disabled
    )}
    disabled={disabled}
  >
    {children}
  </button>
);
```

## Tailwind CSS

### Basic Tailwind

```typescript
export const DonationCard: React.FC<{ donation: Donation }> = ({ donation }) => (
  <div className="border border-gray-200 rounded-lg p-4 mb-3">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-semibold text-gray-900">
        {donation.campaignName}
      </h3>
      <span className="text-2xl font-bold text-green-700">
        {donation.amount}
      </span>
    </div>
    <p className="text-sm text-gray-600">{donation.donor.name}</p>
  </div>
);
```

### Conditional Classes with clsx

```typescript
import clsx from 'clsx';

interface BadgeProps {
  status: 'pending' | 'completed' | 'failed';
  children: React.ReactNode;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, children }) => (
  <span
    className={clsx(
      'px-3 py-1 rounded-full text-sm font-medium',
      {
        'bg-yellow-100 text-yellow-800': status === 'pending',
        'bg-green-100 text-green-800': status === 'completed',
        'bg-red-100 text-red-800': status === 'failed',
      }
    )}
  >
    {children}
  </span>
);
```

## Theming

### CSS Variables

```typescript
// App.css
:root {
  --color-primary: #1976d2;
  --color-secondary: #388e3c;
  --color-error: #d32f2f;
  --color-background: #ffffff;
  --color-text: #333333;
  --spacing-unit: 8px;
}

[data-theme='dark'] {
  --color-primary: #42a5f5;
  --color-background: #1e1e1e;
  --color-text: #ffffff;
}

// Component
.button {
  background-color: var(--color-primary);
  color: var(--color-text);
  padding: calc(var(--spacing-unit) * 2);
}

// React component
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
};
```

### Custom Hooks for Tailwind

```typescript
// useResponsive hook
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 640,
    isTablet: windowSize.width >= 640 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    windowSize,
  };
}

// Usage
export const ResponsiveComponent: React.FC = () => {
  const { isMobile, isDesktop } = useResponsive();

  return (
    <div className={clsx('container mx-auto', {
      'px-4': isMobile,
      'px-8': isDesktop,
    })}>
      {isMobile ? <MobileNav /> : <DesktopNav />}
    </div>
  );
};
```

## CSS-in-JS with Styled Components

### Basic Styled Components

```typescript
import styled from 'styled-components';

// Styled button
const StyledButton = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${(props) =>
    props.variant === 'primary'
      ? `
    background-color: #1976d2;
    color: white;
    &:hover {
      background-color: #1565c0;
    }
  `
      : `
    background-color: transparent;
    color: #1976d2;
    border: 2px solid #1976d2;
    &:hover {
      background-color: #f5f5f5;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Card component
const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

// Usage
export const DonationCard: React.FC<{ donation: Donation }> = ({ donation }) => (
  <Card>
    <CardHeader>
      <CardTitle>{donation.projectName}</CardTitle>
      <StyledButton variant="primary">Donate</StyledButton>
    </CardHeader>
    <p>{donation.description}</p>
  </Card>
);
```

### Theme Integration

```typescript
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';

// Theme definition
const theme = {
  colors: {
    primary: '#1976d2',
    secondary: '#388e3c',
    error: '#d32f2f',
    background: '#ffffff',
    text: '#333333',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },
};

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    color: ${(props) => props.theme.colors.text};
    background-color: ${(props) => props.theme.colors.background};
  }
`;

// Themed component
const ThemedButton = styled.button`
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  padding: ${(props) => props.theme.spacing.md};
  border-radius: 8px;
  border: none;
  cursor: pointer;

  @media (max-width: ${(props) => props.theme.breakpoints.mobile}) {
    padding: ${(props) => props.theme.spacing.sm};
  }
`;

// App with theme
export const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    <div>
      <ThemedButton>Themed Button</ThemedButton>
    </div>
  </ThemeProvider>
);
```

## Responsive Design

### Mobile-First Approach

```typescript
// Responsive container
const ResponsiveContainer = styled.div`
  width: 100%;
  padding: 16px;

  @media (min-width: 640px) {
    padding: 24px;
  }

  @media (min-width: 1024px) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px;
  }
`;

// Responsive grid
const Grid = styled.div<{ columns?: number }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(${(props) => props.columns || 3}, 1fr);
  }
`;

// Usage
export const DonationGrid: React.FC<{ donations: Donation[] }> = ({ donations }) => (
  <ResponsiveContainer>
    <Grid columns={3}>
      {donations.map((donation) => (
        <DonationCard key={donation.id} donation={donation} />
      ))}
    </Grid>
  </ResponsiveContainer>
);
```

### Responsive Typography

```typescript
const ResponsiveHeading = styled.h1`
  font-size: 24px;
  line-height: 1.2;
  margin-bottom: 16px;

  @media (min-width: 640px) {
    font-size: 32px;
    margin-bottom: 20px;
  }

  @media (min-width: 1024px) {
    font-size: 48px;
    margin-bottom: 24px;
  }
`;

const ResponsiveText = styled.p`
  font-size: 14px;
  line-height: 1.6;

  @media (min-width: 640px) {
    font-size: 16px;
  }

  @media (min-width: 1024px) {
    font-size: 18px;
    line-height: 1.8;
  }
`;
```

### Container Queries (Modern Approach)

```css
/* Container query support */
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: flex;
    flex-direction: row;
  }
}

@container card (min-width: 700px) {
  .card {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Animations & Transitions

### CSS Transitions

```typescript
const AnimatedButton = styled.button`
  background-color: #1976d2;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transform: scale(1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: #1565c0;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Loading spinner
const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
```

### Framer Motion Integration

```typescript
import { motion, AnimatePresence } from 'framer-motion';

// Fade in animation
export const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// Slide in animation
export const SlideIn: React.FC<{
  direction?: 'left' | 'right' | 'up' | 'down';
  children: React.ReactNode;
}> = ({ direction = 'up', children }) => {
  const variants = {
    hidden: {
      x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
      y: direction === 'up' ? 100 : direction === 'down' ? -100 : 0,
      opacity: 0,
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {children}
    </motion.div>
  );
};

// Modal with animation
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
```

### Skeleton Loading

```typescript
const SkeletonBox = styled.div<{ width?: string; height?: string }>`
  width: ${(props) => props.width || '100%'};
  height: ${(props) => props.height || '20px'};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

export const DonationCardSkeleton: React.FC = () => (
  <div className="p-4 border rounded-lg">
    <SkeletonBox height="24px" width="60%" />
    <div className="mt-3">
      <SkeletonBox height="16px" />
    </div>
    <div className="mt-2">
      <SkeletonBox height="16px" width="80%" />
    </div>
    <div className="mt-4 flex gap-2">
      <SkeletonBox height="40px" width="100px" />
      <SkeletonBox height="40px" width="100px" />
    </div>
  </div>
);
```

## Layout Patterns

### Flexbox Layouts

```typescript
// Flex container
const FlexContainer = styled.div<{
  direction?: 'row' | 'column';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: string;
}>`
  display: flex;
  flex-direction: ${(props) => props.direction || 'row'};
  justify-content: ${(props) => {
    const map = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      between: 'space-between',
      around: 'space-around',
    };
    return map[props.justify || 'start'];
  }};
  align-items: ${(props) => {
    const map = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    return map[props.align || 'stretch'];
  }};
  gap: ${(props) => props.gap || '0'};
`;

// Split layout
const SplitLayout = styled.div`
  display: flex;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.aside`
  flex: 0 0 300px;

  @media (max-width: 768px) {
    flex: 1 1 auto;
  }
`;

const MainContent = styled.main`
  flex: 1 1 auto;
`;

// Usage
export const DashboardLayout: React.FC = () => (
  <SplitLayout>
    <Sidebar>
      <nav>{/* Navigation */}</nav>
    </Sidebar>
    <MainContent>
      {/* Main content */}
    </MainContent>
  </SplitLayout>
);
```

### Grid Layouts

```typescript
// CSS Grid
const GridLayout = styled.div<{ columns?: number; minColumnWidth?: string }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.columns
      ? `repeat(${props.columns}, 1fr)`
      : `repeat(auto-fit, minmax(${props.minColumnWidth || '250px'}, 1fr))`};
  gap: 24px;
`;

// Dashboard grid
const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GridItem = styled.div<{ span?: number }>`
  grid-column: span ${(props) => props.span || 1};

  @media (max-width: 768px) {
    grid-column: span 1;
  }
`;

// Usage
export const Dashboard: React.FC = () => (
  <DashboardGrid>
    <GridItem span={8}>
      <DonationsChart />
    </GridItem>
    <GridItem span={4}>
      <RecentActivity />
    </GridItem>
    <GridItem span={6}>
      <TopProjects />
    </GridItem>
    <GridItem span={6}>
      <TopDonors />
    </GridItem>
  </DashboardGrid>
);
```

## Form Styling

### Styled Form Components

```typescript
const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid ${(props) => (props.hasError ? '#d32f2f' : '#e0e0e0')};
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.hasError ? '#d32f2f' : '#1976d2')};
    box-shadow: 0 0 0 3px
      ${(props) => (props.hasError ? 'rgba(211, 47, 47, 0.1)' : 'rgba(25, 118, 210, 0.1)')};
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  display: block;
  color: #d32f2f;
  font-size: 14px;
  margin-top: 8px;
`;

const HelperText = styled.span`
  display: block;
  color: #666;
  font-size: 14px;
  margin-top: 8px;
`;

// Usage
export const DonationForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  return (
    <form>
      <FormGroup>
        <Label htmlFor="amount">Donation Amount</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          hasError={!!error}
          placeholder="Enter amount"
        />
        {error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <HelperText>Minimum donation: $10</HelperText>
        )}
      </FormGroup>
    </form>
  );
};
```

### Select & Dropdown Styling

```typescript
const Select = styled.select<{ hasError?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid ${(props) => (props.hasError ? '#d32f2f' : '#e0e0e0')};
  border-radius: 8px;
  font-size: 16px;
  background-color: white;
  cursor: pointer;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.hasError ? '#d32f2f' : '#1976d2')};
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }
`;

// Custom dropdown with React
export const CustomSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-4 py-3 border-2 border-gray-300 rounded-lg"
      >
        {options.find((opt) => opt.value === value)?.label || 'Select...'}
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-100"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

## OSE Platform Styling Examples

### Zakat Calculator Styling

```typescript
const ZakatCalculatorContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
`;

const CalculatorHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #666;
`;

const ResultCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-top: 24px;
`;

const ResultAmount = styled.div`
  font-size: 48px;
  font-weight: 700;
  text-align: center;
  margin: 16px 0;
`;

const ResultLabel = styled.div`
  text-align: center;
  font-size: 18px;
  opacity: 0.9;
`;

// Usage
export const StyledZakatCalculator: React.FC = () => (
  <ZakatCalculatorContainer>
    <CalculatorHeader>
      <Title>Zakat Calculator</Title>
      <Subtitle>Calculate your zakat obligation</Subtitle>
    </CalculatorHeader>

    <FormGroup>
      <Label>Total Wealth</Label>
      <Input type="number" placeholder="Enter your total wealth" />
    </FormGroup>

    <FormGroup>
      <Label>Currency</Label>
      <Select>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
      </Select>
    </FormGroup>

    <StyledButton variant="primary" style={{ width: '100%' }}>
      Calculate Zakat
    </StyledButton>

    <ResultCard>
      <ResultLabel>Your Zakat Amount</ResultLabel>
      <ResultAmount>$250.00</ResultAmount>
      <ResultLabel>Zakat is due on your wealth</ResultLabel>
    </ResultCard>
  </ZakatCalculatorContainer>
);
```

### Murabaha Contract Card Styling

```typescript
const ContractCard = styled.div`
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #1976d2;
    box-shadow: 0 8px 24px rgba(25, 118, 210, 0.15);
  }
`;

const ContractStatus = styled.span<{ status: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;

  ${(props) => {
    switch (props.status) {
      case 'active':
        return `
          background-color: #e8f5e9;
          color: #2e7d32;
        `;
      case 'pending':
        return `
          background-color: #fff3e0;
          color: #f57c00;
        `;
      case 'completed':
        return `
          background-color: #e3f2fd;
          color: #1976d2;
        `;
      default:
        return `
          background-color: #f5f5f5;
          color: #666;
        `;
    }
  }}
`;

const ContractAmount = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #1976d2;
  margin: 16px 0;
`;

const ContractDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
`;

const DetailItem = styled.div`
  .label {
    font-size: 14px;
    color: #666;
    margin-bottom: 4px;
  }

  .value {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
`;

// Usage
export const MurabahaContractCard: React.FC<{ contract: Contract }> = ({ contract }) => (
  <ContractCard>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-xl font-semibold">Contract #{contract.id}</h3>
        <ContractStatus status={contract.status}>{contract.status}</ContractStatus>
      </div>
    </div>

    <ContractAmount>${contract.totalAmount.toLocaleString()}</ContractAmount>

    <ContractDetails>
      <DetailItem>
        <div className="label">Monthly Payment</div>
        <div className="value">${contract.monthlyPayment.toLocaleString()}</div>
      </DetailItem>
      <DetailItem>
        <div className="label">Remaining</div>
        <div className="value">{contract.remainingMonths} months</div>
      </DetailItem>
      <DetailItem>
        <div className="label">Interest Rate</div>
        <div className="value">{contract.markupRate}%</div>
      </DetailItem>
      <DetailItem>
        <div className="label">Next Payment</div>
        <div className="value">{contract.nextPaymentDate}</div>
      </DetailItem>
    </ContractDetails>
  </ContractCard>
);
```

### Waqf Project Card Styling

```typescript
const ProjectCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`;

const ProjectImage = styled.div<{ src: string }>`
  height: 200px;
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-position: center;
  position: relative;
`;

const ProjectBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  color: #2e7d32;
`;

const ProjectContent = styled.div`
  padding: 24px;
`;

const ProjectTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin: 16px 0;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${(props) => props.percentage}%;
  background: linear-gradient(90deg, #4caf50 0%, #2e7d32 100%);
  transition: width 0.5s ease;
`;

const ProjectStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
`;

const Stat = styled.div`
  .label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }

  .value {
    font-size: 18px;
    font-weight: 700;
    color: #333;
  }
`;

// Usage
export const WaqfProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const percentage = (project.currentAmount / project.targetAmount) * 100;

  return (
    <ProjectCard>
      <ProjectImage src={project.imageUrl}>
        <ProjectBadge>{Math.round(percentage)}% Funded</ProjectBadge>
      </ProjectImage>

      <ProjectContent>
        <ProjectTitle>{project.name}</ProjectTitle>
        <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>

        <ProgressBar>
          <ProgressFill percentage={percentage} />
        </ProgressBar>

        <ProjectStats>
          <Stat>
            <div className="label">Raised</div>
            <div className="value">${project.currentAmount.toLocaleString()}</div>
          </Stat>
          <Stat>
            <div className="label">Goal</div>
            <div className="value">${project.targetAmount.toLocaleString()}</div>
          </Stat>
          <Stat>
            <div className="label">Donors</div>
            <div className="value">{project.donorCount}</div>
          </Stat>
        </ProjectStats>

        <StyledButton variant="primary" style={{ width: '100%', marginTop: '16px' }}>
          Donate Now
        </StyledButton>
      </ProjectContent>
    </ProjectCard>
  );
};
```

## Dark Mode Implementation

### Dark Mode with CSS Variables

```typescript
// theme.ts
export const lightTheme = {
  background: '#ffffff',
  backgroundSecondary: '#f5f5f5',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#1976d2',
  border: '#e0e0e0',
  cardBackground: '#ffffff',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const darkTheme = {
  background: '#1e1e1e',
  backgroundSecondary: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  primary: '#42a5f5',
  border: '#404040',
  cardBackground: '#2d2d2d',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

// ThemeProvider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    // Apply theme
    const theme = isDark ? darkTheme : lightTheme;

    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Themed component
const ThemedCard = styled.div`
  background-color: var(--color-cardBackground);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--color-shadow);
`;
```

## Performance Optimization

### CSS Loading Strategies

```typescript
// Critical CSS inline in HTML
// Non-critical CSS loaded async

// Lazy load CSS for route
export const LazyDashboard = React.lazy(() => import(/* webpackChunkName: "dashboard" */ "./Dashboard"));

// Code splitting for large CSS libraries
export const LazyChartComponent = React.lazy(() => import(/* webpackChunkName: "charts" */ "./ChartComponent"));
```

### CSS Optimization

```typescript
// Use CSS containment
const OptimizedCard = styled.div`
  contain: layout style paint;
  will-change: transform;
`;

// Avoid expensive properties
// ❌ Bad
const ExpensiveComponent = styled.div`
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.3);
  filter: blur(10px) brightness(1.2);
`;

// ✅ Good
const OptimizedComponent = styled.div`
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateZ(0); // Hardware acceleration
`;
```

## Styling Best Practices Checklist

### Design System

- [ ] Define consistent color palette
- [ ] Establish typography scale
- [ ] Create spacing system
- [ ] Define breakpoints
- [ ] Build component library
- [ ] Document all styles

### Performance

- [ ] Use CSS modules for scoping
- [ ] Implement code splitting
- [ ] Lazy load non-critical CSS
- [ ] Use CSS containment
- [ ] Optimize animations (use transform/opacity)
- [ ] Minimize CSS bundle size

### Responsive Design

- [ ] Mobile-first approach
- [ ] Test on multiple devices
- [ ] Use relative units (rem, em, %)
- [ ] Implement responsive images
- [ ] Test touch interactions
- [ ] Ensure readable text sizes

### Accessibility

- [ ] Maintain WCAG AA contrast ratios
- [ ] Use semantic HTML
- [ ] Support keyboard navigation
- [ ] Provide focus indicators
- [ ] Test with screen readers
- [ ] Support reduced motion

### Maintainability

- [ ] Follow naming conventions
- [ ] Use CSS variables for themes
- [ ] Document component variants
- [ ] Keep specificity low
- [ ] Avoid !important
- [ ] Use linters (Stylelint)

## Related Documentation

- **[Best Practices](best-practices.md)** - Styling standards
- **[Accessibility](accessibility.md)** - Accessible styling
- **[Component Architecture](component-architecture.md)** - Component design
- **[Performance](performance.md)** - Performance optimization

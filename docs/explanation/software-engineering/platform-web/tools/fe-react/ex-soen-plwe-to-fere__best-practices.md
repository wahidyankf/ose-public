---
title: "React Best Practices"
description: Production-ready React development standards for building maintainable, performant applications
category: explanation
subcategory: platform-web
tags:
  - react
  - best-practices
  - standards
  - typescript
  - production
related:
  - ./ex-soen-plwe-fere__idioms.md
  - ./ex-soen-plwe-fere__anti-patterns.md
  - ./ex-soen-plwe-fere__typescript.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
  - automation-over-manual
updated: 2026-01-25
---

# React Best Practices

## Quick Reference

### Core Standards

**Project Organization**:

- [Project Structure](#project-structure) - Feature-based organization
- [Naming Conventions](#naming-conventions) - Consistent naming
- [File Organization](#file-organization) - Module boundaries

**Component Design**:

- [Component Principles](#component-design-principles) - SRP, composition
- [Props Design](#props-design) - Clear interfaces
- [State Management](#state-management-best-practices) - State strategies

**Code Quality**:

- [TypeScript Usage](#typescript-integration) - Type safety
- [Error Handling](#error-handling) - Robust error management
- [Performance](#performance-best-practices) - Optimization strategies
- [Accessibility](#accessibility-standards) - WCAG compliance
- [Testing](#testing-strategies) - Comprehensive testing

### Related Documentation

- [Idioms](ex-soen-plwe-to-fere__idioms.md)
- [Anti-Patterns](ex-soen-plwe-to-fere__anti-patterns.md)
- [Component Architecture](ex-soen-plwe-to-fere__component-architecture.md)
- [TypeScript](ex-soen-plwe-to-fere__typescript.md)
- [Performance](ex-soen-plwe-to-fere__performance.md)

## Overview

React best practices provide proven approaches for building production-ready applications. These standards ensure code maintainability, performance, accessibility, and type safety across the open-sharia-enterprise platform.

This guide focuses on **React 19+ best practices** with TypeScript 5+, covering project organization, component design, state management, and production deployment strategies.

### Why Best Practices Matter

- **Maintainability**: Consistent patterns make code easier to understand and modify
- **Scalability**: Proper architecture supports growth without technical debt
- **Performance**: Optimized rendering and bundle size
- **Accessibility**: Inclusive user experience for all users
- **Type Safety**: Catch errors at compile time, not runtime
- **Team Collaboration**: Shared standards improve team productivity

## Project Structure

### Feature-Based Organization

Organize code by feature/domain, not by technical layer.

**Recommended Structure**:

```
apps/oseplatform-web-app/
├── src/
│   ├── features/              # Feature modules (domains)
│   │   ├── zakat/
│   │   │   ├── components/   # Feature-specific components
│   │   │   │   ├── ZakatCalculator.tsx
│   │   │   │   ├── ZakatResult.tsx
│   │   │   │   └── ZakatHistory.tsx
│   │   │   ├── hooks/        # Feature-specific hooks
│   │   │   │   ├── useZakatCalculation.ts
│   │   │   │   └── useZakatHistory.ts
│   │   │   ├── api/          # API integration
│   │   │   │   └── zakatApi.ts
│   │   │   ├── types/        # TypeScript types
│   │   │   │   └── zakat.types.ts
│   │   │   ├── utils/        # Feature utilities
│   │   │   │   └── zakatRules.ts
│   │   │   └── index.ts      # Public exports
│   │   ├── donations/
│   │   └── loans/
│   ├── shared/                # Shared across features
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Button.css
│   │   │   │   └── index.ts
│   │   │   ├── Card/
│   │   │   ├── Form/
│   │   │   └── Layout/
│   │   ├── hooks/            # Reusable hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useFetch.ts
│   │   │   └── useLocalStorage.ts
│   │   ├── utils/            # Utility functions
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── dates.ts
│   │   └── types/            # Shared types
│   │       └── common.types.ts
│   ├── core/                  # Core application
│   │   ├── api/              # API client setup
│   │   │   ├── client.ts
│   │   │   └── interceptors.ts
│   │   ├── auth/             # Authentication
│   │   │   ├── AuthProvider.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── routing/          # Routing configuration
│   │   │   ├── routes.tsx
│   │   │   └── router.tsx
│   │   └── store/            # Global state (if needed)
│   │       └── store.ts
│   ├── assets/                # Static assets
│   │   ├── images/
│   │   └── fonts/
│   ├── styles/                # Global styles
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── reset.css
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   └── vite-env.d.ts          # Vite type definitions
├── public/                     # Public assets
│   ├── favicon.ico
│   └── robots.txt
├── tests/                      # Test utilities
│   ├── setup.ts
│   └── mocks/
├── .env.example               # Environment template
├── .eslintrc.cjs              # ESLint config
├── .prettierrc                # Prettier config
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
└── package.json               # Dependencies
```

**Benefits**:

- **Cohesion**: Related code stays together
- **Scalability**: Easy to add/remove features
- **Clear boundaries**: Feature isolation
- **Reusability**: Shared code clearly separated

### Naming Conventions

**Files**:

- Components: `PascalCase.tsx` (e.g., `ZakatCalculator.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useZakatCalculation.ts`)
- Utils/Types: `camelCase.ts` (e.g., `zakatRules.ts`, `zakat.types.ts`)
- Test files: `*.test.tsx` or `*.spec.tsx`
- Styles: Match component name (e.g., `Button.css`, `Button.module.css`)

**Components**:

```typescript
// Component names match file names
export const ZakatCalculator: React.FC = () => {
  /* ... */
};

// Props interfaces: ComponentName + Props
interface ZakatCalculatorProps {
  initialWealth?: number;
}

// State interfaces: ComponentName + State
interface ZakatCalculatorState {
  wealth: number;
  nisab: number;
}
```

**Constants**:

```typescript
// Constants: UPPER_SNAKE_CASE
const ZAKAT_RATE = 0.025;
const NISAB_GOLD_GRAMS = 85;

// Configuration objects: camelCase
const zakatConfig = {
  rate: 0.025,
  nisabGoldGrams: 85,
} as const;
```

### File Organization

**Single Responsibility**:

- One component per file
- Export from index.ts for clean imports
- Co-locate related files (component, styles, tests)

**Example**:

```
Button/
├── Button.tsx         # Component implementation
├── Button.test.tsx    # Component tests
├── Button.css         # Component styles
└── index.ts           # Public exports
```

```typescript
// Button/index.ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

// Usage elsewhere
import { Button } from "@shared/components/Button";
```

## Component Design Principles

### Single Responsibility Principle

Each component should have one clear purpose.

**Good - Single Responsibility**:

```typescript
// Separate concerns into focused components

// Data fetching component
const ZakatCalculationList: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: calculations, loading } = useFetch<ZakatCalculation[]>(
    `/api/users/${userId}/zakat-calculations`
  );

  if (loading) return <LoadingSpinner />;

  return <ZakatCalculationTable calculations={calculations || []} />;
};

// Pure presentation component
interface ZakatCalculationTableProps {
  calculations: ZakatCalculation[];
}

const ZakatCalculationTable: React.FC<ZakatCalculationTableProps> = ({ calculations }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Wealth</th>
          <th>Zakat Amount</th>
        </tr>
      </thead>
      <tbody>
        {calculations.map(calc => (
          <tr key={calc.id}>
            <td>{new Date(calc.calculationDate).toLocaleDateString()}</td>
            <td>{calc.wealth.amount} {calc.wealth.currency}</td>
            <td>{calc.zakatAmount.amount} {calc.zakatAmount.currency}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

**Bad - Multiple Responsibilities**:

```typescript
// ❌ Component doing too much
const ZakatDashboard: React.FC = () => {
  const [calculations, setCalculations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetches multiple resources
  // Manages complex state
  // Renders multiple views
  // Handles authentication
  // ... Too many responsibilities!
};
```

### Composition Over Inheritance

Build complex UIs through composition.

**Good - Composition**:

```typescript
// Small, composable components
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="card">{children}</div>
);

const CardHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="card-header">
    <h3>{title}</h3>
  </div>
);

const CardBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="card-body">{children}</div>
);

// Compose into complex component
const ZakatSummaryCard: React.FC<{ calculation: ZakatCalculation }> = ({ calculation }) => (
  <Card>
    <CardHeader title="Zakat Calculation Summary" />
    <CardBody>
      <p>Wealth: {calculation.wealth.amount}</p>
      <p>Zakat: {calculation.zakatAmount.amount}</p>
    </CardBody>
  </Card>
);
```

### Props Design

**Clear Interfaces**:

```typescript
// ✅ Good - explicit, typed props
interface DonationFormProps {
  onSubmit: (donation: DonationFormData) => Promise<void>;
  initialValues?: Partial<DonationFormData>;
  disabled?: boolean;
  loading?: boolean;
}

export const DonationForm: React.FC<DonationFormProps> = ({
  onSubmit,
  initialValues = {},
  disabled = false,
  loading = false,
}) => {
  // Implementation
};
```

**Required vs Optional**:

```typescript
// Required props (no ?)
interface UserAvatarProps {
  user: User;              // Required
  size: 'small' | 'large'; // Required
  alt?: string;            // Optional - has reasonable default
  className?: string;      // Optional - aesthetic only
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size,
  alt = user.name,
  className = '',
}) => {
  return (
    <img
      src={user.avatarUrl}
      alt={alt}
      className={`avatar avatar--${size} ${className}`}
    />
  );
};
```

**Callback Props**:

```typescript
// ✅ Good - specific callback types
interface DonationListProps {
  donations: Donation[];
  onView: (donationId: string) => void;
  onEdit: (donationId: string) => void;
  onDelete: (donationId: string) => Promise<void>;
}

// ❌ Bad - vague callback
interface BadProps {
  onAction: (action: string, data: any) => void; // Too generic
}
```

## State Management Best Practices

### Local vs Global State

**Prefer local state** when possible:

```typescript
// ✅ Good - local state for UI concerns
const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accordion-item">
      <button onClick={() => setIsOpen(!isOpen)}>{title}</button>
      {isOpen && <div>{children}</div>}
    </div>
  );
};
```

**Use global state** for cross-cutting concerns:

```typescript
// Authentication state (global)
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth state is global - needed throughout app
  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### State Colocation

Keep state as close as possible to where it's used.

**Good - Colocated State**:

```typescript
// Modal state lives with modal component
const DonationModal: React.FC<{ donation: Donation }> = ({ donation }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>View Details</button>
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <DonationDetails donation={donation} />
        </Modal>
      )}
    </>
  );
};
```

### Derived State

Compute derived values instead of storing them.

**Good - Computed Values**:

```typescript
export const ZakatCalculator: React.FC = () => {
  const [wealth, setWealth] = useState(0);
  const [nisab, setNisab] = useState(0);

  // ✅ Derived - computed during render
  const zakatAmount = wealth >= nisab ? wealth * 0.025 : 0;
  const isEligible = wealth >= nisab;

  return (
    <div>
      <input value={wealth} onChange={(e) => setWealth(Number(e.target.value))} />
      <input value={nisab} onChange={(e) => setNisab(Number(e.target.value))} />
      <p>Zakat Amount: {zakatAmount}</p>
      <p>Eligible: {isEligible ? 'Yes' : 'No'}</p>
    </div>
  );
};
```

**Bad - Redundant State**:

```typescript
// ❌ Bad - storing derived values in state
export const BadCalculator: React.FC = () => {
  const [wealth, setWealth] = useState(0);
  const [nisab, setNisab] = useState(0);
  const [zakatAmount, setZakatAmount] = useState(0); // Redundant!
  const [isEligible, setIsEligible] = useState(false); // Redundant!

  useEffect(() => {
    // Unnecessary effect for derived state
    const amount = wealth >= nisab ? wealth * 0.025 : 0;
    setZakatAmount(amount);
    setIsEligible(wealth >= nisab);
  }, [wealth, nisab]);
};
```

## TypeScript Integration

### Strict Type Safety

Enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true
  }
}
```

### Type Props Explicitly

```typescript
// ✅ Good - explicit interface
interface DonationCardProps {
  donation: Donation;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  className?: string;
}

export const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  onView,
  onEdit,
  className = '',
}) => {
  return (
    <div className={`donation-card ${className}`}>
      {/* Implementation */}
    </div>
  );
};
```

### Avoid `any`

```typescript
// ❌ Bad
const processData = (data: any) => {
  // Type safety lost
};

// ✅ Good - use unknown and type guards
const processData = (data: unknown) => {
  if (isDonation(data)) {
    // Type-safe
    console.log(data.amount);
  }
};

// Type guard
function isDonation(value: unknown): value is Donation {
  return typeof value === "object" && value !== null && "id" in value && "amount" in value && "category" in value;
}
```

### Generic Components

```typescript
// Reusable list component with type safety
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'No items',
}: ListProps<T>) {
  if (items.length === 0) {
    return <div>{emptyMessage}</div>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Type-safe usage
const DonationList: React.FC<{ donations: Donation[] }> = ({ donations }) => (
  <List
    items={donations}
    renderItem={(d) => <DonationCard donation={d} />}
    keyExtractor={(d) => d.id}
    emptyMessage="No donations yet"
  />
);
```

## Error Handling

### Error Boundaries

```typescript
// ErrorBoundary.tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-container">
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage
const App: React.FC = () => (
  <ErrorBoundary onError={(error) => logErrorToService(error)}>
    <ZakatCalculator />
  </ErrorBoundary>
);
```

### Async Error Handling

```typescript
export const useDonations = (userId: string) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchDonations = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.getDonations(userId);

        if (!cancelled) {
          setDonations(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to fetch"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDonations();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { donations, loading, error, refetch: () => {} };
};
```

## Performance Best Practices

### Memoization

Use React.memo for expensive pure components:

```typescript
// Expensive component
interface DonationItemProps {
  donation: Donation;
  onView: (id: string) => void;
}

export const DonationItem = React.memo<DonationItemProps>(
  ({ donation, onView }) => {
    console.log('Rendering DonationItem:', donation.id);

    return (
      <div className="donation-item">
        <h3>{donation.category}</h3>
        <p>{donation.amount}</p>
        <button onClick={() => onView(donation.id)}>View</button>
      </div>
    );
  },
  // Custom comparison (optional)
  (prevProps, nextProps) => prevProps.donation.id === nextProps.donation.id
);
```

### Code Splitting

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react';

const ZakatCalculator = lazy(() => import('@features/zakat/components/ZakatCalculator'));
const DonationList = lazy(() => import('@features/donations/components/DonationList'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/zakat" element={<ZakatCalculator />} />
        <Route path="/donations" element={<DonationList />} />
      </Routes>
    </Suspense>
  );
};
```

### List Optimization

```typescript
// Virtualize long lists
import { FixedSizeList } from 'react-window';

export const DonationList: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <DonationItem donation={donations[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={donations.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

## Accessibility Standards

### Semantic HTML

```typescript
// ✅ Good - semantic HTML
export const DonationForm: React.FC = () => {
  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Donation Information</legend>

        <label htmlFor="amount">Amount</label>
        <input id="amount" type="number" required />

        <label htmlFor="category">Category</label>
        <select id="category" required>
          <option value="">Select category</option>
          <option value="zakat">Zakat</option>
          <option value="sadaqah">Sadaqah</option>
        </select>

        <button type="submit">Submit Donation</button>
      </fieldset>
    </form>
  );
};
```

### ARIA Attributes

```typescript
// Modal with proper ARIA
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="modal-overlay"
      onClick={onClose}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-title">Modal Title</h2>
        <button onClick={onClose} aria-label="Close modal">
          ×
        </button>
        {children}
      </div>
    </div>
  );
};
```

### Keyboard Navigation

```typescript
export const Dropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Select Option
      </button>
      {isOpen && (
        <ul role="menu">
          <li role="menuitem" tabIndex={0}>Option 1</li>
          <li role="menuitem" tabIndex={0}>Option 2</li>
        </ul>
      )}
    </div>
  );
};
```

## Testing Strategies

### Component Testing

```typescript
// ZakatCalculator.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZakatCalculator } from './ZakatCalculator';

describe('ZakatCalculator', () => {
  it('calculates zakat correctly', async () => {
    const user = userEvent.setup();
    render(<ZakatCalculator />);

    const wealthInput = screen.getByLabelText(/wealth/i);
    const nisabInput = screen.getByLabelText(/nisab/i);

    await user.type(wealthInput, '10000');
    await user.type(nisabInput, '5000');
    await user.click(screen.getByRole('button', { name: /calculate/i }));

    await waitFor(() => {
      expect(screen.getByText(/zakat amount: 250/i)).toBeInTheDocument();
    });
  });

  it('shows error for invalid input', async () => {
    const user = userEvent.setup();
    render(<ZakatCalculator />);

    await user.type(screen.getByLabelText(/wealth/i), '-100');
    await user.click(screen.getByRole('button', { name: /calculate/i }));

    await waitFor(() => {
      expect(screen.getByText(/wealth must be positive/i)).toBeInTheDocument();
    });
  });
});
```

### Hook Testing

```typescript
// useZakatCalculation.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useZakatCalculation } from "./useZakatCalculation";

describe("useZakatCalculation", () => {
  it("calculates zakat successfully", async () => {
    const { result } = renderHook(() => useZakatCalculation());

    await result.current.calculate({ wealth: 10000, nisab: 5000 });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.result?.zakatAmount.amount).toBe(250);
    });
  });
});
```

## Security Best Practices

### XSS Prevention

```typescript
// ✅ Good - React escapes by default
export const UserGreeting: React.FC<{ name: string }> = ({ name }) => {
  return <h1>Welcome, {name}!</h1>; // Safe - React escapes
};

// ⚠️ Dangerous - only when absolutely necessary
export const RichTextDisplay: React.FC<{ html: string }> = ({ html }) => {
  // Sanitize HTML before using dangerouslySetInnerHTML
  const sanitizedHtml = DOMPurify.sanitize(html);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};
```

### Input Validation

```typescript
export const DonationForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Validate input
    if (!/^\d*\.?\d*$/.test(value)) {
      setError('Please enter a valid number');
      return;
    }

    if (Number(value) < 0) {
      setError('Amount must be positive');
      return;
    }

    setError('');
    setAmount(value);
  };

  return (
    <div>
      <input type="text" value={amount} onChange={handleChange} />
      {error && <span className="error">{error}</span>}
    </div>
  );
};
```

### Secure API Calls

```typescript
// API client with security headers
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

## Related Documentation

- **[React Idioms](ex-soen-plwe-to-fere__idioms.md)** - Framework patterns
- **[React Anti-Patterns](ex-soen-plwe-to-fere__anti-patterns.md)** - Common mistakes
- **[Component Architecture](ex-soen-plwe-to-fere__component-architecture.md)** - Component design
- **[TypeScript](ex-soen-plwe-to-fere__typescript.md)** - TypeScript integration
- **[Performance](ex-soen-plwe-to-fere__performance.md)** - Optimization strategies
- **[Testing](ex-soen-plwe-to-fere__testing.md)** - Testing strategies
- **[Accessibility](ex-soen-plwe-to-fere__accessibility.md)** - WCAG compliance
- **[Security](ex-soen-plwe-to-fere__security.md)** - Security best practices

---

**Last Updated**: 2026-01-25
**React Version**: 18.2+
**TypeScript Version**: 5+

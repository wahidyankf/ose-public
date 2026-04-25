---
title: "React Idioms"
description: React-specific patterns and idiomatic framework usage
category: explanation
subcategory: platform-web
tags:
  - react
  - idioms
  - patterns
  - hooks
  - components
  - typescript
related:
  - ./best-practices.md
  - ./anti-patterns.md
  - ./component-architecture.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
---

# React Idioms

## Quick Reference

### Core React Patterns

**Components**:

- [Functional Components](#1-functional-components-over-class-components) - Modern component pattern
- [Component Composition](#2-component-composition-over-inheritance) - Building complex UIs
- [Props Patterns](#3-props-patterns-and-destructuring) - Component interfaces

**Hooks**:

- [useState](#4-usestate-for-local-state) - Local component state
- [useEffect](#5-useeffect-for-side-effects) - Side effects and lifecycle
- [useContext](#6-usecontext-for-global-state) - Context consumption
- [useReducer](#7-usereducer-for-complex-state) - Complex state logic
- [useMemo/useCallback](#8-usememo-and-usecallback-for-performance) - Performance optimization
- [Custom Hooks](#9-custom-hooks-for-reusable-logic) - Reusable stateful logic

**Rendering**:

- [Conditional Rendering](#10-conditional-rendering-patterns) - Dynamic UI
- [List Rendering](#11-list-rendering-with-keys) - Rendering collections
- [Event Handling](#12-event-handling-patterns) - User interactions

**Forms**:

- [Controlled Components](#13-controlled-vs-uncontrolled-components) - Form inputs

### Related Documentation

- [Best Practices](best-practices.md)
- [Anti-Patterns](anti-patterns.md)
- [Component Architecture](component-architecture.md)
- [Hooks](hooks.md)
- [TypeScript](typescript.md)

## Overview

React idioms are established patterns that leverage the framework's features to build components with minimal boilerplate while maintaining clarity and type safety. These patterns align with React's philosophy of declarative UI and unidirectional data flow.

This guide focuses on **React 19+ idioms** with TypeScript 5+, incorporating examples from Islamic financial domains including Zakat calculation, Murabaha contracts, and donation management.

### Why React Idioms Matter

- **Productivity**: Idiomatic React reduces boilerplate and accelerates development
- **Maintainability**: Following framework conventions makes code easier to understand
- **Type Safety**: TypeScript integration catches errors at compile time
- **Performance**: Idiomatic patterns naturally lead to performant code
- **Composability**: React components are designed to be composed

### Target Audience

This document targets developers building React applications in the open-sharia-enterprise platform, particularly those working on financial services and domain-driven design implementations.

## Core React Idioms

### 1. Functional Components Over Class Components

**Pattern**: Use functional components with hooks instead of class components.

**Idiom**: Functional components with TypeScript interfaces.

**Modern React (Functional Component)**:

```typescript
interface ZakatCalculatorProps {
  initialWealth?: number;
  initialNisab?: number;
  onCalculate?: (result: ZakatCalculation) => void;
}

export const ZakatCalculator: React.FC<ZakatCalculatorProps> = ({
  initialWealth = 0,
  initialNisab = 0,
  onCalculate,
}) => {
  const [wealth, setWealth] = useState(initialWealth);
  const [nisab, setNisab] = useState(initialNisab);
  const [result, setResult] = useState<ZakatCalculation | null>(null);

  useEffect(() => {
    if (wealth > 0 && nisab > 0) {
      const calculation = calculateZakat(wealth, nisab);
      setResult(calculation);
      onCalculate?.(calculation);
    }
  }, [wealth, nisab, onCalculate]);

  return (
    <div className="zakat-calculator">
      <h2>Zakat Calculator</h2>
      {/* Component JSX */}
    </div>
  );
};
```

**Legacy React (Class Component - Avoid)**:

```typescript
// Old pattern - do not use
class ZakatCalculator extends React.Component<ZakatCalculatorProps, ZakatCalculatorState> {
  constructor(props: ZakatCalculatorProps) {
    super(props);
    this.state = {
      wealth: props.initialWealth || 0,
      nisab: props.initialNisab || 0,
      result: null,
    };
  }

  componentDidUpdate(prevProps: ZakatCalculatorProps) {
    if (this.state.wealth !== prevProps.initialWealth) {
      // Update logic
    }
  }

  render() {
    return (
      <div className="zakat-calculator">
        <h2>Zakat Calculator</h2>
        {/* Component JSX */}
      </div>
    );
  }
}
```

**Benefits of Functional Components**:

- **Simpler syntax**: No `this` binding
- **Hooks**: Access to useState, useEffect, etc.
- **Better TypeScript integration**: Clearer type inference
- **Easier testing**: Pure functions are easier to test
- **Better performance**: Less overhead than class components

### 2. Component Composition Over Inheritance

**Pattern**: Build complex components by composing simple ones, not through inheritance.

**Idiom**: Compose components using props.children and explicit composition.

**Idiomatic Composition**:

```typescript
// Base Card component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};

// Specialized components through composition
interface DonationCardProps {
  donation: Donation;
  onView: (id: string) => void;
}

export const DonationCard: React.FC<DonationCardProps> = ({ donation, onView }) => {
  return (
    <Card onClick={() => onView(donation.id)}>
      <h3>{donation.category}</h3>
      <p>Amount: {donation.amount} {donation.currency}</p>
      <p>Date: {new Date(donation.date).toLocaleDateString()}</p>
    </Card>
  );
};

// Layout composition
export const DonationList: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="donation-list">
      {donations.map(donation => (
        <DonationCard
          key={donation.id}
          donation={donation}
          onView={setSelectedId}
        />
      ))}
    </div>
  );
};
```

**Compound Components Pattern**:

```typescript
// Tabs compound component
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within Tabs');
  }
  return context;
};

// Tabs container
interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ defaultTab, children }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
};

// Tab button
interface TabButtonProps {
  id: string;
  children: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({ id, children }) => {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === id;

  return (
    <button
      className={`tab-button ${isActive ? 'active' : ''}`}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
};

// Tab panel
interface TabPanelProps {
  id: string;
  children: React.ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, children }) => {
  const { activeTab } = useTabs();

  if (activeTab !== id) return null;

  return <div className="tab-panel">{children}</div>;
};

// Usage
export const FinancialDashboard: React.FC = () => {
  return (
    <Tabs defaultTab="zakat">
      <div className="tab-buttons">
        <TabButton id="zakat">Zakat</TabButton>
        <TabButton id="donations">Donations</TabButton>
        <TabButton id="loans">Loans</TabButton>
      </div>

      <TabPanel id="zakat">
        <ZakatCalculator />
      </TabPanel>

      <TabPanel id="donations">
        <DonationList />
      </TabPanel>

      <TabPanel id="loans">
        <LoanList />
      </TabPanel>
    </Tabs>
  );
};
```

### 3. Props Patterns and Destructuring

**Pattern**: Use TypeScript interfaces for props and destructure in function signature.

**Idiom**: Explicit interfaces with optional props and default values.

**Idiomatic Props**:

```typescript
// Define clear prop types
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

// Destructure with defaults
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
}) => {
  const classes = `button button--${variant} button--${size} ${className}`.trim();

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};
```

**Props Spreading (Extending Native Elements)**:

```typescript
// Extend native element props
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...inputProps
}) => {
  return (
    <div className="input-wrapper">
      <label className="input-label">{label}</label>
      <input
        className={`input ${error ? 'input--error' : ''} ${className}`}
        {...inputProps}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};
```

**Generic Components**:

```typescript
// Generic component with type safety
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}

export function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
}: SelectProps<T>) {
  return (
    <select
      value={getValue(value)}
      onChange={(e) => {
        const selectedOption = options.find(
          (opt) => getValue(opt) === e.target.value
        );
        if (selectedOption) {
          onChange(selectedOption);
        }
      }}
    >
      {options.map((option) => (
        <option key={getValue(option)} value={getValue(option)}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}

// Usage with type safety
interface Currency {
  code: string;
  name: string;
}

const currencies: Currency[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
];

export const CurrencySelector: React.FC = () => {
  const [currency, setCurrency] = useState(currencies[0]);

  return (
    <Select
      options={currencies}
      value={currency}
      onChange={setCurrency}
      getLabel={(c) => c.name}
      getValue={(c) => c.code}
    />
  );
};
```

### 4. useState for Local State

**Pattern**: Use useState for component-local state.

**Idiom**: TypeScript-typed state with functional updates.

**Basic useState**:

```typescript
export const DonationForm: React.FC = () => {
  // Primitive state
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>('');

  // Object state (immutable updates)
  const [formData, setFormData] = useState({
    amount: 0,
    category: '',
    currency: 'USD',
    date: new Date(),
  });

  // Update individual field immutably
  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form>
      <input
        type="number"
        value={formData.amount}
        onChange={(e) => updateField('amount', Number(e.target.value))}
      />
      {/* Other fields */}
    </form>
  );
};
```

**Functional Updates for Previous State**:

```typescript
export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  // Wrong - may lead to stale state
  const incrementWrong = () => {
    setCount(count + 1);
    setCount(count + 1); // Still adds 1, not 2
  };

  // Correct - functional update
  const incrementCorrect = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1); // Correctly adds 2
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementCorrect}>Increment Twice</button>
    </div>
  );
};
```

**Complex State Management**:

```typescript
interface ZakatState {
  wealth: number;
  nisab: number;
  zakatAmount: number;
  eligible: boolean;
  loading: boolean;
  error: string | null;
}

export const ZakatCalculator: React.FC = () => {
  const [state, setState] = useState<ZakatState>({
    wealth: 0,
    nisab: 0,
    zakatAmount: 0,
    eligible: false,
    loading: false,
    error: null,
  });

  // Partial state update helper
  const updateState = (partial: Partial<ZakatState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };

  const calculate = async () => {
    updateState({ loading: true, error: null });

    try {
      const result = await calculateZakat(state.wealth, state.nisab);
      updateState({
        zakatAmount: result.amount,
        eligible: result.eligible,
        loading: false,
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Calculation failed',
        loading: false,
      });
    }
  };

  return <div>{/* Component JSX */}</div>;
};
```

### 5. useEffect for Side Effects

**Pattern**: Use useEffect for side effects (data fetching, subscriptions, manual DOM manipulation).

**Idiom**: Dependencies array with cleanup functions.

**Data Fetching**:

```typescript
export const DonationHistory: React.FC<{ userId: string }> = ({ userId }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // Prevent state updates after unmount

    const fetchDonations = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.getDonations(userId);

        if (!cancelled) {
          setDonations(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        }
      }
    };

    fetchDonations();

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [userId]); // Re-run when userId changes

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {donations.map(donation => (
        <li key={donation.id}>{donation.category}: {donation.amount}</li>
      ))}
    </ul>
  );
};
```

**Subscriptions**:

```typescript
export const LiveZakatRate: React.FC = () => {
  const [rate, setRate] = useState<number>(0.025);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = zakatRateService.subscribe((newRate) => {
      setRate(newRate);
    });

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, []); // Empty array = run once on mount

  return <div>Current Zakat Rate: {(rate * 100).toFixed(2)}%</div>;
};
```

**Timer Cleanup**:

```typescript
export const SessionTimer: React.FC<{ onTimeout: () => void }> = ({ onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    // Cleanup: clear interval on unmount or dependency change
    return () => {
      clearInterval(timer);
    };
  }, [timeLeft, onTimeout]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div>
      Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};
```

### 6. useContext for Global State

**Pattern**: Use Context API for state that needs to be accessed by many components.

**Idiom**: Typed context with custom hook.

**Create Context**:

```typescript
// auth/AuthContext.tsx
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

// Custom hook for consuming context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await api.login(email, password);
    setUser(user);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Consume Context**:

```typescript
// Component using context
export const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      <p>Email: {user.email}</p>
      <button onClick={logout}>Log Out</button>
    </div>
  );
};

// Protected route
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### 7. useReducer for Complex State

**Pattern**: Use useReducer for complex state logic with multiple sub-values.

**Idiom**: Typed reducer with discriminated union actions.

**Reducer Pattern**:

```typescript
// State type
interface MurabahaFormState {
  assetCost: number;
  downPayment: number;
  profitRate: number;
  termMonths: number;
  errors: Record<string, string>;
  calculating: boolean;
  result: MurabahaCalculation | null;
}

// Action types (discriminated union)
type MurabahaAction =
  | { type: 'SET_ASSET_COST'; payload: number }
  | { type: 'SET_DOWN_PAYMENT'; payload: number }
  | { type: 'SET_PROFIT_RATE'; payload: number }
  | { type: 'SET_TERM_MONTHS'; payload: number }
  | { type: 'SET_ERROR'; payload: { field: string; error: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'START_CALCULATION' }
  | { type: 'SET_RESULT'; payload: MurabahaCalculation }
  | { type: 'SET_ERROR_MESSAGE'; payload: string }
  | { type: 'RESET' };

// Reducer function
const murabahaReducer = (
  state: MurabahaFormState,
  action: MurabahaAction
): MurabahaFormState => {
  switch (action.type) {
    case 'SET_ASSET_COST':
      return { ...state, assetCost: action.payload };

    case 'SET_DOWN_PAYMENT':
      return { ...state, downPayment: action.payload };

    case 'SET_PROFIT_RATE':
      return { ...state, profitRate: action.payload };

    case 'SET_TERM_MONTHS':
      return { ...state, termMonths: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.field]: action.payload.error },
      };

    case 'CLEAR_ERROR':
      const { [action.payload]: _, ...remainingErrors } = state.errors;
      return { ...state, errors: remainingErrors };

    case 'START_CALCULATION':
      return { ...state, calculating: true, errors: {} };

    case 'SET_RESULT':
      return { ...state, calculating: false, result: action.payload };

    case 'SET_ERROR_MESSAGE':
      return {
        ...state,
        calculating: false,
        errors: { general: action.payload },
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

// Initial state
const initialState: MurabahaFormState = {
  assetCost: 0,
  downPayment: 0,
  profitRate: 0,
  termMonths: 12,
  errors: {},
  calculating: false,
  result: null,
};

// Component using reducer
export const MurabahaCalculator: React.FC = () => {
  const [state, dispatch] = useReducer(murabahaReducer, initialState);

  const handleCalculate = async () => {
    // Validate
    if (state.assetCost <= 0) {
      dispatch({
        type: 'SET_ERROR',
        payload: { field: 'assetCost', error: 'Asset cost must be positive' },
      });
      return;
    }

    dispatch({ type: 'START_CALCULATION' });

    try {
      const result = await api.calculateMurabaha({
        assetCost: state.assetCost,
        downPayment: state.downPayment,
        profitRate: state.profitRate,
        termMonths: state.termMonths,
      });

      dispatch({ type: 'SET_RESULT', payload: result });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR_MESSAGE',
        payload: error instanceof Error ? error.message : 'Calculation failed',
      });
    }
  };

  return (
    <div className="murabaha-calculator">
      <input
        type="number"
        value={state.assetCost}
        onChange={(e) => dispatch({ type: 'SET_ASSET_COST', payload: Number(e.target.value) })}
      />
      {state.errors.assetCost && <span className="error">{state.errors.assetCost}</span>}

      {/* Other inputs */}

      <button onClick={handleCalculate} disabled={state.calculating}>
        {state.calculating ? 'Calculating...' : 'Calculate'}
      </button>

      {state.result && (
        <div className="result">
          <h3>Monthly Payment: {state.result.monthlyPayment}</h3>
          <p>Total Amount: {state.result.totalAmount}</p>
        </div>
      )}
    </div>
  );
};
```

### 8. useMemo and useCallback for Performance

**Pattern**: Use useMemo for expensive computations and useCallback for function memoization.

**Idiom**: Memoize only when necessary, not prematurely.

**useMemo for Expensive Calculations**:

```typescript
export const DonationAnalytics: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  // Expensive calculation - only re-run when donations change
  const analytics = useMemo(() => {
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    const byCategory = donations.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + d.amount;
      return acc;
    }, {} as Record<string, number>);

    const averageAmount = donations.length > 0 ? totalAmount / donations.length : 0;

    const topCategory = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];

    return {
      totalAmount,
      byCategory,
      averageAmount,
      topCategory: topCategory ? { category: topCategory[0], amount: topCategory[1] } : null,
    };
  }, [donations]);

  return (
    <div className="analytics">
      <h3>Donation Analytics</h3>
      <p>Total: ${analytics.totalAmount}</p>
      <p>Average: ${analytics.averageAmount.toFixed(2)}</p>
      {analytics.topCategory && (
        <p>Top Category: {analytics.topCategory.category} (${analytics.topCategory.amount})</p>
      )}
    </div>
  );
};
```

**useCallback for Function Stability**:

```typescript
interface DonationListProps {
  donations: Donation[];
}

export const DonationList: React.FC<DonationListProps> = ({ donations }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Memoize callback to prevent re-renders of children
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    // Additional logic...
  }, []); // Empty deps = stable function

  const handleDelete = useCallback(async (id: string) => {
    await api.deleteDonation(id);
    // Additional logic...
  }, []); // Empty deps = stable function

  return (
    <div>
      {donations.map(donation => (
        <DonationItem
          key={donation.id}
          donation={donation}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

// Child component wrapped in React.memo
interface DonationItemProps {
  donation: Donation;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DonationItem = React.memo<DonationItemProps>(({ donation, onSelect, onDelete }) => {
  console.log('Rendering DonationItem:', donation.id);

  return (
    <div className="donation-item">
      <h4>{donation.category}</h4>
      <p>{donation.amount}</p>
      <button onClick={() => onSelect(donation.id)}>View</button>
      <button onClick={() => onDelete(donation.id)}>Delete</button>
    </div>
  );
});
```

### 9. Custom Hooks for Reusable Logic

**Pattern**: Extract reusable stateful logic into custom hooks.

**Idiom**: Hooks named with `use` prefix.

**Data Fetching Hook**:

```typescript
// hooks/useFetch.ts
interface UseFetchOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useFetch<T>(
  url: string,
  options?: UseFetchOptions<T>
) {
  const [data, setData] = useState<T | undefined>(options?.initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const json = await response.json();

        if (!cancelled) {
          setData(json);
          options?.onSuccess?.(json);
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Fetch failed');
          setError(error);
          options?.onError?.(error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]); // Re-fetch when URL changes

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  return { data, loading, error, refetch };
}

// Usage
export const DonationList: React.FC = () => {
  const { data: donations, loading, error, refetch } = useFetch<Donation[]>('/api/donations', {
    initialData: [],
    onSuccess: (data) => console.log('Loaded donations:', data.length),
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {donations?.map(d => <DonationItem key={d.id} donation={d} />)}
    </div>
  );
};
```

**Form Hook**:

```typescript
// hooks/useForm.ts
export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues(prev => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [errors]
  );

  const handleBlur = useCallback(<K extends keyof T>(field: K) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setError,
    reset,
  };
}

// Usage
export const DonationForm: React.FC = () => {
  const form = useForm({
    amount: 0,
    category: '',
    currency: 'USD',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (form.values.amount <= 0) {
      form.setError('amount', 'Amount must be positive');
      return;
    }

    try {
      await api.createDonation(form.values);
      form.reset();
    } catch (error) {
      form.setError('amount', 'Failed to create donation');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={form.values.amount}
        onChange={(e) => form.handleChange('amount', Number(e.target.value))}
        onBlur={() => form.handleBlur('amount')}
      />
      {form.touched.amount && form.errors.amount && (
        <span className="error">{form.errors.amount}</span>
      )}

      {/* Other fields */}

      <button type="submit">Submit</button>
    </form>
  );
};
```

### 10. Conditional Rendering Patterns

**Pattern**: Render different UI based on conditions.

**Idiom**: Use JavaScript expressions, not if statements in JSX.

**Ternary Operator**:

```typescript
export const ZakatResult: React.FC<{ calculation: ZakatCalculation | null }> = ({ calculation }) => {
  return (
    <div>
      {calculation ? (
        <div className="result">
          <h3>Zakat Amount: {calculation.zakatAmount.amount}</h3>
          <p>Eligible: {calculation.eligible ? 'Yes' : 'No'}</p>
        </div>
      ) : (
        <p>No calculation yet. Please enter your wealth and nisab.</p>
      )}
    </div>
  );
};
```

**Logical AND (&&)**:

```typescript
export const DonationList: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  return (
    <div>
      <h2>Donations ({donations.length})</h2>

      {donations.length === 0 && (
        <p>No donations yet. Start by making your first donation.</p>
      )}

      {donations.length > 0 && (
        <ul>
          {donations.map(d => (
            <li key={d.id}>{d.category}: {d.amount}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

**Early Return**:

```typescript
export const UserProfile: React.FC<{ user: User | null }> = ({ user }) => {
  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  if (!user.isVerified) {
    return <div>Please verify your email address.</div>;
  }

  return (
    <div className="profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {/* Full profile */}
    </div>
  );
};
```

**Switch-Like Pattern**:

```typescript
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'badge--warning' },
    processing: { label: 'Processing', className: 'badge--info' },
    completed: { label: 'Completed', className: 'badge--success' },
    failed: { label: 'Failed', className: 'badge--danger' },
  };

  const config = statusConfig[status];

  return <span className={`badge ${config.className}`}>{config.label}</span>;
};
```

### 11. List Rendering with Keys

**Pattern**: Render lists with unique, stable keys.

**Idiom**: Use unique IDs as keys, never indexes.

**Good Key Usage**:

```typescript
export const DonationHistory: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  return (
    <ul>
      {donations.map(donation => (
        <li key={donation.id}>
          {donation.category}: {donation.amount} {donation.currency}
          <span>{new Date(donation.date).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  );
};
```

**Bad Key Usage (Avoid)**:

```typescript
// ❌ Bad - using index as key
export const DonationHistory: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  return (
    <ul>
      {donations.map((donation, index) => (
        <li key={index}>
          {/* This will cause issues when list order changes */}
        </li>
      ))}
    </ul>
  );
};
```

**Composite Keys for Nested Lists**:

```typescript
interface Category {
  id: string;
  name: string;
  donations: Donation[];
}

export const CategoryList: React.FC<{ categories: Category[] }> = ({ categories }) => {
  return (
    <div>
      {categories.map(category => (
        <div key={category.id} className="category">
          <h3>{category.name}</h3>
          <ul>
            {category.donations.map(donation => (
              <li key={`${category.id}-${donation.id}`}>
                {donation.amount} on {new Date(donation.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
```

### 12. Event Handling Patterns

**Pattern**: Handle events with type-safe event handlers.

**Idiom**: Inline handlers for simple cases, extracted functions for complex logic.

**Inline Event Handlers**:

```typescript
export const ZakatForm: React.FC = () => {
  const [wealth, setWealth] = useState(0);
  const [nisab, setNisab] = useState(0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log('Calculate zakat:', { wealth, nisab });
      }}
    >
      <input
        type="number"
        value={wealth}
        onChange={(e) => setWealth(Number(e.target.value))}
      />

      <input
        type="number"
        value={nisab}
        onChange={(e) => setNisab(Number(e.target.value))}
      />

      <button type="submit">Calculate</button>
    </form>
  );
};
```

**Extracted Event Handlers**:

```typescript
export const DonationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    amount: 0,
    category: '',
    date: new Date(),
  });

  // Type-safe event handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.createDonation(formData);
      // Reset form
      setFormData({ amount: 0, category: '', date: new Date() });
    } catch (error) {
      console.error('Failed to create donation:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="amount"
        type="number"
        value={formData.amount}
        onChange={handleChange}
      />

      <input
        name="category"
        type="text"
        value={formData.category}
        onChange={handleChange}
      />

      <button type="submit">Submit</button>
    </form>
  );
};
```

**Callback with Arguments**:

```typescript
interface DonationListProps {
  donations: Donation[];
  onDelete: (id: string) => void;
}

export const DonationList: React.FC<DonationListProps> = ({ donations, onDelete }) => {
  // Method 1: Inline arrow function
  return (
    <ul>
      {donations.map(donation => (
        <li key={donation.id}>
          {donation.category}: {donation.amount}
          <button onClick={() => onDelete(donation.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
};

// Method 2: Curried function (for better performance with React.memo)
export const DonationListOptimized: React.FC<DonationListProps> = ({ donations, onDelete }) => {
  const handleDelete = useCallback(
    (id: string) => () => {
      onDelete(id);
    },
    [onDelete]
  );

  return (
    <ul>
      {donations.map(donation => (
        <DonationItem
          key={donation.id}
          donation={donation}
          onDelete={handleDelete(donation.id)}
        />
      ))}
    </ul>
  );
};
```

### 13. Controlled vs Uncontrolled Components

**Pattern**: Prefer controlled components for predictable state management.

**Idiom**: Controlled components with React state.

**Controlled Component (Recommended)**:

```typescript
export const DonationAmountInput: React.FC = () => {
  const [amount, setAmount] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Validate - only allow numbers
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (numericAmount > 0) {
      console.log('Submit donation:', numericAmount);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Donation Amount:
        <input
          type="text"
          value={amount}
          onChange={handleChange}
          placeholder="Enter amount"
        />
      </label>
      <button type="submit">Donate</button>
    </form>
  );
};
```

**Uncontrolled Component (Refs)**:

```typescript
// Use uncontrolled for simple forms or third-party integrations
export const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (file) {
      console.log('Upload file:', file.name);
      // Process file...
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" ref={fileInputRef} />
      <button type="submit">Upload</button>
    </form>
  );
};
```

**Controlled with Validation**:

```typescript
export const EmailInput: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setError('Invalid email format');
    } else {
      setError('');
    }
  };

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={handleChange}
        className={error ? 'input--error' : ''}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
};
```

## Related Documentation

- **[React Best Practices](best-practices.md)** - Production standards
- **[React Anti-Patterns](anti-patterns.md)** - Common mistakes
- **[Component Architecture](component-architecture.md)** - Component design
- **[Hooks](hooks.md)** - Deep dive into React hooks
- **[TypeScript](typescript.md)** - TypeScript integration
- **[State Management](state-management.md)** - State patterns
- **[Testing](testing.md)** - Testing strategies

---

**React Version**: 18.2+
**TypeScript Version**: 5+

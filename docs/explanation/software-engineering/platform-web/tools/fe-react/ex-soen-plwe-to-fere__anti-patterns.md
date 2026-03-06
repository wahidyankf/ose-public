---
title: "React Anti-Patterns"
description: Common mistakes and problematic patterns to avoid in React development
category: explanation
subcategory: platform-web
tags:
  - react
  - anti-patterns
  - mistakes
  - typescript
  - code-quality
related:
  - ./ex-soen-plwe-fere__idioms.md
  - ./ex-soen-plwe-fere__best-practices.md
  - ./ex-soen-plwe-fere__performance.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
updated: 2026-01-25
---

# React Anti-Patterns

## Quick Reference

### Common Mistakes

**State Management**:

- [Prop Drilling](#1-prop-drilling-without-context) - Passing props through many layers
- [Unnecessary Re-renders](#2-unnecessary-re-renders) - Performance issues
- [Derived State in useState](#3-storing-derived-state) - Redundant state
- [State in Render](#4-state-initialization-in-render) - Initialization mistakes

**Hooks**:

- [Missing Dependencies](#5-missing-dependencies-in-useeffect) - useEffect bugs
- [Race Conditions](#6-race-conditions-in-useeffect) - Async issues
- [Overusing useEffect](#7-overusing-useeffect) - Effect misuse
- [Breaking Hooks Rules](#8-breaking-rules-of-hooks) - Conditional hooks

**Components**:

- [Direct DOM Manipulation](#9-direct-dom-manipulation) - Imperative code
- [Incorrect Keys](#10-incorrect-key-usage) - List rendering issues
- [God Components](#11-god-components) - Too many responsibilities

**TypeScript**:

- [Using any](#12-overusing-any-type) - Type safety loss
- [Type Assertions](#13-excessive-type-assertions) - Unsafe casting
- [Implicit Props](#14-implicit-any-in-props) - Missing types

### Related Documentation

- [Idioms](ex-soen-plwe-to-fere__idioms.md)
- [Best Practices](ex-soen-plwe-to-fere__best-practices.md)
- [Performance](ex-soen-plwe-to-fere__performance.md)
- [Hooks](ex-soen-plwe-to-fere__hooks.md)

## Overview

React anti-patterns are common mistakes that lead to bugs, performance issues, maintainability problems, or type safety concerns. Understanding these patterns helps avoid technical debt and build robust applications.

This guide identifies **React 19+ anti-patterns** with TypeScript 5+, showing both the problematic code and the correct solution.

## State Management Anti-Patterns

### 1. Prop Drilling Without Context

**Problem**: Passing props through multiple layers of components that don't need them.

**❌ Anti-Pattern**:

```typescript
// App level
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  return <Layout user={user} setUser={setUser} />;
};

// Layout doesn't use user, just passes it down
const Layout: React.FC<{ user: User | null; setUser: (user: User | null) => void }> = ({
  user,
  setUser,
}) => {
  return (
    <div>
      <Sidebar user={user} setUser={setUser} />
      <MainContent user={user} setUser={setUser} />
    </div>
  );
};

// Sidebar doesn't use user, just passes it down
const Sidebar: React.FC<{ user: User | null; setUser: (user: User | null) => void }> = ({
  user,
  setUser,
}) => {
  return (
    <div>
      <UserProfile user={user} setUser={setUser} />
    </div>
  );
};

// Finally used here
const UserProfile: React.FC<{ user: User | null; setUser: (user: User | null) => void }> = ({
  user,
  setUser,
}) => {
  if (!user) return <div>Not logged in</div>;
  return <div>{user.name}</div>;
};
```

**✅ Solution - Use Context**:

```typescript
// Create context
interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Provider at app level
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Layout />
    </AuthContext.Provider>
  );
};

// Intermediate components don't need props
const Layout: React.FC = () => {
  return (
    <div>
      <Sidebar />
      <MainContent />
    </div>
  );
};

const Sidebar: React.FC = () => {
  return (
    <div>
      <UserProfile />
    </div>
  );
};

// Component uses context directly
const UserProfile: React.FC = () => {
  const { user, setUser } = useAuth();

  if (!user) return <div>Not logged in</div>;
  return <div>{user.name}</div>;
};
```

### 2. Unnecessary Re-renders

**Problem**: Components re-render when their props haven't changed.

**❌ Anti-Pattern**:

```typescript
const DonationList: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  // New function on every render
  const handleDelete = (id: string) => {
    console.log('Delete:', id);
  };

  return (
    <div>
      {donations.map((donation) => (
        <DonationItem
          key={donation.id}
          donation={donation}
          onDelete={handleDelete}  // New reference every render!
        />
      ))}
    </div>
  );
};

// This component will re-render on every parent render
const DonationItem: React.FC<{
  donation: Donation;
  onDelete: (id: string) => void;
}> = ({ donation, onDelete }) => {
  console.log('Rendering DonationItem:', donation.id);

  return (
    <div>
      <p>{donation.amount}</p>
      <button onClick={() => onDelete(donation.id)}>Delete</button>
    </div>
  );
};
```

**✅ Solution - Memoization**:

```typescript
const DonationList: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  // Stable function reference
  const handleDelete = useCallback((id: string) => {
    console.log('Delete:', id);
  }, []);

  return (
    <div>
      {donations.map((donation) => (
        <DonationItem
          key={donation.id}
          donation={donation}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

// Memoized component only re-renders when props change
const DonationItem = React.memo<{
  donation: Donation;
  onDelete: (id: string) => void;
}>(({ donation, onDelete }) => {
  console.log('Rendering DonationItem:', donation.id);

  return (
    <div>
      <p>{donation.amount}</p>
      <button onClick={() => onDelete(donation.id)}>Delete</button>
    </div>
  );
});
```

### 3. Storing Derived State

**Problem**: Storing values in state that can be computed from existing state.

**❌ Anti-Pattern**:

```typescript
const ZakatCalculator: React.FC = () => {
  const [wealth, setWealth] = useState(0);
  const [nisab, setNisab] = useState(0);
  const [zakatAmount, setZakatAmount] = useState(0);  // Derived!
  const [isEligible, setIsEligible] = useState(false); // Derived!

  // Synchronization bugs waiting to happen
  useEffect(() => {
    const eligible = wealth >= nisab;
    const amount = eligible ? wealth * 0.025 : 0;
    setZakatAmount(amount);
    setIsEligible(eligible);
  }, [wealth, nisab]);

  return (
    <div>
      <input value={wealth} onChange={(e) => setWealth(Number(e.target.value))} />
      <input value={nisab} onChange={(e) => setNisab(Number(e.target.value))} />
      <p>Zakat: {zakatAmount}</p>
      <p>Eligible: {isEligible ? 'Yes' : 'No'}</p>
    </div>
  );
};
```

**✅ Solution - Compute During Render**:

```typescript
const ZakatCalculator: React.FC = () => {
  const [wealth, setWealth] = useState(0);
  const [nisab, setNisab] = useState(0);

  // Compute derived values during render
  const isEligible = wealth >= nisab;
  const zakatAmount = isEligible ? wealth * 0.025 : 0;

  return (
    <div>
      <input value={wealth} onChange={(e) => setWealth(Number(e.target.value))} />
      <input value={nisab} onChange={(e) => setNisab(Number(e.target.value))} />
      <p>Zakat: {zakatAmount}</p>
      <p>Eligible: {isEligible ? 'Yes' : 'No'}</p>
    </div>
  );
};
```

### 4. State Initialization in Render

**Problem**: Expensive computations or function calls in useState initializer.

**❌ Anti-Pattern**:

```typescript
const ExpensiveComponent: React.FC = () => {
  // This runs on EVERY render!
  const [data, setData] = useState(expensiveComputation());

  return <div>{data}</div>;
};
```

**✅ Solution - Lazy Initialization**:

```typescript
const ExpensiveComponent: React.FC = () => {
  // Function runs only once on mount
  const [data, setData] = useState(() => expensiveComputation());

  return <div>{data}</div>;
};
```

## Hooks Anti-Patterns

### 5. Missing Dependencies in useEffect

**Problem**: useEffect with incomplete dependency array leads to stale closures.

**❌ Anti-Pattern**:

```typescript
const DonationTracker: React.FC<{ userId: string }> = ({ userId }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // BUG: Using 'filter' but not in dependencies
    const fetchDonations = async () => {
      const data = await api.getDonations(userId, filter);
      setDonations(data);
    };

    fetchDonations();
  }, [userId]); // Missing 'filter'!

  return <div>{/* ... */}</div>;
};
```

**✅ Solution - Complete Dependencies**:

```typescript
const DonationTracker: React.FC<{ userId: string }> = ({ userId }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchDonations = async () => {
      const data = await api.getDonations(userId, filter);
      setDonations(data);
    };

    fetchDonations();
  }, [userId, filter]); // Complete dependencies

  return <div>{/* ... */}</div>;
};
```

### 6. Race Conditions in useEffect

**Problem**: Not handling component unmount or rapid state changes in async effects.

**❌ Anti-Pattern**:

```typescript
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const data = await api.getUser(userId);
      // BUG: Component may have unmounted or userId changed
      setUser(data);
    };

    fetchUser();
  }, [userId]);

  return <div>{user?.name}</div>;
};
```

**✅ Solution - Cleanup and Cancellation**:

```typescript
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      const data = await api.getUser(userId);

      // Only update if not cancelled
      if (!cancelled) {
        setUser(data);
      }
    };

    fetchUser();

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return <div>{user?.name}</div>;
};
```

### 7. Overusing useEffect

**Problem**: Using useEffect for operations that should happen during render or event handlers.

**❌ Anti-Pattern**:

```typescript
const SearchInput: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  // Anti-pattern: using effect for synchronous operation
  useEffect(() => {
    const filtered = items.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query]);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {/* ... */}
    </div>
  );
};
```

**✅ Solution - Compute During Render**:

```typescript
const SearchInput: React.FC = () => {
  const [query, setQuery] = useState('');

  // Compute during render
  const results = items.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {/* ... */}
    </div>
  );
};
```

### 8. Breaking Rules of Hooks

**Problem**: Calling hooks conditionally or in loops.

**❌ Anti-Pattern**:

```typescript
const BadComponent: React.FC<{ condition: boolean }> = ({ condition }) => {
  // ❌ Conditional hook call
  if (condition) {
    const [value, setValue] = useState(0);
  }

  // ❌ Hook in loop
  for (let i = 0; i < 5; i++) {
    useEffect(() => {
      console.log(i);
    }, [i]);
  }

  return <div>Bad</div>;
};
```

**✅ Solution - Hooks at Top Level**:

```typescript
const GoodComponent: React.FC<{ condition: boolean }> = ({ condition }) => {
  // ✅ Always call hooks at top level
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Conditional logic inside effect
    if (condition) {
      console.log(value);
    }
  }, [condition, value]);

  return <div>Good</div>;
};
```

## Component Anti-Patterns

### 9. Direct DOM Manipulation

**Problem**: Using refs to manipulate DOM instead of state.

**❌ Anti-Pattern**:

```typescript
const BadToggle: React.FC = () => {
  const divRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    // ❌ Direct DOM manipulation
    if (divRef.current) {
      divRef.current.style.display =
        divRef.current.style.display === 'none' ? 'block' : 'none';
    }
  };

  return (
    <div>
      <button onClick={handleClick}>Toggle</button>
      <div ref={divRef}>Content</div>
    </div>
  );
};
```

**✅ Solution - Use State**:

```typescript
const GoodToggle: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div>
      <button onClick={() => setIsVisible(!isVisible)}>Toggle</button>
      {isVisible && <div>Content</div>}
    </div>
  );
};
```

### 10. Incorrect Key Usage

**Problem**: Using array index or non-unique values as keys.

**❌ Anti-Pattern**:

```typescript
const BadList: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  return (
    <ul>
      {donations.map((donation, index) => (
        // ❌ Using index as key
        <li key={index}>
          {donation.category}: {donation.amount}
        </li>
      ))}
    </ul>
  );
};

const AlsoBad: React.FC<{ items: string[] }> = ({ items }) => {
  return (
    <ul>
      {items.map((item) => (
        // ❌ Using non-unique value as key
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};
```

**✅ Solution - Use Unique IDs**:

```typescript
const GoodList: React.FC<{ donations: Donation[] }> = ({ donations }) => {
  return (
    <ul>
      {donations.map((donation) => (
        // ✅ Using unique ID
        <li key={donation.id}>
          {donation.category}: {donation.amount}
        </li>
      ))}
    </ul>
  );
};

const AlsoGood: React.FC<{ items: Array<{ id: string; name: string }> }> = ({ items }) => {
  return (
    <ul>
      {items.map((item) => (
        // ✅ Using unique ID
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};
```

### 11. God Components

**Problem**: Components with too many responsibilities.

**❌ Anti-Pattern**:

```typescript
const GodComponent: React.FC = () => {
  // Too much state
  const [donations, setDonations] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({});
  const [sorting, setSorting] = useState({});

  // Too much logic
  useEffect(() => { /* fetch donations */ }, []);
  useEffect(() => { /* fetch users */ }, []);
  useEffect(() => { /* fetch transactions */ }, []);
  useEffect(() => { /* sync data */ }, [donations, users]);

  // Complex rendering
  return (
    <div>
      {/* Hundreds of lines of JSX */}
      {/* Multiple unrelated sections */}
    </div>
  );
};
```

**✅ Solution - Split Into Smaller Components**:

```typescript
// Feature-focused components
const DonationSection: React.FC = () => {
  const { donations, loading } = useDonations();

  if (loading) return <LoadingSpinner />;
  return <DonationList donations={donations} />;
};

const UserSection: React.FC = () => {
  const { users, loading } = useUsers();

  if (loading) return <LoadingSpinner />;
  return <UserList users={users} />;
};

const TransactionSection: React.FC = () => {
  const { transactions, loading } = useTransactions();

  if (loading) return <LoadingSpinner />;
  return <TransactionList transactions={transactions} />;
};

// Composed parent
const Dashboard: React.FC = () => {
  return (
    <div>
      <DonationSection />
      <UserSection />
      <TransactionSection />
    </div>
  );
};
```

## TypeScript Anti-Patterns

### 12. Overusing `any` Type

**Problem**: Losing type safety with `any`.

**❌ Anti-Pattern**:

```typescript
// ❌ any everywhere
const processData = (data: any) => {
  return data.map((item: any) => ({
    id: item.id,
    value: item.value,
  }));
};

interface BadProps {
  data: any;
  onSubmit: (value: any) => void;
}
```

**✅ Solution - Proper Types**:

```typescript
// ✅ Explicit types
interface DataItem {
  id: string;
  value: number;
}

const processData = (data: DataItem[]) => {
  return data.map((item) => ({
    id: item.id,
    value: item.value,
  }));
};

interface GoodProps {
  data: DataItem[];
  onSubmit: (value: DataItem) => void;
}
```

### 13. Excessive Type Assertions

**Problem**: Forcing types with `as` instead of proper type guards.

**❌ Anti-Pattern**:

```typescript
const BadComponent: React.FC = () => {
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/donation');
      const json = await response.json();
      // ❌ Unsafe type assertion
      setData(json as Donation);
    };

    fetchData();
  }, []);

  // ❌ Another unsafe assertion
  return <div>{(data as Donation).amount}</div>;
};
```

**✅ Solution - Type Guards**:

```typescript
// Type guard
function isDonation(value: unknown): value is Donation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'amount' in value &&
    'category' in value
  );
}

const GoodComponent: React.FC = () => {
  const [data, setData] = useState<Donation | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/donation');
      const json = await response.json();

      // ✅ Validate before setting
      if (isDonation(json)) {
        setData(json);
      }
    };

    fetchData();
  }, []);

  if (!data) return <div>Loading...</div>;

  // ✅ Type-safe access
  return <div>{data.amount}</div>;
};
```

### 14. Implicit `any` in Props

**Problem**: Not typing component props.

**❌ Anti-Pattern**:

```typescript
// ❌ No prop types
const BadComponent = ({ data, onSubmit }) => {
  return (
    <div>
      <button onClick={() => onSubmit(data)}>Submit</button>
    </div>
  );
};
```

**✅ Solution - Explicit Prop Types**:

```typescript
interface GoodComponentProps {
  data: Donation;
  onSubmit: (donation: Donation) => void;
}

const GoodComponent: React.FC<GoodComponentProps> = ({ data, onSubmit }) => {
  return (
    <div>
      <button onClick={() => onSubmit(data)}>Submit</button>
    </div>
  );
};
```

## Performance Anti-Patterns

### 15. Creating Objects/Arrays in Render

**Problem**: Creating new references on every render.

**❌ Anti-Pattern**:

```typescript
const BadComponent: React.FC = () => {
  return (
    <ChildComponent
      // ❌ New object every render
      config={{ rate: 0.025, currency: 'USD' }}
      // ❌ New array every render
      items={['zakat', 'sadaqah', 'waqf']}
    />
  );
};
```

**✅ Solution - Memoize or Move Outside**:

```typescript
// Move constant data outside component
const CONFIG = { rate: 0.025, currency: 'USD' };
const ITEMS = ['zakat', 'sadaqah', 'waqf'];

const GoodComponent: React.FC = () => {
  return (
    <ChildComponent
      config={CONFIG}
      items={ITEMS}
    />
  );
};

// Or use useMemo for dynamic values
const AlsoGood: React.FC<{ rate: number }> = ({ rate }) => {
  const config = useMemo(
    () => ({ rate, currency: 'USD' }),
    [rate]
  );

  return <ChildComponent config={config} />;
};
```

### 16. Premature Optimization

**Problem**: Optimizing before measuring.

**❌ Anti-Pattern**:

```typescript
// ❌ Unnecessary memoization everywhere
const OverOptimized: React.FC = () => {
  const value = useMemo(() => 1 + 1, []);  // Pointless
  const callback = useCallback(() => {
    console.log('hi');
  }, []);  // Premature

  return <SimpleComponent value={value} onClick={callback} />;
};
```

**✅ Solution - Optimize When Needed**:

```typescript
// ✅ Simple component, no memoization needed
const Simple: React.FC = () => {
  const value = 1 + 1;
  const handleClick = () => console.log('hi');

  return <SimpleComponent value={value} onClick={handleClick} />;
};

// ✅ Optimize only when profiling shows issues
const Complex: React.FC<{ items: Item[] }> = ({ items }) => {
  // This IS worth memoizing - expensive computation
  const summary = useMemo(() => {
    return items.reduce((acc, item) => {
      // Complex aggregation logic
      return acc;
    }, {});
  }, [items]);

  return <SummaryDisplay data={summary} />;
};
```

## Security Anti-Patterns

### 17. Unsafe HTML Rendering

**Problem**: Using dangerouslySetInnerHTML without sanitization.

**❌ Anti-Pattern**:

```typescript
const BadComponent: React.FC<{ userContent: string }> = ({ userContent }) => {
  // ❌ XSS vulnerability!
  return <div dangerouslySetInnerHTML={{ __html: userContent }} />;
};
```

**✅ Solution - Sanitize or Avoid**:

```typescript
import DOMPurify from 'dompurify';

const GoodComponent: React.FC<{ userContent: string }> = ({ userContent }) => {
  // ✅ Sanitize before rendering
  const sanitizedContent = DOMPurify.sanitize(userContent);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};

// ✅ Better - use React's default escaping
const BetterComponent: React.FC<{ userContent: string }> = ({ userContent }) => {
  return <div>{userContent}</div>;  // Automatically escaped
};
```

### 18. Storing Secrets in Client

**Problem**: Hardcoding or exposing secrets in frontend code.

**❌ Anti-Pattern**:

```typescript
// ❌ NEVER do this!
const API_KEY = "sk_live_secret_key_12345";

const BadComponent: React.FC = () => {
  const fetchData = async () => {
    const response = await fetch("https://api.example.com", {
      headers: {
        Authorization: `Bearer ${API_KEY}`, // Exposed!
      },
    });
  };
};
```

**✅ Solution - Backend Proxy**:

```typescript
// ✅ Call backend endpoint that handles auth
const GoodComponent: React.FC = () => {
  const fetchData = async () => {
    // Backend adds API key securely
    const response = await fetch("/api/proxy/data");
    return response.json();
  };
};
```

## Related Documentation

- **[React Idioms](ex-soen-plwe-to-fere__idioms.md)** - Framework patterns
- **[React Best Practices](ex-soen-plwe-to-fere__best-practices.md)** - Production standards
- **[Performance](ex-soen-plwe-to-fere__performance.md)** - Optimization strategies
- **[Hooks](ex-soen-plwe-to-fere__hooks.md)** - Hooks documentation
- **[TypeScript](ex-soen-plwe-to-fere__typescript.md)** - TypeScript integration
- **[Security](ex-soen-plwe-to-fere__security.md)** - Security best practices

---

**Last Updated**: 2026-01-25
**React Version**: 18.2+
**TypeScript Version**: 5+

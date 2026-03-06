---
title: "React Functional Programming"
description: Functional programming patterns and principles in React
category: explanation
subcategory: platform-web
tags:
  - react
  - functional-programming
  - immutability
  - pure-functions
  - typescript
related:
  - ./ex-soen-plwe-fere__idioms.md
  - ./ex-soen-plwe-fere__best-practices.md
principles:
  - immutability
  - pure-functions
updated: 2026-01-25
---

# React Functional Programming

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [TypeScript React](./README.md) > Functional Programming

**Related Guides**:

- [Idioms](ex-soen-plwe-to-fere__idioms.md) - Functional patterns
- [Hooks](ex-soen-plwe-to-fere__hooks.md) - Hooks as FP abstractions
- [Component Architecture](ex-soen-plwe-to-fere__component-architecture.md) - Component patterns

## Overview

Functional programming principles align naturally with React's component model. This guide covers pure components, immutability, function composition, and functional patterns.

**Target Audience**: Developers building React applications with functional programming principles, particularly for Islamic finance platforms requiring predictable, testable code.

**React Version**: React 19.0 with TypeScript 5+

## Pure Components

### Pure Function Components

```typescript
// Pure component - same props = same output
export const ZakatDisplay: React.FC<{
  wealth: number;
  nisab: number;
  rate: number;
}> = ({ wealth, nisab, rate }) => {
  // Pure calculation
  const isEligible = wealth >= nisab;
  const zakatDue = isEligible ? wealth * rate : 0;

  return (
    <div>
      <p>Wealth: {wealth}</p>
      <p>Nisab: {nisab}</p>
      <p>Zakat Due: {zakatDue}</p>
    </div>
  );
};

// Impure component - has side effects
export const ImpureComponent: React.FC = () => {
  // ❌ Side effect during render
  localStorage.setItem('renderCount', String(Date.now()));

  return <div>Component</div>;
};

// ✅ Side effects in useEffect
export const PureComponent: React.FC = () => {
  useEffect(() => {
    localStorage.setItem('renderCount', String(Date.now()));
  }, []);

  return <div>Component</div>;
};
```

## Immutability

### Immutable State Updates

```typescript
export const AssetManager: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);

  // ❌ Mutable update
  const addAssetMutable = (asset: Asset) => {
    assets.push(asset); // Mutates array
    setAssets(assets); // Won't trigger re-render
  };

  // ✅ Immutable update
  const addAsset = (asset: Asset) => {
    setAssets(prev => [...prev, asset]); // New array
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(prev =>
      prev.map(asset =>
        asset.id === id
          ? { ...asset, ...updates } // New object
          : asset
      )
    );
  };

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  return <div>{/* UI */}</div>;
};
```

### Immutable Object Updates

```typescript
// Nested object updates
const [form, setForm] = useState({
  donor: {
    name: "",
    email: "",
    address: {
      city: "",
      country: "",
    },
  },
  amount: 0,
});

// ❌ Mutable nested update
const updateCityMutable = (city: string) => {
  form.donor.address.city = city; // Mutates
  setForm(form); // Won't trigger re-render
};

// ✅ Immutable nested update
const updateCity = (city: string) => {
  setForm((prev) => ({
    ...prev,
    donor: {
      ...prev.donor,
      address: {
        ...prev.donor.address,
        city,
      },
    },
  }));
};

// ✅ Using Immer for complex updates
import { useImmer } from "use-immer";

const [form, updateForm] = useImmer({
  donor: {
    name: "",
    email: "",
    address: { city: "", country: "" },
  },
  amount: 0,
});

const updateCity = (city: string) => {
  updateForm((draft) => {
    draft.donor.address.city = city; // Immer handles immutability
  });
};
```

## Function Composition

### Composing Functions

```typescript
// Pure utility functions
const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const calculateZakat = (wealth: number): number => {
  return wealth * 0.025;
};

const isEligible = (wealth: number, nisab: number): boolean => {
  return wealth >= nisab;
};

// Compose functions
const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) =>
    fns.reduce((acc, fn) => fn(acc), value);

const compose =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) =>
    fns.reduceRight((acc, fn) => fn(acc), value);

// Usage
const processWealth = pipe(
  (wealth: number) => wealth, // Start value
  (w) => (isEligible(w, 5000) ? w : 0),
  (w) => calculateZakat(w),
  (z) => Math.round(z * 100) / 100,
);

const zakatAmount = processWealth(10000); // 250
```

### Higher-Order Components

```typescript
// HOC for logging
function withLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  return function LoggedComponent(props: P) {
    useEffect(() => {
      console.log(`${componentName} mounted`);
      return () => console.log(`${componentName} unmounted`);
    }, []);

    return <Component {...props} />;
  };
}

// Usage
const DonationFormWithLogging = withLogging(DonationForm, 'DonationForm');

// HOC composition
const enhance = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(
    withLogging(
      withErrorBoundary(Component)
    )
  );

const EnhancedDashboard = enhance(Dashboard);
```

## Advanced Function Composition

### Currying and Partial Application

```typescript
// Currying - Transform function with multiple arguments into sequence of single-argument functions
const add = (a: number) => (b: number) => a + b;
const multiply = (a: number) => (b: number) => a * b;

// Partial application
const add10 = add(10);
console.log(add10(5)); // 15

const double = multiply(2);
console.log(double(7)); // 14

// Zakat calculation with currying
const calculateWithRate = (rate: number) => (wealth: number) => wealth * rate;

const calculateZakat = calculateWithRate(0.025); // 2.5% for zakat
const calculateUshr = calculateWithRate(0.1); // 10% for agricultural produce

console.log(calculateZakat(10000)); // 250
console.log(calculateUshr(5000)); // 500

// Curried validation
const validateMinAmount =
  (min: number) =>
  (currency: string) =>
  (amount: number): boolean =>
    amount >= min;

const validateUSDDonation = validateMinAmount(1)("USD");
const validateEURDonation = validateMinAmount(1)("EUR");

console.log(validateUSDDonation(10)); // true
console.log(validateUSDDonation(0.5)); // false
```

### Point-Free Style

```typescript
// Point-free (tacit) programming - functions without explicit arguments

// With explicit arguments
const getAssetValues = (assets: Asset[]) => assets.map((asset) => asset.value);
const sumValues = (values: number[]) => values.reduce((sum, v) => sum + v, 0);
const calculateTotal = (assets: Asset[]) => sumValues(getAssetValues(assets));

// Point-free style
const getAssetValues = (assets: Asset[]) => assets.map((asset) => asset.value);
const sumValues = (values: number[]) => values.reduce((sum, v) => sum + v, 0);
const calculateTotal = pipe(getAssetValues, sumValues);

// More examples
const isPositive = (n: number) => n > 0;
const isEven = (n: number) => n % 2 === 0;

// With arguments
const filterPositiveEven = (numbers: number[]) => numbers.filter((n) => isPositive(n) && isEven(n));

// Point-free
const filterPositiveEven = filter((n: number) => isPositive(n) && isEven(n));

// Zakat eligibility checker (point-free)
const hasMinimumWealth = (nisab: number) => (wealth: number) => wealth >= nisab;
const hasHeldForYear = (heldDays: number) => heldDays >= 354; // Islamic lunar year

const isEligibleForZakat =
  (nisab: number) =>
  (record: { wealth: number; heldDays: number }): boolean =>
    hasMinimumWealth(nisab)(record.wealth) && hasHeldForYear(record.heldDays);

const checkZakatEligibility = isEligibleForZakat(5000);
console.log(checkZakatEligibility({ wealth: 10000, heldDays: 365 })); // true
```

## Monads and Error Handling

### Option/Maybe Type

```typescript
// Option type for handling null/undefined
type Option<T> = Some<T> | None;

interface Some<T> {
  readonly _tag: "Some";
  readonly value: T;
}

interface None {
  readonly _tag: "None";
}

const some = <T>(value: T): Option<T> => ({ _tag: "Some", value });
const none = <T>(): Option<T> => ({ _tag: "None" });

// Option utilities
const map = <A, B>(fn: (a: A) => B) => (option: Option<A>): Option<B> =>
  option._tag === "Some" ? some(fn(option.value)) : none();

const flatMap = <A, B>(fn: (a: A) => Option<B>) => (option: Option<A>): Option<B> =>
  option._tag === "Some" ? fn(option.value) : none();

const getOrElse = <A>(defaultValue: A) => (option: Option<A>): A =>
  option._tag === "Some" ? option.value : defaultValue;

// Usage: Safe donation lookup
const findDonationById = (donations: Donation[], id: string): Option<Donation> => {
  const donation = donations.find((d) => d.id === id);
  return donation ? some(donation) : none();
};

// Chaining operations
const getDonationAmount = (donations: Donation[], id: string): number => {
  return pipe(
    findDonationById(donations, id),
    map((donation) => donation.amount),
    getOrElse(0),
  );
};

// React hook with Option
export const useDonation = (donationId: string): Option<Donation> => {
  const [donation, setDonation] = useState<Option<Donation>>(none());

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const result = await donationApi.getById(donationId);
        setDonation(some(result));
      } catch {
        setDonation(none());
      }
    };

    fetchDonation();
  }, [donationId]);

  return donation;
};

// Component using Option
export const DonationDetails: React.FC<{ donationId: string }> = ({ donationId }) => {
  const donation = useDonation(donationId);

  if (donation._tag === "None") {
    return <div>Donation not found</div>;
  }

  return (
    <div>
      <h3>{donation.value.campaignName}</h3>
      <p>Amount: ${donation.value.amount}</p>
    </div>
  );
};
```

### Either/Result Type

```typescript
// Either type for error handling
type Either<E, A> = Left<E> | Right<A>;

interface Left<E> {
  readonly _tag: "Left";
  readonly left: E;
}

interface Right<A> {
  readonly _tag: "Right";
  readonly right: A;
}

const left = <E, A>(error: E): Either<E, A> => ({ _tag: "Left", left: error });
const right = <E, A>(value: A): Either<E, A> => ({ _tag: "Right", right: value });

// Either utilities
const mapEither = <E, A, B>(fn: (a: A) => B) => (either: Either<E, A>): Either<E, B> =>
  either._tag === "Right" ? right(fn(either.right)) : either;

const flatMapEither = <E, A, B>(fn: (a: A) => Either<E, B>) => (either: Either<E, A>): Either<E, B> =>
  either._tag === "Right" ? fn(either.right) : either;

// Usage: Zakat calculation with validation
type ValidationError = string;

const validateWealth = (wealth: number): Either<ValidationError, number> => {
  if (wealth < 0) {
    return left("Wealth cannot be negative");
  }
  if (!Number.isFinite(wealth)) {
    return left("Wealth must be a finite number");
  }
  return right(wealth);
};

const validateNisab = (nisab: number): Either<ValidationError, number> => {
  if (nisab <= 0) {
    return left("Nisab must be positive");
  }
  return right(nisab);
};

const calculateZakatSafe = (wealth: number, nisab: number): Either<ValidationError, number> => {
  const validatedWealth = validateWealth(wealth);
  if (validatedWealth._tag === "Left") return validatedWealth;

  const validatedNisab = validateNisab(nisab);
  if (validatedNisab._tag === "Left") return validatedNisab;

  const isEligible = validatedWealth.right >= validatedNisab.right;
  const zakatAmount = isEligible ? validatedWealth.right * 0.025 : 0;

  return right(zakatAmount);
};

// React component with Either
export const ZakatCalculator: React.FC = () => {
  const [wealth, setWealth] = useState("");
  const [nisab, setNisab] = useState("");
  const [result, setResult] = useState<Either<ValidationError, number> | null>(null);

  const handleCalculate = () => {
    const wealthNum = Number(wealth);
    const nisabNum = Number(nisab);
    const calculation = calculateZakatSafe(wealthNum, nisabNum);
    setResult(calculation);
  };

  return (
    <div className="zakat-calculator">
      <input type="number" value={wealth} onChange={(e) => setWealth(e.target.value)} placeholder="Wealth" />
      <input type="number" value={nisab} onChange={(e) => setNisab(e.target.value)} placeholder="Nisab" />
      <button onClick={handleCalculate}>Calculate</button>

      {result && (
        <div>
          {result._tag === "Left" ? (
            <div className="error">{result.left}</div>
          ) : (
            <div className="success">Zakat Due: ${result.right.toFixed(2)}</div>
          )}
        </div>
      )}
    </div>
  );
};
```

## Recursive Patterns

### Recursion with Memoization

```typescript
// Fibonacci with memoization
const memoize = <A extends any[], R>(fn: (...args: A) => R): ((...args: A) => R) => {
  const cache = new Map<string, R>();

  return (...args: A): R => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Recursive sum of asset values
const sumAssetValues = memoize((assets: Asset[]): number => {
  if (assets.length === 0) return 0;
  const [first, ...rest] = assets;
  return first.value + sumAssetValues(rest);
});

// Recursive donation tree calculation
interface DonationNode {
  id: string;
  amount: number;
  children: DonationNode[];
}

const calculateTotalDonations = memoize((node: DonationNode): number => {
  const childrenTotal = node.children.reduce((sum, child) => sum + calculateTotalDonations(child), 0);
  return node.amount + childrenTotal;
});

// Flatten nested project structure
interface WaqfProject {
  id: string;
  name: string;
  subprojects: WaqfProject[];
}

const flattenProjects = (project: WaqfProject): WaqfProject[] => {
  if (project.subprojects.length === 0) {
    return [project];
  }

  return [project, ...project.subprojects.flatMap(flattenProjects)];
};

// Usage in React
export const ProjectTree: React.FC<{ project: WaqfProject }> = ({ project }) => {
  const allProjects = useMemo(() => flattenProjects(project), [project]);

  return (
    <ul>
      {allProjects.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
};
```

### Tail Call Optimization

```typescript
// Non-tail recursive (stack overflow risk)
const sumNonTail = (n: number): number => {
  if (n === 0) return 0;
  return n + sumNonTail(n - 1); // Addition happens after recursive call
};

// Tail recursive (optimizable)
const sumTail = (n: number, acc: number = 0): number => {
  if (n === 0) return acc;
  return sumTail(n - 1, acc + n); // Recursive call is last operation
};

// Murabaha installment calculation (tail recursive)
const calculateInstallments = (total: number, count: number, acc: number[] = []): number[] => {
  if (count === 0) return acc;

  const installment = total / count;
  return calculateInstallments(total - installment, count - 1, [...acc, installment]);
};

// Usage
const installments = calculateInstallments(12000, 12);
console.log(installments); // [1000, 1000, 1000, ...]
```

## Lazy Evaluation

### Generators for Lazy Sequences

```typescript
// Generator for infinite sequence
function* fibonacci(): Generator<number> {
  let [prev, curr] = [0, 1];

  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

// Take first N values
const take = <T>(n: number, gen: Generator<T>): T[] => {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    const { value, done } = gen.next();
    if (done) break;
    result.push(value);
  }
  return result;
};

// Usage
const firstTenFib = take(10, fibonacci());
console.log(firstTenFib); // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]

// Lazy donation stream
function* donationStream(donations: Donation[]): Generator<Donation> {
  for (const donation of donations) {
    // Lazy filtering
    if (donation.amount > 0) {
      yield donation;
    }
  }
}

// Process donations lazily
const processLargeDonations = function* (donations: Donation[], threshold: number): Generator<Donation> {
  for (const donation of donationStream(donations)) {
    if (donation.amount >= threshold) {
      yield donation;
    }
  }
};

// React hook with generator
export const useLazyDonations = (donations: Donation[], batchSize: number) => {
  const [displayed, setDisplayed] = useState<Donation[]>([]);
  const generatorRef = useRef<Generator<Donation> | null>(null);

  useEffect(() => {
    generatorRef.current = donationStream(donations);
    setDisplayed([]);
  }, [donations]);

  const loadMore = useCallback(() => {
    if (!generatorRef.current) return;

    const nextBatch = take(batchSize, generatorRef.current);
    setDisplayed((prev) => [...prev, ...nextBatch]);
  }, [batchSize]);

  return { displayed, loadMore, hasMore: displayed.length < donations.length };
};
```

## Algebraic Data Types

### Discriminated Unions

```typescript
// Payment status as discriminated union
type PaymentStatus =
  | { type: "Pending"; submittedAt: Date }
  | { type: "Processing"; transactionId: string }
  | { type: "Completed"; completedAt: Date; receiptUrl: string }
  | { type: "Failed"; error: string; retryable: boolean };

// Pattern matching with exhaustiveness checking
const getPaymentMessage = (status: PaymentStatus): string => {
  switch (status.type) {
    case "Pending":
      return `Payment submitted at ${status.submittedAt.toISOString()}`;
    case "Processing":
      return `Processing transaction ${status.transactionId}`;
    case "Completed":
      return `Payment completed. Receipt: ${status.receiptUrl}`;
    case "Failed":
      return status.retryable ? `Payment failed: ${status.error}. Please retry.` : `Payment failed: ${status.error}`;
    default:
      // TypeScript ensures exhaustiveness
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
  }
};

// Contract status with discriminated union
type ContractStatus =
  | { type: "Draft"; createdAt: Date }
  | { type: "Pending"; submittedAt: Date }
  | { type: "Approved"; approvedAt: Date; approvedBy: string }
  | { type: "Active"; activatedAt: Date; installmentsPaid: number }
  | { type: "Completed"; completedAt: Date }
  | { type: "Defaulted"; defaultedAt: Date; reason: string };

// React component with pattern matching
export const ContractStatusBadge: React.FC<{ status: ContractStatus }> = ({ status }) => {
  const { className, text } = (() => {
    switch (status.type) {
      case "Draft":
        return { className: "badge-draft", text: "Draft" };
      case "Pending":
        return { className: "badge-pending", text: "Pending Approval" };
      case "Approved":
        return { className: "badge-approved", text: `Approved by ${status.approvedBy}` };
      case "Active":
        return { className: "badge-active", text: `Active (${status.installmentsPaid} paid)` };
      case "Completed":
        return { className: "badge-completed", text: "Completed" };
      case "Defaulted":
        return { className: "badge-defaulted", text: `Defaulted: ${status.reason}` };
    }
  })();

  return <span className={`badge ${className}`}>{text}</span>;
};
```

### Sum Types for Domain Modeling

```typescript
// Zakat asset types
type ZakatAsset =
  | { type: "Cash"; amount: number; currency: string }
  | { type: "Gold"; grams: number; pricePerGram: number }
  | { type: "Silver"; grams: number; pricePerGram: number }
  | { type: "Investment"; value: number; currency: string }
  | { type: "BusinessInventory"; value: number; currency: string };

// Calculate asset value
const getAssetValue = (asset: ZakatAsset): number => {
  switch (asset.type) {
    case "Cash":
      return asset.amount;
    case "Gold":
      return asset.grams * asset.pricePerGram;
    case "Silver":
      return asset.grams * asset.pricePerGram;
    case "Investment":
      return asset.value;
    case "BusinessInventory":
      return asset.value;
  }
};

// Donation frequency
type DonationFrequency =
  | { type: "OneTime" }
  | { type: "Monthly"; dayOfMonth: number }
  | { type: "Quarterly"; month: number; day: number }
  | { type: "Annually"; month: number; day: number };

// Calculate next donation date
const getNextDonationDate = (frequency: DonationFrequency, from: Date): Date => {
  switch (frequency.type) {
    case "OneTime":
      return from;
    case "Monthly":
      return new Date(from.getFullYear(), from.getMonth() + 1, frequency.dayOfMonth);
    case "Quarterly":
      return new Date(from.getFullYear(), from.getMonth() + 3, frequency.day);
    case "Annually":
      return new Date(from.getFullYear() + 1, frequency.month - 1, frequency.day);
  }
};

// React component for asset entry
export const AssetForm: React.FC<{ onAdd: (asset: ZakatAsset) => void }> = ({ onAdd }) => {
  const [assetType, setAssetType] = useState<ZakatAsset["type"]>("Cash");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const asset: ZakatAsset = (() => {
      switch (assetType) {
        case "Cash":
          return {
            type: "Cash",
            amount: Number(formData.get("amount")),
            currency: formData.get("currency") as string,
          };
        case "Gold":
          return {
            type: "Gold",
            grams: Number(formData.get("grams")),
            pricePerGram: Number(formData.get("pricePerGram")),
          };
        case "Silver":
          return {
            type: "Silver",
            grams: Number(formData.get("grams")),
            pricePerGram: Number(formData.get("pricePerGram")),
          };
        case "Investment":
          return {
            type: "Investment",
            value: Number(formData.get("value")),
            currency: formData.get("currency") as string,
          };
        case "BusinessInventory":
          return {
            type: "BusinessInventory",
            value: Number(formData.get("value")),
            currency: formData.get("currency") as string,
          };
      }
    })();

    onAdd(asset);
  };

  return (
    <form onSubmit={handleSubmit}>
      <select value={assetType} onChange={(e) => setAssetType(e.target.value as ZakatAsset["type"])}>
        <option value="Cash">Cash</option>
        <option value="Gold">Gold</option>
        <option value="Silver">Silver</option>
        <option value="Investment">Investment</option>
        <option value="BusinessInventory">Business Inventory</option>
      </select>

      {assetType === "Cash" && (
        <>
          <input name="amount" type="number" placeholder="Amount" required />
          <input name="currency" type="text" placeholder="Currency" required />
        </>
      )}

      {(assetType === "Gold" || assetType === "Silver") && (
        <>
          <input name="grams" type="number" placeholder="Grams" required />
          <input name="pricePerGram" type="number" placeholder="Price per gram" required />
        </>
      )}

      {(assetType === "Investment" || assetType === "BusinessInventory") && (
        <>
          <input name="value" type="number" placeholder="Value" required />
          <input name="currency" type="text" placeholder="Currency" required />
        </>
      )}

      <button type="submit">Add Asset</button>
    </form>
  );
};
```

## Functional React Patterns

### Render Props

```typescript
// Render prop for data fetching
interface DataFetcherProps<T> {
  fetchFn: () => Promise<T>;
  children: (state: { data: T | null; loading: boolean; error: Error | null }) => React.ReactNode;
}

export function DataFetcher<T>({ fetchFn, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchFn()
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [fetchFn]);

  return <>{children({ data, loading, error })}</>;
}

// Usage
export const DonationList: React.FC = () => (
  <DataFetcher fetchFn={() => donationApi.getAll()}>
    {({ data, loading, error }) => {
      if (loading) return <LoadingSpinner />;
      if (error) return <ErrorMessage error={error} />;
      if (!data) return <div>No donations</div>;

      return (
        <ul>
          {data.map((donation) => (
            <li key={donation.id}>{donation.campaignName}</li>
          ))}
        </ul>
      );
    }}
  </DataFetcher>
);
```

### Function as Children

```typescript
// Function as children for flexible rendering
interface ToggleProps {
  children: (on: boolean, toggle: () => void) => React.ReactNode;
}

export const Toggle: React.FC<ToggleProps> = ({ children }) => {
  const [on, setOn] = useState(false);
  const toggle = () => setOn((prev) => !prev);

  return <>{children(on, toggle)}</>;
};

// Usage
export const ExpandableSection: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <Toggle>
    {(expanded, toggle) => (
      <div className="expandable">
        <button onClick={toggle}>
          {title} {expanded ? "▼" : "▶"}
        </button>
        {expanded && <div className="content">{content}</div>}
      </div>
    )}
  </Toggle>
);
```

## OSE Platform Functional Examples

### Zakat Calculation Pipeline

```typescript
// Functional pipeline for zakat calculation
type ZakatInput = {
  assets: ZakatAsset[];
  goldPrice: number;
  silverPrice: number;
  currency: string;
};

type ZakatResult = {
  totalWealth: number;
  nisabThreshold: number;
  isEligible: boolean;
  zakatDue: number;
};

// Pure functions
const calculateTotalWealth = (assets: ZakatAsset[]): number => assets.reduce((sum, asset) => sum + getAssetValue(asset), 0);

const calculateNisab = (goldPrice: number, silverPrice: number): number => {
  const goldNisab = goldPrice * 85; // 85 grams of gold
  const silverNisab = silverPrice * 595; // 595 grams of silver
  return Math.min(goldNisab, silverNisab); // Lower threshold applies
};

const checkEligibility = (wealth: number, nisab: number): boolean => wealth >= nisab;

const calculateZakatAmount = (wealth: number, isEligible: boolean): number => (isEligible ? wealth * 0.025 : 0);

// Compose pipeline
const calculateZakat = (input: ZakatInput): ZakatResult => {
  const totalWealth = calculateTotalWealth(input.assets);
  const nisabThreshold = calculateNisab(input.goldPrice, input.silverPrice);
  const isEligible = checkEligibility(totalWealth, nisabThreshold);
  const zakatDue = calculateZakatAmount(totalWealth, isEligible);

  return {
    totalWealth,
    nisabThreshold,
    isEligible,
    zakatDue,
  };
};

// React hook
export const useZakatCalculation = (input: ZakatInput) => {
  return useMemo(() => calculateZakat(input), [input]);
};

// Component
export const ZakatResultsDisplay: React.FC<{ input: ZakatInput }> = ({ input }) => {
  const result = useZakatCalculation(input);

  return (
    <div className="zakat-results">
      <h3>Zakat Calculation Results</h3>
      <p>Total Wealth: ${result.totalWealth.toFixed(2)}</p>
      <p>Nisab Threshold: ${result.nisabThreshold.toFixed(2)}</p>
      <p>Eligible: {result.isEligible ? "Yes" : "No"}</p>
      {result.isEligible && <p className="zakat-due">Zakat Due: ${result.zakatDue.toFixed(2)}</p>}
    </div>
  );
};
```

### Murabaha Validation Chain

```typescript
// Validation chain for Murabaha application
type ValidationResult<T> = Either<string, T>;

interface MurabahaApplication {
  customerId: string;
  assetDescription: string;
  purchasePrice: number;
  markupPercentage: number;
  installmentCount: number;
}

// Validators
const validateCustomerId = (app: MurabahaApplication): ValidationResult<MurabahaApplication> =>
  app.customerId.length > 0 ? right(app) : left("Customer ID is required");

const validateAssetDescription = (app: MurabahaApplication): ValidationResult<MurabahaApplication> =>
  app.assetDescription.length >= 10 ? right(app) : left("Asset description must be at least 10 characters");

const validatePurchasePrice = (app: MurabahaApplication): ValidationResult<MurabahaApplication> =>
  app.purchasePrice > 0 ? right(app) : left("Purchase price must be positive");

const validateMarkup = (app: MurabahaApplication): ValidationResult<MurabahaApplication> =>
  app.markupPercentage >= 0 && app.markupPercentage <= 0.5
    ? right(app)
    : left("Markup percentage must be between 0% and 50%");

const validateInstallments = (app: MurabahaApplication): ValidationResult<MurabahaApplication> =>
  app.installmentCount >= 1 && app.installmentCount <= 60
    ? right(app)
    : left("Installment count must be between 1 and 60");

// Chain validations
const validateMurabahaApplication = (app: MurabahaApplication): ValidationResult<MurabahaApplication> => {
  const validations = [
    validateCustomerId,
    validateAssetDescription,
    validatePurchasePrice,
    validateMarkup,
    validateInstallments,
  ];

  return validations.reduce(
    (result, validate) => (result._tag === "Right" ? validate(result.right) : result),
    right(app) as ValidationResult<MurabahaApplication>,
  );
};

// React form with validation
export const MurabahaApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState<MurabahaApplication>({
    customerId: "",
    assetDescription: "",
    purchasePrice: 0,
    markupPercentage: 0,
    installmentCount: 12,
  });
  const [validationResult, setValidationResult] = useState<ValidationResult<MurabahaApplication> | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateMurabahaApplication(formData);
    setValidationResult(result);

    if (result._tag === "Right") {
      murabahaApi.submitApplication(result.right);
      toast.success("Application submitted successfully");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.customerId}
        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
        placeholder="Customer ID"
      />

      <textarea
        value={formData.assetDescription}
        onChange={(e) => setFormData({ ...formData, assetDescription: e.target.value })}
        placeholder="Asset Description"
      />

      <input
        type="number"
        value={formData.purchasePrice}
        onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
        placeholder="Purchase Price"
      />

      <input
        type="number"
        value={formData.markupPercentage}
        onChange={(e) => setFormData({ ...formData, markupPercentage: Number(e.target.value) })}
        placeholder="Markup %"
        step="0.01"
      />

      <input
        type="number"
        value={formData.installmentCount}
        onChange={(e) => setFormData({ ...formData, installmentCount: Number(e.target.value) })}
        placeholder="Installments"
      />

      <button type="submit">Submit Application</button>

      {validationResult && validationResult._tag === "Left" && (
        <div className="error">{validationResult.left}</div>
      )}
    </form>
  );
};
```

## Functional Programming Best Practices

### React FP Checklist

- ✅ **Pure components**: No side effects in render
- ✅ **Immutable updates**: Never mutate state or props
- ✅ **Function composition**: Build complex behavior from simple functions
- ✅ **Higher-order functions**: Use map, filter, reduce over loops
- ✅ **Declarative code**: Express WHAT, not HOW
- ✅ **Type safety**: Use TypeScript for compile-time guarantees
- ✅ **Avoid side effects**: Keep side effects in useEffect
- ✅ **Memoization**: Use useMemo/useCallback for expensive computations
- ✅ **Referential transparency**: Same inputs = same outputs
- ✅ **Avoid mutations**: Spread operators for updates
- ✅ **Error handling**: Use Either/Result types for explicit errors
- ✅ **Lazy evaluation**: Use generators for large datasets

## Related Documentation

- **[Idioms](ex-soen-plwe-to-fere__idioms.md)** - Functional patterns
- **[Hooks](ex-soen-plwe-to-fere__hooks.md)** - Hooks as FP abstractions
- **[Component Architecture](ex-soen-plwe-to-fere__component-architecture.md)** - Component patterns
- **[State Management](ex-soen-plwe-to-fere__state-management.md)** - Immutable state
- **[Best Practices](ex-soen-plwe-to-fere__best-practices.md)** - Production standards

---

**Last Updated**: 2026-01-26

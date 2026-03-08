---
title: "Advanced"
weight: 10000003
date: 2026-01-29T16:00:00+07:00
draft: false
description: "Master advanced React with TypeScript through 25 annotated examples covering generics, Zustand, code splitting, Suspense, testing, security, and production patterns"
tags:
  [
    "react",
    "typescript",
    "frontend",
    "tutorial",
    "by-example",
    "advanced",
    "performance",
    "testing",
    "security",
    "deployment",
  ]
---

This advanced tutorial covers production-grade React + TypeScript patterns through 25 heavily annotated examples. Each example maintains 1-2.25 comment lines per code line to ensure deep understanding. You'll master advanced TypeScript patterns, state management with Zustand, performance optimization, concurrent React features, testing strategies, security best practices, and production deployment patterns.

## Prerequisites

Before starting, ensure you understand:

- React fundamentals and intermediate patterns (hooks, Context API, custom hooks)
- TypeScript advanced features (generics, utility types, discriminated unions)
- Asynchronous patterns (Promises, async/await, error handling)
- Performance concepts (memoization, lazy loading, code splitting)
- Testing fundamentals (unit tests, integration tests)

If you need to review, see [Beginner](/en/learn/software-engineering/platform-web/tools/fe-react/by-example/beginner) and [Intermediate](/en/learn/software-engineering/platform-web/tools/fe-react/by-example/intermediate).

## Group 1: Advanced TypeScript Patterns (5 examples)

### Example 1: Generic Components with TypeScript

Generic components work with multiple data types while maintaining type safety. Use type parameters to make components reusable across different data shapes.

```mermaid
graph TD
    A["List<T>\n Generic component"] -->|"T = Donation"| B["List<Donation>\n type-safe"]
    A -->|"T = ZakatPayment"| C["List<ZakatPayment>\n type-safe"]
    A -->|"T = User"| D["List<User>\n type-safe"]
    E["items: T[]\nrenderItem: (T) => ReactNode\nkeyExtractor: (T) => string"] --> A

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#CA9161,stroke:#000,color:#000
```

**Generic component**: Single implementation works with any type T.

```typescript
import { useState } from 'react';

// => Generic interface: T can be any type
interface ListProps<T> {
  items: T[];
  // => items: array of T objects
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

// => Generic component: T inferred from usage
function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
    {/* => Unordered list of items */}
      {items.map((item) => (
        <li key={keyExtractor(item)}>
        {/* => List item with unique key for React reconciliation */}
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

interface Donation {
  id: string;
  // => id: text value field
  amount: number;
  // => amount: numeric value field
  donor: string;
  // => donor: text value field
}

interface ZakatPayment {
  id: string;
  // => id: text value field
  nisab: number;
  // => nisab: numeric value field
  zakatAmount: number;
  // => zakatAmount: numeric value field
  payer: string;
  // => payer: text value field
}

function DonationDashboard() {
  const [donations] = useState<Donation[]>([
    { id: '1', amount: 100, donor: 'Aisha' },
    // => Initial array item object
    { id: '2', amount: 250, donor: 'Omar' },
    // => Initial array item object
  ]);
  // => End of initial state array

  const [zakatPayments] = useState<ZakatPayment[]>([
    { id: '1', nisab: 5000, zakatAmount: 125, payer: 'Fatima' },
    // => Initial array item object
    { id: '2', nisab: 10000, zakatAmount: 250, payer: 'Ali' },
    // => Initial array item object
  ]);
  // => End of initial state array

  return (
    <div>
    {/* => Container div for layout grouping */}
      <h2>Recent Donations</h2>
      {/* => List<Donation>: T inferred from items prop */}
      <List
      {/* => Renders List component */}
        items={donations}
        {/* => items prop: donations */}
        renderItem={(donation) => (
          <span>${donation.amount} from {donation.donor}</span>
        )}
        keyExtractor={(donation) => donation.id}
        {/* => keyExtractor prop: (donation) => donation.id */}
      />

      <h2>Zakat Payments</h2>
      {/* => List<ZakatPayment>: T inferred from items type */}
      <List
      {/* => Renders List component */}
        items={zakatPayments}
        {/* => items prop: zakatPayments */}
        renderItem={(payment) => (
          <span>${payment.zakatAmount} zakat from {payment.payer}</span>
        )}
        keyExtractor={(payment) => payment.id}
        {/* => keyExtractor prop: (payment) => payment.id */}
      />
    </div>
  );
}

export default DonationDashboard;

```

**Key Takeaway**: Generic components with type parameters enable type-safe reusability. TypeScript infers the type parameter from usage, ensuring type safety without explicit type annotations.

**Why It Matters**: Generic components are the cornerstone of reusable component libraries. Without generics, a List component must accept `any[]` (losing type safety) or be written multiple times for different data types. Production component libraries - data tables, autocompletes, select inputs, virtual lists - all use generic components to work with any data shape while preserving full TypeScript type inference. When you see TypeScript's `T extends object` or `<T>` in production React code, you're seeing this pattern. Generic components are the difference between a component that works only with specific data and one that becomes a reusable building block across the entire application.

### Example 2: Utility Types in React (Partial, Pick, Omit, Record)

TypeScript utility types transform existing types for different use cases. Use them to derive props types, create form types, and manage component variants.

```typescript
import { useState } from 'react';

// => Base donation interface with all fields
interface Donation {
  id: string;                                // => Unique identifier (required)
  amount: number;                            // => Donation amount (required)
  donor: string;                             // => Donor name (required)
  email: string;                             // => Donor email (required)
  isAnonymous: boolean;                      // => Anonymous flag (required)
  createdAt: Date;                           // => Timestamp (required)
}

// => Partial<T>: all properties optional (for updates)
type DonationUpdate = Partial<Donation>;

// => Pick<T, K>: select specific properties
type DonationFormData = Pick<Donation, 'amount' | 'donor' | 'email' | 'isAnonymous'>;

// => Omit<T, K>: exclude specific properties
type DonationDisplay = Omit<Donation, 'email'>;

// => Record<K, T>: object with keys K and values T
type DonationsByCategory = Record<'general' | 'zakat' | 'sadaqah', Donation[]>;

function DonationForm() {
  const [formData, setFormData] = useState<DonationFormData>({
    amount: 0,
    donor: '',
    email: '',
    isAnonymous: false,
  });

  // => Partial update: only changed fields needed
  const updateField = (update: Partial<DonationFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...update,
    }));
  };

  const handleSubmit = () => {
    console.log('Submitting:', formData);
    // => Backend generates id and createdAt
  };

  return (
    <div>
    {/* => Container div for layout grouping */}
      <h2>Make a Donation</h2>
      {/* => H2: "Make a Donation" section heading */}

      <label>
      {/* => Label element for form input */}
        Amount: $
        <input
          type="number"
          {/* => Input type: "number" */}
          value={formData.amount}
          {/* => value: controlled by state (state → UI sync) */}
          onChange={(e) => updateField({ amount: parseFloat(e.target.value) })}
          {/* => onChange: fires on every keystroke/change */}
        />
      </label>

      <label>
      {/* => Label element for form input */}
        Name:
        <input
          type="text"
          {/* => Input type: "text" */}
          value={formData.donor}
          {/* => value: controlled by state (state → UI sync) */}
          onChange={(e) => updateField({ donor: e.target.value })}
          {/* => onChange: fires on every keystroke/change */}
        />
      </label>

      <label>
      {/* => Label element for form input */}
        Email:
        <input
          type="email"
          {/* => Input type: "email" */}
          value={formData.email}
          {/* => value: controlled by state (state → UI sync) */}
          onChange={(e) => updateField({ email: e.target.value })}
          {/* => onChange: fires on every keystroke/change */}
        />
      </label>

      <label>
      {/* => Label element for form input */}
        <input
          type="checkbox"
          {/* => Checkbox type */}
          checked={formData.isAnonymous}
          {/* => checked: boolean state → checkbox UI state */}
          onChange={(e) => updateField({ isAnonymous: e.target.checked })}
          {/* => onChange: fires on every keystroke/change */}
        />
        Donate anonymously
      </label>

      <button onClick={handleSubmit}>Submit Donation</button>
      {/* => Button "Submit Donation" - triggers onClick handler */}
    </div>
  );
}

// => Record ensures all category keys present
function DonationCategoryView() {
  const [donations] = useState<DonationsByCategory>({
    general: [],
    zakat: [],
    sadaqah: [],
  });
  // => TypeScript errors if keys missing or wrong value type

  return (
    <div>
    {/* => Container div for layout grouping */}
      <h3>General Donations: {donations.general.length}</h3>
      {/* => H3: "General Donations: {donations.general.length}" section heading */}
      <h3>Zakat Payments: {donations.zakat.length}</h3>
      {/* => H3: "Zakat Payments: {donations.zakat.length}" section heading */}
      <h3>Sadaqah: {donations.sadaqah.length}</h3>
      {/* => H3: "Sadaqah: {donations.sadaqah.length}" section heading */}
    </div>
  );
}

export default DonationForm;

```

**Key Takeaway**: TypeScript utility types (Partial, Pick, Omit, Record) derive new types from existing types, reducing duplication and ensuring consistency. Use Pick for forms, Partial for updates, Omit for display types, and Record for key-value mappings.

**Why It Matters**: Utility types transform existing interfaces rather than duplicating them, keeping TypeScript code DRY and changes propagating correctly. In production React applications: form edit components use `Partial<T>` (all fields optional while editing), component summaries use `Pick<T, 'name' | 'id'>` (minimal data transfer), update functions use `Omit<T, 'id' | 'createdAt'>` (prevent modifying immutable fields). These patterns appear constantly in API design - create payloads omit server-set fields, update payloads use partial types. TypeScript utility types bridge the gap between your domain models and your component prop requirements without duplication.

### Example 3: Discriminated Unions for State

Discriminated unions model mutually exclusive states with type safety. Use a common discriminant property (like `status` or `type`) to distinguish between states.

```mermaid
stateDiagram-v2
    [*] --> Idle: initial
    Idle --> Loading: fetch()
    Loading --> Success: onSuccess
    Loading --> Error: onError
    Success --> Loading: refetch()
    Error --> Loading: retry()

    note right of Loading: impossible to be\nboth Loading AND Error
    note right of Success: data always valid\nwhen in Success
```

**Discriminated union**: Type system enforces mutually exclusive states.

```typescript
import { useState } from 'react';

// => Discriminated union: exactly one state at a time
// => Each variant has unique 'status' discriminant
type AsyncState<T> =
  | { status: 'idle' }                       // => Initial state, no data
  | { status: 'loading' }                    // => Request in progress
  | { status: 'success'; data: T }           // => Request succeeded, data available
  | { status: 'error'; error: string };      // => Request failed, error message available

// => Domain interface
interface ZakatCalculation {
  wealth: number;                            // => Total wealth
  nisab: number;                             // => Nisab threshold
  isZakatDue: boolean;                       // => Whether zakat is due
  zakatAmount: number;                       // => 2.5% of excess wealth
}

function ZakatCalculator() {
  // => State can be exactly one variant at a time
  // => TypeScript ensures only valid states exist
  const [calcState, setCalcState] = useState<AsyncState<ZakatCalculation>>({
    status: 'idle',                          // => Initial state
  });
  // => No data or error when idle

  const [wealth, setWealth] = useState<number>(0);

  const calculateZakat = async () => {
    // => Transition to loading state
    setCalcState({ status: 'loading' });
    // => No data or error in loading state

    try {
      // => Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // => Calculate zakat (2.5% of wealth exceeding nisab)
      const nisab = 5000;                    // => Nisab threshold in dollars
      const isZakatDue = wealth >= nisab;    // => Zakat due if wealth >= nisab
      const zakatAmount = isZakatDue
        ? (wealth - nisab) * 0.025           // => 2.5% of excess wealth
        : 0;                                 // => No zakat if below nisab

      // => Transition to success state with data
      setCalcState({
        status: 'success',
        data: {
          wealth,
          nisab,
          isZakatDue,
          zakatAmount,
        },
      });
      // => data property only exists in success state
    } catch (err) {
      // => Transition to error state with error message
      setCalcState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Calculation failed',
      });
      // => error property only exists in error state
    }
  };

  // => Render different UI based on discriminant (status)
  // => TypeScript narrows type based on status check
  return (
    <div>
    {/* => Container div for layout grouping */}
      <h2>Zakat Calculator</h2>
      {/* => H2: "Zakat Calculator" section heading */}

      <label>
      {/* => Label element for form input */}
        Total Wealth: $
        <input
          type="number"
          {/* => Input type: "number" */}
          value={wealth}
          {/* => value: controlled by state (state → UI sync) */}
          onChange={(e) => setWealth(parseFloat(e.target.value) || 0)}
          {/* => onChange: fires on every keystroke/change */}
        />
      </label>

      <button onClick={calculateZakat} disabled={calcState.status === 'loading'}>
      {/* => Button: triggers click handler */}
        {calcState.status === 'loading' ? 'Calculating...' : 'Calculate Zakat'}
        {/* => Ternary: renders different UI based on condition */}
      </button>

      {/* => TypeScript narrows calcState type in each branch */}
      {calcState.status === 'idle' && (
        <p>Enter your wealth to calculate zakat</p>
        {/* => Paragraph: "Enter your wealth to calculate zakat" */}
      )}

      {calcState.status === 'loading' && (
        // => calcState is { status: 'loading' } here
        // => No data or error properties available
        <p>Calculating zakat amount...</p>
        {/* => Paragraph: "Calculating zakat amount..." */}
      )}

      {calcState.status === 'success' && (
        // => calcState is { status: 'success'; data: ZakatCalculation } here
        // => TypeScript knows data property exists
        <div>
        {/* => Container div for layout grouping */}
          <h3>Calculation Result</h3>
          {/* => H3: "Calculation Result" section heading */}
          <p>Wealth: ${calcState.data.wealth}</p>
          {/* => Paragraph with content */}
          <p>Nisab Threshold: ${calcState.data.nisab}</p>
          {/* => TypeScript autocompletes data properties */}

          {calcState.data.isZakatDue ? (
          {/* => True branch: rendered when condition is true */}
            <p style={{ color: 'green' }}>
              ✓ Zakat is due: ${calcState.data.zakatAmount.toFixed(2)}
            </p>
          ) : (
          {/* => False branch: rendered when condition is false */}
            <p style={{ color: 'gray' }}>
              Wealth below nisab - no zakat due
            </p>
          )}
        </div>
      )}

      {calcState.status === 'error' && (
        // => calcState is { status: 'error'; error: string } here
        // => TypeScript knows error property exists
        <p style={{ color: 'red' }}>
          Error: {calcState.error}
          {/* => TypeScript autocompletes error property */}
        </p>
      )}
    </div>
  );
}

export default ZakatCalculator;

```

**Key Takeaway**: Discriminated unions ensure mutually exclusive states with compile-time safety. TypeScript narrows the union type based on discriminant checks, preventing impossible states like "loading with data" or "success without data".

**Why It Matters**: Discriminated unions make impossible states impossible to represent in TypeScript. Production React applications have UI that must handle multiple exclusive states: loading or error or data (never loading AND data), not-started or pending or approved or rejected (never pending AND approved). Representing these as separate boolean flags allows contradictory states. Discriminated unions enforce that only valid combinations exist at the type level. The `status` field as the discriminant means TypeScript narrows the type automatically in switch/case blocks, ensuring your render logic handles every case and fails to compile if you add a new status without updating all consumers.

### Example 4: Advanced Type Guards

Type guards narrow union types at runtime, enabling safe access to type-specific properties. Use `typeof`, `instanceof`, and custom type predicates.

```typescript
import { ReactNode } from 'react';

interface DonationTransaction {
  type: 'donation';                          // => Discriminant property
  amount: number;
  // => amount: numeric value field
  donor: string;
  // => donor: text value field
  isAnonymous: boolean;
  // => isAnonymous: true/false flag field
}

interface ZakatTransaction {
  type: 'zakat';
  wealth: number;
  // => wealth: numeric value field
  nisab: number;
  // => nisab: numeric value field
  zakatAmount: number;
  // => zakatAmount: numeric value field
}

interface RefundTransaction {
  type: 'refund';
  originalAmount: number;
  // => originalAmount: numeric value field
  reason: string;
  // => reason: text value field
  refundDate: Date;
  // => refundDate: date/time value field
}

type Transaction = DonationTransaction | ZakatTransaction | RefundTransaction;

// => Type predicate: narrows union type
function isDonation(transaction: Transaction): transaction is DonationTransaction {
  return transaction.type === 'donation';
}

function isZakat(transaction: Transaction): transaction is ZakatTransaction {
  return transaction.type === 'zakat';
}

function isRefund(transaction: Transaction): transaction is RefundTransaction {
  return transaction.type === 'refund';
}

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  if (isDonation(transaction)) {
    // => transaction narrowed to DonationTransaction
    return (
      <div className="transaction donation">
        <h4>Donation</h4>
        {/* => H4: "Donation" section heading */}
        <p>Amount: ${transaction.amount}</p>
        {/* => Paragraph with content */}
        <p>Donor: {transaction.isAnonymous ? 'Anonymous' : transaction.donor}</p>
        {/* => Paragraph with content */}
      </div>
    );
  }

  if (isZakat(transaction)) {
    // => transaction narrowed to ZakatTransaction
    return (
      <div className="transaction zakat">
        <h4>Zakat Payment</h4>
        {/* => H4: "Zakat Payment" section heading */}
        <p>Wealth: ${transaction.wealth}</p>
        {/* => Paragraph with content */}
        <p>Nisab: ${transaction.nisab}</p>
        {/* => Paragraph with content */}
        <p>Zakat Due: ${transaction.zakatAmount}</p>
        {/* => Paragraph with content */}
      </div>
    );
  }

  if (isRefund(transaction)) {
    // => transaction narrowed to RefundTransaction
    return (
      <div className="transaction refund">
        <h4>Refund</h4>
        {/* => H4: "Refund" section heading */}
        <p>Amount: ${transaction.originalAmount}</p>
        {/* => Paragraph with content */}
        <p>Reason: {transaction.reason}</p>
        {/* => Paragraph with content */}
        <p>Date: {transaction.refundDate.toLocaleDateString()}</p>
        {/* => Paragraph with content */}
      </div>
    );
  }

  // => Exhaustiveness check: ensures all union members handled
  const _exhaustive: never = transaction;
  return null;
}

function TransactionList() {
  const transactions: Transaction[] = [
    {
      type: 'donation',
      amount: 100,
      donor: 'Aisha',
      isAnonymous: false,
    },
    {
      type: 'zakat',
      wealth: 10000,
      nisab: 5000,
      zakatAmount: 125,
    },
    {
      type: 'refund',
      originalAmount: 50,
      reason: 'Duplicate payment',
      refundDate: new Date('2026-01-15'),
    },
  ];

  return (
    <div>
    {/* => Container div for layout grouping */}
      <h2>Transaction History</h2>
      {/* => H2: "Transaction History" section heading */}
      {transactions.map((transaction, index) => (
        <TransactionItem key={index} transaction={transaction} />
        {/* => TransactionItem component (self-contained) */}
      ))}
    </div>
  );
}

export default TransactionList;

```

**Key Takeaway**: Type guard functions with type predicates (`value is Type`) narrow union types, enabling safe access to type-specific properties. Use discriminated unions with type guards for complex domain modeling with compile-time safety.

**Why It Matters**: Type guards enable TypeScript to understand runtime type distinctions at the point of use. In production React applications, APIs often return polymorphic data: a feed item can be a post, comment, or share - each with different fields and rendering requirements. Without type guards, you must use `any` or cast types, losing safety. With type guards, TypeScript knows which variant you have inside each branch, preventing accessing fields that don't exist on all variants. The `is` return type annotation (`param is SpecificType`) creates a reusable guard that works everywhere, not just at the definition point.

### Example 5: Template Literal Types for Props

Template literal types create string literal types from patterns, enabling precise string prop validation. Use for CSS classes, event names, and status strings.

```typescript
import { CSSProperties, useState } from 'react';

// => Template literal type: combines literal strings
// => Generates all possible combinations
type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded';
type DonationPriority = 'low' | 'normal' | 'high';

// => Template literal type for CSS class names
// => Creates: 'donation-status-pending', 'donation-status-completed', etc.
type DonationStatusClass = `donation-status-${DonationStatus}`;

// => Template literal type for combined status and priority
// => Creates: 'pending-low', 'pending-normal', 'pending-high', 'completed-low', etc.
type DonationStateKey = `${DonationStatus}-${DonationPriority}`;

// => Template literal type for event handler prop names
// => Creates: 'onStatusPending', 'onStatusCompleted', 'onStatusFailed', 'onStatusRefunded'
type StatusEventHandler = `onStatus${Capitalize<DonationStatus>}`;

// => Props interface using template literal types
interface DonationCardProps {
  status: DonationStatus;                    // => One of four valid statuses
  priority: DonationPriority;                // => One of three priorities
  amount: number;                            // => Donation amount
  className?: DonationStatusClass;           // => CSS class must match pattern
  onStatusPending?: () => void;              // => Event handler for pending status
  onStatusCompleted?: () => void;            // => Event handler for completed status
  onStatusFailed?: () => void;               // => Event handler for failed status
  onStatusRefunded?: () => void;             // => Event handler for refunded status
}

function DonationCard({
  status,
  priority,
  amount,
  className,
  onStatusPending,
  onStatusCompleted,
  onStatusFailed,
  onStatusRefunded,
}: DonationCardProps) {
  // => Get status-specific color
  // => Object keys are DonationStatus literals
  const statusColors: Record<DonationStatus, string> = {
    pending: '#FFA500',                      // => Orange for pending
    completed: '#28A745',                    // => Green for completed
    failed: '#DC3545',                       // => Red for failed
    refunded: '#6C757D',                     // => Gray for refunded
  };

  // => Get priority badge
  const priorityLabels: Record<DonationPriority, string> = {
    low: '⬇️ Low',
    normal: '➡️ Normal',
    high: '⬆️ High',
  };

  // => Handle status-specific actions
  const handleAction = () => {
    // => Call appropriate event handler based on status
    if (status === 'pending' && onStatusPending) {
      onStatusPending();                     // => Call pending handler
    } else if (status === 'completed' && onStatusCompleted) {
      onStatusCompleted();                   // => Call completed handler
    } else if (status === 'failed' && onStatusFailed) {
      onStatusFailed();                      // => Call failed handler
    } else if (status === 'refunded' && onStatusRefunded) {
      onStatusRefunded();                    // => Call refunded handler
    }
  };

  // => Card style based on status
  const cardStyle: CSSProperties = {
    border: `2px solid ${statusColors[status]}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#FFFFFF',
  };

  return (
    <div className={className} style={cardStyle}>
      {/* => Display status badge with color */}
      <div
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: statusColors[status],
          color: '#FFFFFF',
          fontWeight: 'bold',
          marginRight: '8px',
        }}
      >
        {status.toUpperCase()}
      </div>

      {/* => Display priority badge */}
      <div style={{ display: 'inline-block' }}>
      {/* => Container div with inline styles */}
        {priorityLabels[priority]}
      </div>

      {/* => Display amount */}
      <div style={{ marginTop: '12px', fontSize: '24px', fontWeight: 'bold' }}>
      {/* => Container div with inline styles */}
        ${amount}
      </div>

      {/* => Action button (only for non-completed status) */}
      {status !== 'completed' && (
        <button
          onClick={handleAction}
          {/* => onClick: fires on user click */}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: statusColors[status],
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          Handle {status}
        </button>
      )}
    </div>
  );
}

function DonationDashboard() {
  const [donations, setDonations] = useState([
    { id: 1, status: 'pending' as DonationStatus, priority: 'high' as DonationPriority, amount: 100 },
    // => Initial array item object
    { id: 2, status: 'completed' as DonationStatus, priority: 'normal' as DonationPriority, amount: 250 },
    // => Initial array item object
    { id: 3, status: 'failed' as DonationStatus, priority: 'low' as DonationPriority, amount: 75 },
    // => Initial array item object
  ]);
  // => End of initial state array

  return (
    <div>
    {/* => Container div for layout grouping */}
      <h2>Donation Dashboard</h2>
      {/* => H2: "Donation Dashboard" section heading */}

      {donations.map((donation) => (
        <DonationCard
        {/* => Renders DonationCard component */}
          key={donation.id}
          status={donation.status}
          {/* => status prop: donation.status */}
          priority={donation.priority}
          {/* => priority prop: donation.priority */}
          amount={donation.amount}
          {/* => amount prop: donation.amount */}
          className={`donation-status-${donation.status}` as DonationStatusClass}
          // => TypeScript validates className matches template pattern
          onStatusPending={() => console.log('Pending donation clicked')}
          {/* => onStatusPending prop: () => console.log('Pending donation clic */}
          onStatusCompleted={() => console.log('Completed donation clicked')}
          {/* => onStatusCompleted prop: () => console.log('Completed donation cl */}
          onStatusFailed={() => console.log('Failed donation clicked')}
          {/* => onStatusFailed prop: () => console.log('Failed donation click */}
          onStatusRefunded={() => console.log('Refunded donation clicked')}
          {/* => onStatusRefunded prop: () => console.log('Refunded donation cli */}
        />
      ))}
    </div>
  );
}

export default DonationDashboard;

```

**Key Takeaway**: Template literal types create precise string types from patterns, enabling compile-time validation of CSS classes, event names, and status strings. Combine with Record types for exhaustive mapping and with Capitalize/Uppercase utilities for naming conventions.

**Why It Matters**: Template literal types create exhaustive, type-safe systems for prop values that combine multiple dimensions (size + variant, color + intensity, direction + alignment). Production design systems use this pattern to generate all valid CSS class name combinations from component props, ensuring only valid combinations can be passed. The key production benefit is that adding a new dimension (a new size, a new variant) requires updating the union type, which TypeScript uses to find every component that needs to handle the new option. This catches omissions at compile time rather than at runtime when users encounter incomplete behavior.

## Group 2: Advanced State Management with Zustand (5 examples)

**Why Zustand instead of Context API + useReducer?** Context API with `useReducer` works well for low-frequency updates like auth state or themes, but has a critical performance issue: any component consuming a context re-renders whenever any value in that context changes, even if it only needs one slice of state. For high-frequency state (shopping carts, real-time data, complex forms), this causes excessive re-renders across the component tree. Zustand stores are subscription-based: components subscribe to specific state slices and only re-render when those slices change. Zustand also eliminates the Provider wrapper boilerplate, allows stores to be imported anywhere (including outside components), and supports middleware for persistence and DevTools. Use Context API for infrequently-updated values; use Zustand for shared state that updates frequently.

**Note**: Examples 6-9 require `zustand` package. Example 10 additionally requires `xstate` and `@xstate/react` packages. Install with:

```bash
npm install zustand xstate @xstate/react
```

### Example 6: Zustand Store Setup

Zustand provides lightweight global state management without boilerplate. Create stores with TypeScript for type-safe state access.

```mermaid
graph TD
    A["useDonationStore\n Zustand store"] --> B["donations: []\ntotalAmount: 0\nisLoading: false"]
    A --> C["addDonation(amount, donor)"]
    A --> D["removeDonation(id)"]
    A --> E["clearDonations()"]
    F["ComponentA\nuseStore(s => s.donations)"] -->|"subscribes to donations slice"| A
    G["ComponentB\nuseStore(s => s.totalAmount)"] -->|"subscribes to totalAmount only"| A
    C -->|"set(state => ...)"| B
    D -->|"set(state => ...)"| B

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#DE8F05,stroke:#000,color:#000
    style E fill:#DE8F05,stroke:#000,color:#000
    style F fill:#CC78BC,stroke:#000,color:#000
    style G fill:#CA9161,stroke:#000,color:#000
```

**Zustand store**: Slice subscriptions prevent re-renders from unrelated state changes.

```typescript
// store.ts
import { create } from 'zustand';

// => State interface defines store shape
interface DonationState {
  // => State properties
  donations: Array<{
    id: string;
    amount: number;
    donor: string;
    timestamp: Date;
  }>;
  totalAmount: number;                       // => Derived state (sum of all donations)
  isLoading: boolean;                        // => Loading flag for async operations

  // => Actions (functions to modify state)
  addDonation: (amount: number, donor: string) => void;
  removeDonation: (id: string) => void;
  clearDonations: () => void;
  setLoading: (loading: boolean) => void;
}

// => Create Zustand store with type parameter
// => create<T> ensures store matches interface T
export const useDonationStore = create<DonationState>((set, get) => ({
  // => Initial state
  donations: [],                             // => Empty array initially
  totalAmount: 0,                            // => Zero total initially
  isLoading: false,                          // => Not loading initially

  // => Action: add new donation
  // => set() updates state immutably
  addDonation: (amount, donor) => {
    const newDonation = {
      id: Date.now().toString(),             // => Generate unique ID
      amount,
      donor,
      timestamp: new Date(),                 // => Current timestamp
    };

    set((state) => ({
      // => Create new state object
      // => Never mutate state directly
      donations: [...state.donations, newDonation],
      // => Spread existing donations, append new one
      totalAmount: state.totalAmount + amount,
      // => Update total by adding new amount
    }));
  },

  // => Action: remove donation by ID
  removeDonation: (id) => {
    set((state) => {
      // => Find donation to remove
      const donation = state.donations.find((d) => d.id === id);
      if (!donation) return state;           // => Return unchanged state if not found

      return {
        donations: state.donations.filter((d) => d.id !== id),
        // => Filter out donation with matching ID
        totalAmount: state.totalAmount - donation.amount,
        // => Subtract removed donation amount
      };
    });
  },

  // => Action: clear all donations
  clearDonations: () => {
    set({
      donations: [],                         // => Reset to empty array
      totalAmount: 0,                        // => Reset total to zero
    });
  },

  // => Action: set loading state
  setLoading: (loading) => {
    set({ isLoading: loading });             // => Update single property
  },
}));

// Component.tsx
import { useDonationStore } from './store';

function DonationTracker() {
  // => Subscribe to store state
  // => Component re-renders when selected state changes
  const donations = useDonationStore((state) => state.donations);
  const totalAmount = useDonationStore((state) => state.totalAmount);
  const addDonation = useDonationStore((state) => state.addDonation);
  const removeDonation = useDonationStore((state) => state.removeDonation);
  const clearDonations = useDonationStore((state) => state.clearDonations);
  // => Select specific slices - component only re-renders when these change

  const handleQuickDonate = (amount: number) => {
    // => Call store action directly
    addDonation(amount, 'Anonymous');        // => Updates global state
    // => All components subscribed to donations re-render
  };

  return (
    <div>
      <h2>Donation Tracker</h2>

      {/* => Display total from global state */}
      <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
        Total: ${totalAmount}
      </div>

      {/* => Quick donate buttons */}
      <div>
        <button onClick={() => handleQuickDonate(10)}>Donate \$10</button>
        <button onClick={() => handleQuickDonate(25)}>Donate \$25</button>
        <button onClick={() => handleQuickDonate(50)}>Donate \$50</button>
        <button onClick={() => clearDonations()}>Clear All</button>
      </div>

      {/* => Display donations from global state */}
      <ul>
        {donations.map((donation) => (
          <li key={donation.id}>
            ${donation.amount} from {donation.donor}
            {' - '}
            {donation.timestamp.toLocaleTimeString()}
            {' '}
            <button onClick={() => removeDonation(donation.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DonationTracker;
```

**Key Takeaway**: Zustand provides lightweight global state with minimal boilerplate. Define state interface, create store with actions, subscribe to slices in components. Components automatically re-render when selected state changes.

**Why It Matters**: Zustand store setup is the foundation for global state management in production React applications that need shared state without Context API's performance limitations. The TypeScript interface approach to defining store shape (state + actions together) makes the store's API explicit and type-safe. Production Zustand stores manage: authentication state accessible from hooks and API middleware, shopping cart contents shared across cart icon and checkout page, user preferences applied to multiple components, and real-time connection state. The ergonomics of Zustand - no providers, direct import, hooks-based access - make it significantly simpler to adopt incrementally than Redux.

### Example 7: Zustand with TypeScript and Slices

Slices organize large stores into logical modules. Combine slices for separation of concerns while maintaining single store.

```mermaid
graph TD
    A["useAuthStore slice\nuser, isAuthenticated\nlogin(), logout()"] --> Z["Combined store\nRootState"]
    B["useCartSlice\ncart[], total\naddItem(), removeItem()"] --> Z
    C["ComponentA\nuseStore(s => s.user)"] -->|"subscribes to user"| A
    D["ComponentB\nuseStore(s => s.cart)"| ]-->|"subscribes to cart"| B
    E["login() fires"] -->|"updates auth slice only"| A
    E -->|"ComponentB NOT re-rendered"| D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style Z fill:#029E73,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#000
    style D fill:#CA9161,stroke:#000,color:#000
    style E fill:#0173B2,stroke:#000,color:#fff
```

**Zustand slices**: Separate domains, selective subscriptions prevent cross-slice re-renders.

```typescript
// donationSlice.ts
import { StateCreator } from 'zustand';
// => StateCreator: Zustand type for slice creators

// => Donation slice interface
export interface DonationSlice {
  donations: Array<{
    id: string;
    amount: number;
    donor: string;
  }>;
  donationTotal: number;                     // => Total donation amount
  addDonation: (amount: number, donor: string) => void;
  removeDonation: (id: string) => void;
}

// => Slice creator with StateCreator typing
// => First generic: combined store type
// => Last generic: this slice's type
export const createDonationSlice: StateCreator<
  DonationSlice & ZakatSlice,
  [],
  [],
  DonationSlice
> = (set) => ({
  // => set: Zustand function to update state
  donations: [],
  // => donations: empty array initially
  donationTotal: 0,
  // => donationTotal: 0 initially

  addDonation: (amount, donor) => {
    set((state) => ({
      // => state: current store state (all slices)
      donations: [
        ...state.donations,
        { id: Date.now().toString(), amount, donor },
        // => id: timestamp ensures uniqueness
      ],
      donationTotal: state.donationTotal + amount,
      // => Add amount to running total
    }));
  },

  removeDonation: (id) => {
    set((state) => {
      const donation = state.donations.find((d) => d.id === id);
      // => Find donation to calculate total adjustment
      if (!donation) return state;
      // => No change if donation not found

      return {
        donations: state.donations.filter((d) => d.id !== id),
        // => Remove donation from array
        donationTotal: state.donationTotal - donation.amount,
        // => Subtract amount from total
      };
    });
  },
});

// zakatSlice.ts
import { StateCreator } from 'zustand';

// => Zakat slice interface
export interface ZakatSlice {
  zakatPayments: Array<{
    id: string;
    wealth: number;
    zakatAmount: number;
    payer: string;
  }>;
  zakatTotal: number;                        // => Total zakat collected
  addZakatPayment: (wealth: number, zakatAmount: number, payer: string) => void;
  removeZakatPayment: (id: string) => void;
}

// => Zakat slice creator (same pattern as donation)
export const createZakatSlice: StateCreator<
  DonationSlice & ZakatSlice,
  [],
  [],
  ZakatSlice
> = (set) => ({
  zakatPayments: [],
  // => zakatPayments: empty array initially
  zakatTotal: 0,
  // => zakatTotal: 0 initially

  addZakatPayment: (wealth, zakatAmount, payer) => {
    set((state) => ({
      zakatPayments: [
        ...state.zakatPayments,
        { id: Date.now().toString(), wealth, zakatAmount, payer },
        // => Create new payment with timestamp id
      ],
      zakatTotal: state.zakatTotal + zakatAmount,
      // => Add zakatAmount to running total
    }));
  },

  removeZakatPayment: (id) => {
    set((state) => {
      const payment = state.zakatPayments.find((p) => p.id === id);
      // => Find payment to calculate total adjustment
      if (!payment) return state;
      // => No change if payment not found

      return {
        zakatPayments: state.zakatPayments.filter((p) => p.id !== id),
        // => Remove payment from array
        zakatTotal: state.zakatTotal - payment.zakatAmount,
        // => Subtract zakatAmount from total
      };
    });
  },
});

// store.ts
import { create } from 'zustand';
// => create: Zustand store factory function
import { DonationSlice, createDonationSlice } from './donationSlice';
import { ZakatSlice, createZakatSlice } from './zakatSlice';

// => Combined store type: intersection of both slices
type FinancialStore = DonationSlice & ZakatSlice;

// => Create store with both slices merged
// => (...a): Zustand's set, get, api parameters
export const useFinancialStore = create<FinancialStore>()((...a) => ({
  ...createDonationSlice(...a),
  // => Spreads donation state and actions into store
  ...createZakatSlice(...a),
  // => Spreads zakat state and actions into store
}));
// => Result: single hook accessing all state/actions

// Component.tsx
import { useFinancialStore } from './store';

function FinancialDashboard() {
  // => Select donation slice state with selector functions
  const donations = useFinancialStore((state) => state.donations);
  // => donations: reactive, updates on donation changes
  const donationTotal = useFinancialStore((state) => state.donationTotal);
  // => donationTotal: reactive, updates on total changes
  const addDonation = useFinancialStore((state) => state.addDonation);
  // => addDonation: stable function reference

  // => Select zakat slice state
  const zakatPayments = useFinancialStore((state) => state.zakatPayments);
  // => zakatPayments: reactive, updates on payment changes
  const zakatTotal = useFinancialStore((state) => state.zakatTotal);
  // => zakatTotal: reactive, updates on total changes
  const addZakatPayment = useFinancialStore((state) => state.addZakatPayment);
  // => addZakatPayment: stable function reference

  // => Derived state: computed from both slices
  const grandTotal = donationTotal + zakatTotal;
  // => grandTotal: recalculates when either total changes

  return (
    <div>
      <h2>Financial Dashboard</h2>

      {/* => Grand total from both slices */}
      <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
        Grand Total: ${grandTotal}
      </div>

      {/* => Donation section */}
      <div>
        <h3>Donations: ${donationTotal}</h3>
        <button onClick={() => addDonation(100, 'Aisha')}>
          Add \$100 Donation
        </button>
        <ul>
          {donations.map((d) => (
            <li key={d.id}>
              ${d.amount} from {d.donor}
            </li>
          ))}
        </ul>
      </div>

      {/* => Zakat section */}
      <div>
        <h3>Zakat: ${zakatTotal}</h3>
        <button onClick={() => addZakatPayment(10000, 125, 'Omar')}>
          Add \$125 Zakat Payment
        </button>
        <ul>
          {zakatPayments.map((p) => (
            <li key={p.id}>
              ${p.zakatAmount} from {p.payer} (wealth: ${p.wealth})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FinancialDashboard;
```

**Key Takeaway**: Organize large Zustand stores into slices for separation of concerns. Each slice defines its own state and actions. Combine slices into single store with proper TypeScript typing. Components select from any slice seamlessly.

**Why It Matters**: Zustand slices enable the same architectural benefit as Redux's combineReducers: domain separation within a single store. Large production applications have tens of state domains (user, cart, catalog, notifications, settings) that shouldn't be mixed in a single large object. Slices allow each domain to be defined, tested, and maintained independently while sharing the same store instance. The TypeScript intersection type approach (`SliceA & SliceB`) provides type-safe access to the combined state. This architecture scales to teams where different developers own different state domains without merge conflicts.

### Example 8: Zustand Middleware (Persist, Devtools)

Zustand middleware enhances stores with persistence, devtools integration, and logging. Chain middleware for powerful debugging and state management.

```typescript
import { create } from 'zustand';
// => create: Zustand store factory
import { persist, createJSONStorage } from 'zustand/middleware';
// => persist: saves state to storage
// => createJSONStorage: configures localStorage/sessionStorage
import { devtools } from 'zustand/middleware';
// => devtools: integrates with Redux DevTools

// => State interface
interface DonationState {
  donations: Array<{
    id: string;
    amount: number;
    donor: string;
    timestamp: string;                       // => String for JSON serialization
  }>;
  totalAmount: number;
  addDonation: (amount: number, donor: string) => void;
  removeDonation: (id: string) => void;
  clearDonations: () => void;
}

// => Middleware chain: devtools wraps persist wraps store
// => Execution order: devtools() → persist() → store
export const useDonationStore = create<DonationState>()(
  devtools(
    // => devtools: Redux DevTools integration
    // => Enables time-travel debugging
    persist(
      // => persist: localStorage persistence
      // => Auto-rehydrates state on mount
      (set) => ({
        // => set: Zustand state updater function
        donations: [],
        // => donations: [] initially (or rehydrated from localStorage)
        totalAmount: 0,
        // => totalAmount: 0 initially (or rehydrated)

        // => Add donation action
        addDonation: (amount, donor) => {
          set(
            (state) => {
              // => state: current store state
              const newDonation = {
                id: Date.now().toString(),
                // => id: timestamp string (unique)
                amount,
                donor,
                timestamp: new Date().toISOString(),
                // => ISO string: JSON-serializable for localStorage
              };

              return {
                donations: [...state.donations, newDonation],
                // => Immutable array update
                totalAmount: state.totalAmount + amount,
                // => Add to running total
              };
            },
            false,
            // => false: merge state (don't replace entirely)
            'donation/add'
            // => Action name visible in Redux DevTools
          );
        },

        // => Remove donation action
        removeDonation: (id) => {
          set(
            (state) => {
              const donation = state.donations.find((d) => d.id === id);
              // => Find donation to calculate total adjustment
              if (!donation) return state;
              // => No change if not found

              return {
                donations: state.donations.filter((d) => d.id !== id),
                // => Remove from array
                totalAmount: state.totalAmount - donation.amount,
                // => Subtract from total
              };
            },
            false,
            'donation/remove'
            // => Devtools action name
          );
        },

        // => Clear all donations action
        clearDonations: () => {
          set(
            {
              donations: [],
              // => Reset to empty array
              totalAmount: 0,
              // => Reset total to 0
            },
            false,
            'donation/clear'
            // => Devtools action name
          );
        },
      }),
      {
        name: 'donation-storage',
        // => localStorage key: localStorage['donation-storage']
        storage: createJSONStorage(() => localStorage),
        // => Storage engine: localStorage (can be sessionStorage)
        partialize: (state) => ({
          donations: state.donations,
          totalAmount: state.totalAmount,
          // => Only persist data, exclude functions
        }),
        // => Optional custom serialization:
        // serialize: (state) => JSON.stringify(state),
        // deserialize: (str) => JSON.parse(str),
      }
    ),
    {
      name: 'DonationStore',
      // => Store name shown in Redux DevTools
    }
  )
);

// Component.tsx
import { useEffect } from 'react';
import { useDonationStore } from './store';

function PersistedDonationTracker() {
  // => Selector: extract donations from store
  const donations = useDonationStore((state) => state.donations);
  // => Re-renders when donations change
  const totalAmount = useDonationStore((state) => state.totalAmount);
  // => Re-renders when totalAmount changes
  const addDonation = useDonationStore((state) => state.addDonation);
  // => Stable reference (doesn't cause re-renders)
  const removeDonation = useDonationStore((state) => state.removeDonation);
  const clearDonations = useDonationStore((state) => state.clearDonations);

  // => Effect: log rehydration
  useEffect(() => {
    console.log('Store rehydrated from localStorage');
    // => Runs after persist middleware loads saved state
    console.log('Loaded donations:', donations);
    // => Shows donations from previous session
  }, []);
  // => [] dependency: runs once on mount

  return (
    <div>
      <h2>Persisted Donation Tracker</h2>
      <p style={{ color: 'gray', fontSize: '14px' }}>
        State persists across page reloads. Open Redux DevTools to inspect actions.
      </p>

      {/* => Display total */}
      <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
        Total: ${totalAmount}
      </div>

      {/* => Action buttons */}
      <div>
        <button onClick={() => addDonation(10, 'Anonymous')}>
          Donate \$10
        </button>
        <button onClick={() => addDonation(25, 'Anonymous')}>
          Donate \$25
        </button>
        <button onClick={() => clearDonations()}>
          Clear All
        </button>
      </div>

      {/* => Donation list */}
      <ul>
        {donations.map((donation) => (
          <li key={donation.id}>
            ${donation.amount} from {donation.donor}
            {' - '}
            {new Date(donation.timestamp).toLocaleString()}
            {/* => Parse ISO string back to Date for display */}
            {' '}
            <button onClick={() => removeDonation(donation.id)}>Remove</button>
          </li>
        ))}
      </ul>

      {/* => Instructions for testing */}
      <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#F0F0F0' }}>
        <h4>Testing Tips:</h4>
        <ol>
          <li>Add donations and reload page - state persists</li>
          <li>Open Redux DevTools (F12 → Redux tab)</li>
          <li>See actions logged as "donation/add", "donation/remove", etc.</li>
          <li>Use time-travel debugging to step through actions</li>
          <li>Check localStorage['donation-storage'] in devtools</li>
        </ol>
      </div>
    </div>
  );
}

export default PersistedDonationTracker;
```

**Key Takeaway**: Zustand middleware adds powerful features: persist() saves state to localStorage for cross-session persistence, devtools() integrates Redux DevTools for time-travel debugging and action logging. Chain middleware with proper ordering: devtools(persist(store)).

**Why It Matters**: Zustand middleware provides production-essential capabilities without custom implementation. The persist middleware handles the localStorage synchronization pattern from the custom hooks examples, but with proper partial state persistence (don't store sensitive data), storage key management, and version migration (handle schema changes when users have old persisted state). The devtools middleware integrates with Redux DevTools, providing time-travel debugging and action logging in development. Production Zustand stores almost always use persist (for user preferences, draft content, session recovery) and devtools (for debugging complex state transitions).

### Example 9: Server State vs Client State Separation

Separate server state (API data) from client state (UI state) for clarity. Use Zustand for client state, React Query for server state.

```typescript
// clientStore.ts - Client state (UI state)
import { create } from 'zustand';

// => Client state: UI concerns only
// => Things user controls that don't persist to server
interface ClientState {
  sidebarOpen: boolean;                      // => Sidebar visibility (UI state)
  selectedTab: 'donations' | 'zakat' | 'reports';  // => Active tab (UI state)
  sortOrder: 'asc' | 'desc';                 // => Sort direction (UI state)
  filterAmount: number | null;               // => Filter threshold (UI state)

  // => Client actions
  toggleSidebar: () => void;
  setSelectedTab: (tab: 'donations' | 'zakat' | 'reports') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setFilterAmount: (amount: number | null) => void;
}

// => Client store: manages UI state only
export const useClientStore = create<ClientState>((set) => ({
  // => Initial client state
  sidebarOpen: true,
  selectedTab: 'donations',
  sortOrder: 'desc',
  filterAmount: null,

  // => Client actions: update UI state only
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setFilterAmount: (amount) => set({ filterAmount: amount }),
}));

// api.ts - Server state (API calls)
// => Server state managed by React Query, not Zustand
// => Data from API, cached and synchronized

// => Domain interface
interface Donation {
  id: string;
  amount: number;
  donor: string;
  timestamp: string;
}

// => API functions for server state
export const donationApi = {
  // => Fetch donations from server
  fetchDonations: async (): Promise<Donation[]> => {
    // => Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // => In production: const response = await fetch('/api/donations');
    // => In production: return response.json();

    // => Mock data for demonstration
    return [
      { id: '1', amount: 100, donor: 'Aisha', timestamp: '2026-01-29T10:00:00Z' },
      { id: '2', amount: 250, donor: 'Omar', timestamp: '2026-01-29T11:00:00Z' },
      { id: '3', amount: 75, donor: 'Fatima', timestamp: '2026-01-29T12:00:00Z' },
    ];
  },

  // => Create new donation on server
  createDonation: async (amount: number, donor: string): Promise<Donation> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // => In production: POST to /api/donations

    return {
      id: Date.now().toString(),
      amount,
      donor,
      timestamp: new Date().toISOString(),
    };
  },
};

// Component.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClientStore } from './clientStore';
import { donationApi, Donation } from './api';

function DonationDashboard() {
  // => Client state from Zustand (UI concerns)
  const sidebarOpen = useClientStore((state) => state.sidebarOpen);
  const selectedTab = useClientStore((state) => state.selectedTab);
  const sortOrder = useClientStore((state) => state.sortOrder);
  const filterAmount = useClientStore((state) => state.filterAmount);
  const toggleSidebar = useClientStore((state) => state.toggleSidebar);
  const setSortOrder = useClientStore((state) => state.setSortOrder);
  const setFilterAmount = useClientStore((state) => state.setFilterAmount);

  // => Server state from React Query (API data)
  const queryClient = useQueryClient();

  // => Query: fetch donations from server
  const {
    data: donations,                         // => Server data
    isLoading,                               // => Loading state (server)
    error,                                   // => Error state (server)
  } = useQuery({
    queryKey: ['donations'],                 // => Cache key
    queryFn: donationApi.fetchDonations,     // => Fetch function
    staleTime: 5000,                         // => Data fresh for 5 seconds
    // => React Query handles caching, refetching, deduplication
  });

  // => Mutation: create new donation on server
  const createMutation = useMutation({
    mutationFn: ({ amount, donor }: { amount: number; donor: string }) =>
      donationApi.createDonation(amount, donor),
    onSuccess: () => {
      // => Invalidate query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      // => Triggers automatic refetch
    },
  });

  // => Derived state: filter and sort based on client state
  const filteredDonations = donations
    ? donations
        .filter((d) =>
          filterAmount === null ? true : d.amount >= filterAmount
        )
        // => Filter by client state (filterAmount)
        .sort((a, b) =>
          sortOrder === 'asc'
            ? a.amount - b.amount
            : b.amount - a.amount
        )
        // => Sort by client state (sortOrder)
    : [];

  // => Handle create donation
  const handleCreateDonation = () => {
    createMutation.mutate({ amount: 100, donor: 'Anonymous' });
    // => Triggers server mutation
    // => onSuccess refetches donations automatically
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* => Sidebar (client state) */}
      {sidebarOpen && (
        <div style={{ width: '200px', padding: '16px', backgroundColor: '#F5F5F5' }}>
          <h3>Filters</h3>

          {/* => Sort order (client state) */}
          <div>
            <label>
              Sort:
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </label>
          </div>

          {/* => Filter amount (client state) */}
          <div>
            <label>
              Min Amount:
              <input
                type="number"
                value={filterAmount ?? ''}
                onChange={(e) =>
                  setFilterAmount(e.target.value ? parseFloat(e.target.value) : null)
                }
              />
            </label>
          </div>
        </div>
      )}

      {/* => Main content */}
      <div style={{ flex: 1, padding: '16px' }}>
        <button onClick={toggleSidebar}>
          {/* => Toggle sidebar (client state) */}
          {sidebarOpen ? 'Hide' : 'Show'} Filters
        </button>

        <h2>Donations</h2>

        {/* => Server state: loading */}
        {isLoading && <p>Loading donations...</p>}

        {/* => Server state: error */}
        {error && <p style={{ color: 'red' }}>Error loading donations</p>}

        {/* => Server state: success */}
        {donations && (
          <>
            <p>Total donations: {filteredDonations.length}</p>

            <button
              onClick={handleCreateDonation}
              disabled={createMutation.isPending}
            >
              {/* => Mutation state from React Query */}
              {createMutation.isPending ? 'Adding...' : 'Add \$100 Donation'}
            </button>

            <ul>
              {filteredDonations.map((donation) => (
                <li key={donation.id}>
                  ${donation.amount} from {donation.donor}
                  {' - '}
                  {new Date(donation.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default DonationDashboard;
```

**Key Takeaway**: Separate client state (UI concerns, managed by Zustand) from server state (API data, managed by React Query). Client state controls UI elements like sidebar visibility and sort order. Server state handles API data with automatic caching, refetching, and synchronization. Never duplicate server data in Zustand.

**Why It Matters**: Separating server state (React Query) from client state (Zustand) reflects a fundamental architectural insight: these are different problems requiring different solutions. Server state has a source of truth on the server, needs synchronization, has staleness, and is shared across browser tabs. Client state lives only in the browser, is immediately consistent, and represents UI interactions. Mixing them leads to synchronization bugs and redundant code. Production applications that respect this separation are more maintainable: React Query handles loading/error/stale/cache for server data, Zustand handles the UI interaction state that has no server counterpart.

### Example 10: State Machine Pattern with XState

**Why XState instead of custom state machine with discriminated unions?** TypeScript discriminated unions can represent state machines, but wiring up transitions, guarding invalid state changes, and visualizing the machine requires significant custom code. XState provides a complete state machine implementation: states and transitions are declarative (not imperative), impossible states are enforced by the machine definition, and `@xstate/actor` enables visual debugging. For complex multi-step workflows (payment flows, form wizards, authentication sequences), XState makes the state logic explicit and testable, rather than scattered across multiple `if/else` chains and `useEffect` calls.

State machines model complex workflows with explicit states and transitions. Use XState for finite state machines with TypeScript support.

```typescript
import { createMachine, assign } from 'xstate';
import { useMachine } from '@xstate/react';

// => Domain interface
interface DonationContext {
  amount: number;                            // => Donation amount
  donor: string;                             // => Donor name
  email: string;                             // => Donor email
  confirmationCode: string;                  // => Confirmation code from server
  error: string;                             // => Error message
}

// => Event types for state machine
type DonationEvent =
  | { type: 'ENTER_DETAILS'; amount: number; donor: string; email: string }
  | { type: 'CONFIRM' }
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS'; confirmationCode: string }
  | { type: 'FAILURE'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// => Define state machine
// => States: idle → entering → confirming → processing → success/failure
const donationMachine = createMachine({
  // => Machine configuration
  id: 'donation',
  initial: 'idle',                           // => Start in idle state
  context: {
    // => Initial context values
    amount: 0,
    donor: '',
    email: '',
    confirmationCode: '',
    error: '',
  } as DonationContext,
  schema: {
    context: {} as DonationContext,
    events: {} as DonationEvent,
  },
  states: {
    // => State: idle (waiting for input)
    idle: {
      on: {
        ENTER_DETAILS: {
          // => Transition to entering state when ENTER_DETAILS event
          target: 'entering',
          actions: assign({
            // => Update context with event data
            amount: (_, event) => event.amount,
            donor: (_, event) => event.donor,
            email: (_, event) => event.email,
          }),
          // => assign() creates new context immutably
        },
      },
    },

    // => State: entering (collecting details)
    entering: {
      on: {
        CONFIRM: 'confirming',               // => Transition to confirming
        RESET: 'idle',                       // => Transition back to idle
      },
    },

    // => State: confirming (user reviews details)
    confirming: {
      on: {
        SUBMIT: 'processing',                // => Transition to processing
        ENTER_DETAILS: {
          // => Go back to entering with new details
          target: 'entering',
          actions: assign({
            amount: (_, event) => event.amount,
            donor: (_, event) => event.donor,
            email: (_, event) => event.email,
          }),
        },
        RESET: 'idle',
      },
    },

    // => State: processing (submitting to server)
    processing: {
      // => invoke: run async operation
      invoke: {
        id: 'submitDonation',
        src: async (context) => {
          // => Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // => Simulate random success/failure
          if (Math.random() > 0.3) {
            return { confirmationCode: `CONF-${Date.now()}` };
          } else {
            throw new Error('Payment gateway timeout');
          }
        },
        onDone: {
          // => Success: transition to success state
          target: 'success',
          actions: assign({
            confirmationCode: (_, event) => event.data.confirmationCode,
          }),
        },
        onError: {
          // => Error: transition to failure state
          target: 'failure',
          actions: assign({
            error: (_, event) =>
              event.data instanceof Error ? event.data.message : 'Unknown error',
          }),
        },
      },
    },

    // => State: success (donation completed)
    success: {
      on: {
        RESET: {
          // => Reset to idle, clear context
          target: 'idle',
          actions: assign({
            amount: 0,
            donor: '',
            email: '',
            confirmationCode: '',
            error: '',
          }),
        },
      },
    },

    // => State: failure (donation failed)
    failure: {
      on: {
        RETRY: 'processing',                 // => Retry processing
        RESET: {
          target: 'idle',
          actions: assign({
            amount: 0,
            donor: '',
            email: '',
            confirmationCode: '',
            error: '',
          }),
        },
      },
    },
  },
});

function DonationStateMachine() {
  // => useMachine hook: provides current state and send function
  const [state, send] = useMachine(donationMachine);
  // => state.value is current state name ('idle', 'entering', etc.)
  // => state.context is current context data
  // => send() dispatches events to machine

  // => Local form state (temporary, not in machine)
  const [tempAmount, setTempAmount] = useState(0);
  const [tempDonor, setTempDonor] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  // => Check current state
  const isIdle = state.matches('idle');
  const isEntering = state.matches('entering');
  const isConfirming = state.matches('confirming');
  const isProcessing = state.matches('processing');
  const isSuccess = state.matches('success');
  const isFailure = state.matches('failure');

  return (
    <div>
      <h2>Donation State Machine</h2>

      {/* => Current state indicator */}
      <div style={{ padding: '8px', backgroundColor: '#F0F0F0', marginBottom: '16px' }}>
        Current State: <strong>{String(state.value)}</strong>
      </div>

      {/* => State: idle */}
      {isIdle && (
        <div>
          <p>Ready to accept new donation</p>
          <button
            onClick={() =>
              send({
                type: 'ENTER_DETAILS',
                amount: 100,
                donor: 'Anonymous',
                email: 'anon@example.com',
              })
            }
          >
            Quick Donate \$100
          </button>
        </div>
      )}

      {/* => State: entering */}
      {isEntering && (
        <div>
          <h3>Enter Donation Details</h3>
          <label>
            Amount: $
            <input
              type="number"
              value={tempAmount}
              onChange={(e) => setTempAmount(parseFloat(e.target.value) || 0)}
            />
          </label>
          <label>
            Name:
            <input
              type="text"
              value={tempDonor}
              onChange={(e) => setTempDonor(e.target.value)}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
            />
          </label>
          <div>
            <button
              onClick={() =>
                send({
                  type: 'ENTER_DETAILS',
                  amount: tempAmount,
                  donor: tempDonor,
                  email: tempEmail,
                })
              }
            >
              Update Details
            </button>
            <button onClick={() => send({ type: 'CONFIRM' })}>
              Review Donation
            </button>
            <button onClick={() => send({ type: 'RESET' })}>Cancel</button>
          </div>
        </div>
      )}

      {/* => State: confirming */}
      {isConfirming && (
        <div>
          <h3>Confirm Donation</h3>
          <p>Amount: ${state.context.amount}</p>
          <p>Donor: {state.context.donor}</p>
          <p>Email: {state.context.email}</p>
          <div>
            <button onClick={() => send({ type: 'SUBMIT' })}>
              Submit Donation
            </button>
            <button
              onClick={() =>
                send({
                  type: 'ENTER_DETAILS',
                  amount: state.context.amount,
                  donor: state.context.donor,
                  email: state.context.email,
                })
              }
            >
              Edit Details
            </button>
            <button onClick={() => send({ type: 'RESET' })}>Cancel</button>
          </div>
        </div>
      )}

      {/* => State: processing */}
      {isProcessing && (
        <div>
          <h3>Processing Donation...</h3>
          <p>Please wait while we process your donation of ${state.context.amount}</p>
          <div className="spinner">⏳ Processing...</div>
        </div>
      )}

      {/* => State: success */}
      {isSuccess && (
        <div>
          <h3 style={{ color: 'green' }}>✓ Donation Successful!</h3>
          <p>Amount: ${state.context.amount}</p>
          <p>Confirmation Code: {state.context.confirmationCode}</p>
          <button onClick={() => send({ type: 'RESET' })}>
            Make Another Donation
          </button>
        </div>
      )}

      {/* => State: failure */}
      {isFailure && (
        <div>
          <h3 style={{ color: 'red' }}>✗ Donation Failed</h3>
          <p>Error: {state.context.error}</p>
          <div>
            <button onClick={() => send({ type: 'RETRY' })}>
              Retry Payment
            </button>
            <button onClick={() => send({ type: 'RESET' })}>
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DonationStateMachine;
```

**Key Takeaway**: State machines model complex workflows with explicit states and allowed transitions. XState provides TypeScript-safe state machines with context for data, guards for conditional transitions, and invoke for async operations. Prevents impossible states and makes workflows predictable.

**Why It Matters**: State machines are the most reliable pattern for implementing complex multi-step workflows in production. Payment flows, onboarding wizards, document approval processes, and complex forms with conditional steps are notoriously buggy when implemented with ad-hoc boolean flags. State machines make the workflow's states explicit, transitions guarded, and impossible states unrepresentable. When product requirements change ('add a verification step between pending and approved'), state machine code changes are localized and safe - you add the state, add its transitions, and TypeScript guides you to handle it everywhere. XState's visualization tools make the workflow auditable to non-technical stakeholders.

## Group 3: Performance Optimization (5 examples)

### Example 11: Code Splitting with React.lazy and Suspense

Code splitting reduces initial bundle size by loading components on-demand. Use React.lazy for dynamic imports and Suspense for loading states.

```mermaid
graph TD
    A["Initial bundle\n(small, fast load)"] -->|"user navigates to /admin"| B["Lazy import\nAdminPage chunk"]
    B -->|"loading"| C["Suspense fallback\n<Loading />"]
    B -->|"loaded"| D["AdminPage renders"]
    A -->|"user stays on home"| E["DashboardPage\n(already loaded)"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#CA9161,stroke:#000,color:#000
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code splitting**: Lazy loading defers bundle download until component is needed.

```typescript
import { Suspense, lazy, useState } from 'react';

// => React.lazy() creates separate bundles (loaded on-demand)
const DonationForm = lazy(() => import('./DonationForm'));
// => import() returns Promise<{ default: Component }>
const ZakatCalculator = lazy(() => import('./ZakatCalculator'));
const ReportsPanel = lazy(() => import('./ReportsPanel'));

// => Loading fallback displayed during component load
function LoadingSpinner() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div className="spinner">⏳ Loading...</div>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<'donate' | 'zakat' | 'reports'>('donate');
  // => Tab state determines which lazy component to render

  return (
    <div>
      <h2>Financial Dashboard</h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('donate')}
          style={{ fontWeight: activeTab === 'donate' ? 'bold' : 'normal' }}
        >
          Donations
        </button>
        <button
          onClick={() => setActiveTab('zakat')}
          style={{ fontWeight: activeTab === 'zakat' ? 'bold' : 'normal' }}
        >
          Zakat Calculator
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          style={{ fontWeight: activeTab === 'reports' ? 'bold' : 'normal' }}
        >
          Reports
        </button>
      </div>

      {/* => Suspense boundary catches lazy loading, shows fallback */}
      <Suspense fallback={<LoadingSpinner />}>
        {activeTab === 'donate' && <DonationForm />}
        {/* => Bundle loads on first render, then cached */}
        {activeTab === 'zakat' && <ZakatCalculator />}
        {activeTab === 'reports' && <ReportsPanel />}
      </Suspense>
    </div>
  );
}

export default Dashboard;

// DonationForm.tsx (separate file, code-split)
function DonationForm() {
  const [amount, setAmount] = useState(0);

  return (
    <div>
      <h3>Make a Donation</h3>
      <label>
        Amount: $
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
        />
      </label>
      <button>Submit Donation</button>
    </div>
  );
}

export default DonationForm;

// ZakatCalculator.tsx (separate file, code-split)
function ZakatCalculator() {
  const [wealth, setWealth] = useState(0);

  return (
    <div>
      <h3>Calculate Zakat</h3>
      <label>
        Total Wealth: $
        <input
          type="number"
          value={wealth}
          onChange={(e) => setWealth(parseFloat(e.target.value) || 0)}
        />
      </label>
      <button>Calculate</button>
    </div>
  );
}

export default ZakatCalculator;

// ReportsPanel.tsx (separate file, code-split)
function ReportsPanel() {
  return (
    <div>
      <h3>Financial Reports</h3>
      <p>Monthly donation summary...</p>
      <p>Zakat calculations...</p>
    </div>
  );
}

export default ReportsPanel;
```

**Key Takeaway**: React.lazy() enables code splitting by dynamically importing components. Wrap lazy components in Suspense boundaries with fallback UI for loading states. Each lazy component creates separate bundle loaded on-demand, reducing initial load time.

**Why It Matters**: Code splitting is a production performance requirement for large React applications. Loading all JavaScript upfront causes slow initial page loads - each second of load time correlates with user abandonment. React.lazy with Suspense splits your bundle at natural component boundaries, loading code only when the user navigates to it. Production applications split by: route (each page loads independently), feature (admin panel only loads for admins), and heavy third-party libraries (chart libraries, rich text editors). The Suspense fallback provides the loading state automatically during the lazy load. This pattern is often the highest-impact single optimization available.

### Example 12: Route-Based Code Splitting

Route-based code splitting loads route components on-demand, reducing initial bundle size significantly. Combine React Router with React.lazy for automatic route-level splitting.

```typescript
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

// => Lazy-load route components (separate bundles per route)
const HomePage = lazy(() => import('./routes/HomePage'));
// => Chunk: HomePage.abc123.js
const DonationPage = lazy(() => import('./routes/DonationPage'));
const ZakatPage = lazy(() => import('./routes/ZakatPage'));
const ReportsPage = lazy(() => import('./routes/ReportsPage'));
const NotFoundPage = lazy(() => import('./routes/NotFoundPage'));

// => Route loading fallback
function RouteLoadingFallback() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px' }}>⏳</div>
      <p>Loading page...</p>
    </div>
  );
}

// => Layout component (NOT lazy - always visible)
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav style={{ padding: '16px', backgroundColor: '#F5F5F5', marginBottom: '20px' }}>
        <Link to="/" style={{ marginRight: '16px' }}>Home</Link>
        <Link to="/donate" style={{ marginRight: '16px' }}>Donate</Link>
        <Link to="/zakat" style={{ marginRight: '16px' }}>Zakat</Link>
        <Link to="/reports" style={{ marginRight: '16px' }}>Reports</Link>
      </nav>
      {children}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        {/* => Suspense catches all route lazy loading */}
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* => Bundle loads when route first accessed */}
            <Route path="/donate" element={<DonationPage />} />
            <Route path="/zakat" element={<ZakatPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

// routes/HomePage.tsx (separate file, code-split)
function HomePage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to Financial Platform</h1>
      <p>Manage your donations, calculate zakat, and view financial reports.</p>
    </div>
  );
}

export default HomePage;

// routes/DonationPage.tsx (separate file, code-split)
import { useState } from 'react';

function DonationPage() {
  const [amount, setAmount] = useState(0);
  const [donor, setDonor] = useState('');

  return (
    <div style={{ padding: '20px' }}>
      <h1>Make a Donation</h1>
      <label>
        Amount: $
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
        />
      </label>
      <label>
        Name:
        <input
          type="text"
          value={donor}
          onChange={(e) => setDonor(e.target.value)}
        />
      </label>
      <button>Submit Donation</button>
    </div>
  );
}

export default DonationPage;

// routes/ZakatPage.tsx (separate file, code-split)
import { useState } from 'react';

function ZakatPage() {
  const [wealth, setWealth] = useState(0);
  const [zakatAmount, setZakatAmount] = useState(0);

  const calculateZakat = () => {
    const nisab = 5000;                      // => Minimum wealth threshold
    if (wealth >= nisab) {
      setZakatAmount((wealth - nisab) * 0.025);
      // => 2.5% of wealth above nisab
    } else {
      setZakatAmount(0);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Zakat Calculator</h1>
      <label>
        Total Wealth: $
        <input
          type="number"
          value={wealth}
          onChange={(e) => setWealth(parseFloat(e.target.value) || 0)}
        />
      </label>
      <button onClick={calculateZakat}>Calculate Zakat</button>
      {zakatAmount > 0 && (
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'green' }}>
          Zakat Due: ${zakatAmount.toFixed(2)}
        </p>
      )}
    </div>
  );
}

export default ZakatPage;

// routes/ReportsPage.tsx (separate file, code-split)
function ReportsPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Financial Reports</h1>
      <div>
        <h2>Monthly Summary</h2>
        <p>Total donations: \$2,500</p>
        <p>Total zakat: \$1,250</p>
      </div>
    </div>
  );
}

export default ReportsPage;

// routes/NotFoundPage.tsx (separate file, code-split)
function NotFoundPage() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default NotFoundPage;
```

**Key Takeaway**: Route-based code splitting loads route components on-demand, significantly reducing initial bundle size. Combine React Router with React.lazy and Suspense for automatic route-level splitting. Navigation links trigger lazy loading when clicked. Layout components (nav, footer) stay in main bundle for instant visibility.

**Why It Matters**: Route-based code splitting is the most impactful form of code splitting because application size grows primarily with feature count, and features are accessed by route. Production SPAs using route-based splitting load only the code for the current page - a checkout flow doesn't load the reporting dashboard's bundle. Combined with preloading strategies (prefetch routes the user is likely to visit next), route-based splitting provides fast initial load while maintaining navigation responsiveness. The React Router v6 + React.lazy combination is the standard production pattern, supported by build tools that automatically create separate chunks per lazy-loaded component.

### Example 13: React.memo and Memoization Strategies

React.memo prevents unnecessary re-renders of child components. Use for expensive components that receive stable props.

```mermaid
graph TD
    A["Parent re-renders\n(unrelated state change)"] -->|"React.memo check"| B{"Props changed?"}
    B -->|"No (same reference)"| C["Child skips re-render\n(optimization wins)"]
    B -->|"Yes (new reference)"| D["Child re-renders\n(necessary update)"]
    E["useCallback memoized fn"] -->|"same reference"| B
    F["New fn every render"] -->|"always new reference"| D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#CA9161,stroke:#000,color:#000
    style F fill:#CC78BC,stroke:#000,color:#000
```

**React.memo + useCallback**: Stable references prevent expensive child re-renders.

```typescript
import { memo, useState, useCallback, useMemo } from 'react';

// => Domain interface
interface Donation {
  id: string;
  amount: number;
  donor: string;
}

// => Props interface for memoized component
interface DonationItemProps {
  donation: Donation;
  onRemove: (id: string) => void;
}

// => Memoized component: only re-renders if props change
// => React.memo wraps component, performs shallow prop comparison
// => Prevents re-render when parent re-renders but props unchanged
const DonationItem = memo(({ donation, onRemove }: DonationItemProps) => {
  console.log(`Rendering DonationItem ${donation.id}`);
  // => Log to track re-renders (remove in production)
  // => With memo: only logs when donation or onRemove changes
  // => Without memo: logs on every parent re-render

  return (
    <li style={{ padding: '8px', marginBottom: '4px', backgroundColor: '#F9F9F9' }}>
      ${donation.amount} from {donation.donor}
      {' '}
      <button onClick={() => onRemove(donation.id)}>Remove</button>
      {/* => onRemove must be stable (useCallback) to prevent re-renders */}
    </li>
  );
});
// => React.memo performs shallow comparison of props
// => Re-renders only if donation object reference changes
// => or onRemove function reference changes

// => Custom comparison function (optional)
// => Provides more control over when component re-renders
const DonationItemWithCustomCompare = memo(
  ({ donation, onRemove }: DonationItemProps) => {
    return (
      <li>
        ${donation.amount} from {donation.donor}
        {' '}
        <button onClick={() => onRemove(donation.id)}>Remove</button>
      </li>
    );
  },
  (prevProps, nextProps) => {
    // => Custom comparison function
    // => Return true to SKIP re-render (props considered equal)
    // => Return false to RE-RENDER (props considered different)

    // => Only re-render if donation amount or id changes
    // => Ignore donor name changes
    return (
      prevProps.donation.id === nextProps.donation.id &&
      prevProps.donation.amount === nextProps.donation.amount
      // => onRemove assumed stable, not compared
    );
    // => More control than default shallow comparison
  }
);

function DonationList() {
  const [donations, setDonations] = useState<Donation[]>([
    { id: '1', amount: 100, donor: 'Aisha' },
    { id: '2', amount: 250, donor: 'Omar' },
    { id: '3', amount: 75, donor: 'Fatima' },
  ]);

  const [filterAmount, setFilterAmount] = useState(0);
  // => State change causes parent re-render
  // => Without memo: all DonationItem children re-render
  // => With memo: only affected DonationItems re-render

  // => useCallback: memoize function reference
  // => Returns same function reference across re-renders if deps unchanged
  // => Prevents breaking React.memo optimization
  const handleRemove = useCallback((id: string) => {
    setDonations((prev) => prev.filter((d) => d.id !== id));
    // => setDonations always stable (React guarantees)
  }, []);
  // => Empty deps: handleRemove reference never changes
  // => Without useCallback: new function created on every render
  // => New function reference breaks React.memo optimization

  // => useMemo: memoize computed value
  // => Recomputes only when dependencies change
  const filteredDonations = useMemo(() => {
    console.log('Filtering donations...');
    // => Log to track recomputation
    // => Only logs when donations or filterAmount changes
    return donations.filter((d) => d.amount >= filterAmount);
  }, [donations, filterAmount]);
  // => Recomputes only when donations or filterAmount changes
  // => Without useMemo: filters on every render (even unrelated state changes)

  // => Expensive computation example
  const totalAmount = useMemo(() => {
    console.log('Calculating total...');
    // => Expensive operation (simulated)
    return donations.reduce((sum, d) => sum + d.amount, 0);
  }, [donations]);
  // => Recomputes only when donations changes
  // => Without useMemo: recalculates on every render

  // => Local state (unrelated to donations)
  const [count, setCount] = useState(0);
  // => Changing count triggers re-render
  // => With memo: DonationItems don't re-render (props unchanged)
  // => With useMemo: filteredDonations not recomputed (deps unchanged)
  // => With useCallback: handleRemove reference unchanged

  return (
    <div>
      <h2>Donation List with Memoization</h2>

      {/* => Display memoized total */}
      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Total: ${totalAmount}
        {/* => Recomputed only when donations changes */}
      </div>

      {/* => Filter input */}
      <div style={{ marginBottom: '16px' }}>
        <label>
          Min Amount: $
          <input
            type="number"
            value={filterAmount}
            onChange={(e) => setFilterAmount(parseFloat(e.target.value) || 0)}
          />
        </label>
        {/* => Changing filter triggers re-render */}
        {/* => useMemo recomputes filteredDonations */}
        {/* => DonationItems with changed visibility re-render */}
      </div>

      {/* => Unrelated state (for testing memoization) */}
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => setCount(count + 1)}>
          Increment Count: {count}
        </button>
        {/* => Changing count triggers re-render */}
        {/* => With memo: DonationItems don't re-render */}
        {/* => Without memo: all DonationItems re-render unnecessarily */}
      </div>

      {/* => Donation list */}
      <ul>
        {filteredDonations.map((donation) => (
          <DonationItem
            key={donation.id}
            donation={donation}
            onRemove={handleRemove}
            // => handleRemove stable (useCallback)
            // => donation object from filteredDonations (useMemo)
            // => DonationItem memo prevents unnecessary re-renders
          />
        ))}
      </ul>

      {/* => Performance tips */}
      <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#F0F0F0' }}>
        <h4>Optimization Notes:</h4>
        <ol>
          <li>Click "Increment Count" - DonationItems don't re-render (memo works)</li>
          <li>Check console logs - filtering only happens when filter/donations change</li>
          <li>Total calculation only happens when donations change</li>
          <li>handleRemove function reference stable across re-renders</li>
        </ol>
      </div>
    </div>
  );
}

export default DonationList;
```

**Key Takeaway**: React.memo prevents re-renders when props unchanged (shallow comparison). useCallback memoizes function references to prevent breaking memo optimization. useMemo memoizes computed values to avoid expensive recalculations. Use all three together for maximum performance: memo for components, useCallback for passed functions, useMemo for expensive computations.

**Why It Matters**: React.memo optimization and memoization strategies are essential tools for production performance tuning. The key production insight is that re-renders are not inherently bad - React is fast, and unnecessary re-render prevention can add complexity without visible benefit. Profile first using React DevTools Profiler, identify components with expensive renders that fire frequently, then selectively apply React.memo. The comparison function parameter gives you control over what constitutes a meaningful prop change - useful when props include computed objects that are structurally equal but referentially different. Applied judiciously, memoization prevents visible UI jank in data-heavy interfaces.

### Example 14: Virtual Scrolling for Large Lists

Virtual scrolling renders only visible items in large lists, dramatically improving performance. Use react-window for efficient large list rendering.

```typescript
import { FixedSizeList } from 'react-window';
import { useMemo } from 'react';

interface Donation {
  id: string;
  amount: number;
  donor: string;
  timestamp: string;
}

// => Generate 10,000 donations for performance testing
function generateDonations(count: number): Donation[] {
  const donations: Donation[] = [];
  for (let i = 0; i < count; i++) {
    donations.push({
      id: `donation-${i}`,
      amount: Math.floor(Math.random() * 500) + 10,
      // => Random \$10-\$510
      donor: `Donor ${i + 1}`,
      timestamp: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      // => Random date within last year
    });
  }
  return donations;
}

function VirtualizedDonationList() {
  // => Memoize: prevent regenerating 10,000 items on each render
  const donations = useMemo(() => generateDonations(10000), []);

  // => Row renderer: called only for visible rows
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const donation = donations[index];
    // => react-window manages which indices to render

    return (
      <div style={{
        ...style,
        // => style: positioning from react-window (absolute)
        padding: '12px',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <strong>${donation.amount}</strong> from {donation.donor}
        </div>
        <div style={{ color: '#666', fontSize: '14px' }}>
          {new Date(donation.timestamp).toLocaleDateString()}
        </div>
      </div>
    );
  };
  // => Only ~20 Row instances in DOM (reused during scroll)

  return (
    <div>
      <h2>Virtualized Donation List</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Showing 10,000 donations using virtual scrolling. Only visible items rendered.
      </p>

      {/* => FixedSizeList: renders only visible portion */}
      <FixedSizeList
        height={600}
        // => 600px container: ~12 rows visible at 50px each
        itemCount={donations.length}
        // => Total items: 10,000
        itemSize={50}
        // => Fixed 50px per row
        width="100%"
        overscanCount={5}
        // => Render 5 extra rows above/below (prevents scroll flash)
      >
        {Row}
      </FixedSizeList>

      {/* => Performance comparison */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F0F0F0' }}>
        <h3>Performance Comparison</h3>
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Without Virtualization</th>
              <th>With Virtualization</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>DOM Nodes</td>
              <td>10,000</td>
              <td>~20 (visible + buffer)</td>
            </tr>
            <tr>
              <td>Initial Render</td>
              <td>~500ms</td>
              <td>~20ms</td>
            </tr>
            <tr>
              <td>Scroll Performance</td>
              <td>Janky</td>
              <td>Smooth 60fps</td>
            </tr>
            <tr>
              <td>Memory Usage</td>
              <td>~50MB</td>
              <td>~5MB</td>
            </tr>
          </tbody>
        </table>
        {/* => Approximate numbers for demonstration */}
      </div>

      {/* => Usage notes */}
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#FFF8E1' }}>
        <h4>When to Use Virtual Scrolling:</h4>
        <ul>
          <li>Lists with 100+ items</li>
          <li>Infinite scroll / pagination alternatives</li>
          <li>Tables with many rows</li>
          <li>Chat message histories</li>
          <li>File explorers with large directories</li>
        </ul>
        <h4>When NOT to Use:</h4>
        <ul>
          <li>Lists under 50 items (unnecessary complexity)</li>
          <li>Dynamic row heights (use VariableSizeList)</li>
          <li>Lists that need full-text search (entire dataset not in DOM)</li>
        </ul>
      </div>
    </div>
  );
}

export default VirtualizedDonationList;
```

**Key Takeaway**: Virtual scrolling renders only visible list items, dramatically improving performance for large lists. react-window provides FixedSizeList for fixed-height rows and VariableSizeList for dynamic heights. Only ~20 DOM nodes exist regardless of list size. Use for lists with 100+ items to prevent browser lag.

**Why It Matters**: Virtual scrolling is not optional for production lists that could contain thousands of items. Rendering 10,000 DOM nodes causes browser jank on any device. The virtualization pattern renders only the items currently visible (plus a small buffer), maintaining constant DOM node count regardless of list size. Production use cases: data tables with large datasets, message threads, contact lists, activity feeds, search results. Libraries like TanStack Virtual (formerly react-virtual) or react-window provide battle-tested virtualization. Understanding the underlying concept - maintaining scroll position while swapping visible items - helps you debug virtual list edge cases that occur with dynamic item heights.

### Example 15: Web Workers for Heavy Computations

Web Workers run JavaScript in background threads, preventing UI blocking during heavy computations. Use for CPU-intensive tasks like data processing, encryption, or complex calculations.

```typescript
import { useState, useEffect, useRef } from 'react';

// worker.ts (separate file, loaded as Web Worker)
// => Web Worker code runs in separate thread
// => No access to DOM or React state
// => Communicates via messages

// => Self-contained worker code
const workerCode = `
// => Worker receives messages via onmessage
self.onmessage = function(e) {
  const { type, data } = e.data;

  if (type === 'CALCULATE_ZAKAT') {
    // => CPU-intensive zakat calculation
    // => Processes large dataset without blocking UI
    const { donations } = data;

    const results = donations.map((donation) => {
      // => Simulate expensive computation
      // => In production: complex financial calculations
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += Math.sqrt(donation.amount);
      }

      const nisab = 5000;
      const wealth = donation.amount;
      const isZakatDue = wealth >= nisab;
      const zakatAmount = isZakatDue ? (wealth - nisab) * 0.025 : 0;

      return {
        id: donation.id,
        donor: donation.donor,
        amount: donation.amount,
        zakatAmount,
        isZakatDue,
      };
    });

    // => Send results back to main thread
    self.postMessage({
      type: 'CALCULATION_COMPLETE',
      data: results,
    });
  }
};
`;

// => Domain interfaces
interface Donation {
  id: string;
  amount: number;
  donor: string;
}

interface ZakatResult {
  id: string;
  donor: string;
  amount: number;
  zakatAmount: number;
  isZakatDue: boolean;
}

function ZakatCalculatorWithWorker() {
  const [donations] = useState<Donation[]>([
    // => Sample donations for processing
    { id: '1', amount: 10000, donor: 'Aisha' },
    { id: '2', amount: 3000, donor: 'Omar' },
    { id: '3', amount: 7500, donor: 'Fatima' },
    { id: '4', amount: 15000, donor: 'Ali' },
    { id: '5', amount: 4500, donor: 'Zahra' },
  ]);

  const [results, setResults] = useState<ZakatResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationTime, setCalculationTime] = useState(0);

  // => Worker reference persists across re-renders
  const workerRef = useRef<Worker | null>(null);

  // => Initialize worker on mount
  useEffect(() => {
    // => Create blob from worker code string
    // => Blob contains worker JavaScript code
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    // => Create object URL from blob
    const workerUrl = URL.createObjectURL(blob);

    // => Create Worker from blob URL
    // => Worker runs in separate thread
    workerRef.current = new Worker(workerUrl);
    // => Worker ready to receive messages

    // => Set up message handler
    // => Receives messages from worker
    workerRef.current.onmessage = (e) => {
      const { type, data } = e.data;

      if (type === 'CALCULATION_COMPLETE') {
        // => Worker finished calculation
        // => Update state with results
        setResults(data);
        setIsCalculating(false);
        setCalculationTime(performance.now() - startTimeRef.current);
        // => UI never blocked during calculation
      }
    };

    // => Cleanup: terminate worker on unmount
    return () => {
      workerRef.current?.terminate();
      // => Free worker thread resources
      URL.revokeObjectURL(workerUrl);
      // => Clean up blob URL
    };
  }, []);
  // => Empty deps: worker created once on mount

  // => Track calculation start time
  const startTimeRef = useRef(0);

  // => Trigger calculation in worker
  const handleCalculate = () => {
    if (!workerRef.current) return;

    // => Record start time
    startTimeRef.current = performance.now();

    // => Set calculating state
    setIsCalculating(true);

    // => Send message to worker
    // => Worker receives in onmessage handler
    workerRef.current.postMessage({
      type: 'CALCULATE_ZAKAT',
      data: { donations },
    });
    // => Main thread continues running
    // => UI remains responsive
    // => Worker processes in background thread
  };

  // => Calculate without worker (blocks UI)
  // => For comparison/demonstration
  const handleCalculateMainThread = () => {
    setIsCalculating(true);
    const startTime = performance.now();

    // => Heavy computation on main thread
    // => UI freezes during this operation
    const results = donations.map((donation) => {
      // => Simulate expensive computation
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += Math.sqrt(donation.amount);
      }
      // => UI blocked during loop

      const nisab = 5000;
      const wealth = donation.amount;
      const isZakatDue = wealth >= nisab;
      const zakatAmount = isZakatDue ? (wealth - nisab) * 0.025 : 0;

      return {
        id: donation.id,
        donor: donation.donor,
        amount: donation.amount,
        zakatAmount,
        isZakatDue,
      };
    });

    // => Update state after computation
    setResults(results);
    setIsCalculating(false);
    setCalculationTime(performance.now() - startTime);
    // => UI unfrozen after setState
  };

  return (
    <div>
      <h2>Zakat Calculator with Web Worker</h2>

      {/* => Donation list */}
      <div style={{ marginBottom: '16px' }}>
        <h3>Donations:</h3>
        <ul>
          {donations.map((d) => (
            <li key={d.id}>
              ${d.amount} from {d.donor}
            </li>
          ))}
        </ul>
      </div>

      {/* => Calculation controls */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          style={{
            padding: '12px 24px',
            marginRight: '8px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCalculating ? 'not-allowed' : 'pointer',
          }}
        >
          {isCalculating ? 'Calculating (Worker)...' : 'Calculate (Worker)'}
        </button>
        {/* => Worker calculation: UI stays responsive */}

        <button
          onClick={handleCalculateMainThread}
          disabled={isCalculating}
          style={{
            padding: '12px 24px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCalculating ? 'not-allowed' : 'pointer',
          }}
        >
          {isCalculating ? 'Calculating (Main Thread)...' : 'Calculate (Main Thread)'}
        </button>
        {/* => Main thread calculation: UI freezes */}
      </div>

      {/* => Calculation time */}
      {calculationTime > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#E3F2FD' }}>
          <strong>Calculation Time:</strong> {calculationTime.toFixed(2)}ms
        </div>
      )}

      {/* => Results */}
      {results.length > 0 && (
        <div>
          <h3>Zakat Results:</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F5F5F5' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                  Donor
                </th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                  Amount
                </th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                  Zakat Due
                </th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {result.donor}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    ${result.amount}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    ${result.zakatAmount.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      color: result.isZakatDue ? 'green' : 'gray',
                      fontWeight: result.isZakatDue ? 'bold' : 'normal',
                    }}
                  >
                    {result.isZakatDue ? '✓ Zakat Due' : 'Below Nisab'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* => Usage notes */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#FFF8E1' }}>
        <h4>Testing Web Worker Performance:</h4>
        <ol>
          <li>
            Click "Calculate (Worker)" - UI stays responsive, you can scroll/click during calculation
          </li>
          <li>
            Click "Calculate (Main Thread)" - UI freezes, page becomes unresponsive during calculation
          </li>
          <li>
            Compare calculation times - both similar duration, but worker doesn't block UI
          </li>
        </ol>
        <h4>When to Use Web Workers:</h4>
        <ul>
          <li>Heavy data processing (filtering, sorting large datasets)</li>
          <li>Encryption/decryption operations</li>
          <li>Image/video processing</li>
          <li>Complex mathematical calculations</li>
          <li>Parsing large JSON/XML files</li>
        </ul>
        <h4>Limitations:</h4>
        <ul>
          <li>No DOM access (can't manipulate React components)</li>
          <li>No React state access (communicate via messages only)</li>
          <li>Setup overhead (~1ms per message)</li>
          <li>Data copied between threads (not suitable for huge objects)</li>
        </ul>
      </div>
    </div>
  );
}

export default ZakatCalculatorWithWorker;
```

**Key Takeaway**: Web Workers run JavaScript in background threads, preventing UI blocking during heavy computations. Main thread stays responsive while worker processes data. Use for CPU-intensive tasks like data processing, encryption, or complex calculations. Communicate via postMessage/onmessage. Workers have no DOM or React access.

**Why It Matters**: Web Workers move computationally expensive operations off the main thread, preventing UI freezes. Production React applications encounter genuinely CPU-intensive tasks: parsing large CSV files, running statistical computations on datasets, image processing, encryption operations, and complex search indexing. Running these on the main thread blocks rendering - the UI freezes until the computation finishes, which is unacceptable in production. The Worker + postMessage + onmessage pattern provides an async interface to computation. Modern Vite/webpack support importing Workers as URLs makes the setup straightforward. This pattern is the production solution for features that would otherwise make your application feel unresponsive.

## Group 4: Concurrent Features and Advanced Patterns (5 examples)

### Example 16: Suspense for Data Fetching

Suspense handles async data loading declaratively. Components "suspend" while loading, Suspense boundary shows fallback UI.

```mermaid
graph TD
    A["Suspense boundary\n fallback=<Loading />"] --> B["DataComponent"]
    B -->|"data not ready"| A
    B -->|"data ready"| C["Renders with data"]
    D["startFetch() called\nbefore render"] -->|"prefetch"| E["React Query cache\nwarms up"]
    E -->|"component renders"| B

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#CA9161,stroke:#000,color:#000
```

**Suspense for data**: Render-as-you-fetch pre-warms cache before component renders.

```typescript
import { Suspense } from 'react';
// => Suspense: declarative loading state boundary

// => Resource interface: Suspense-compatible data fetcher
// => read() must throw promise (pending) or return data (success)
interface Resource<T> {
  read(): T;
  // => read(): throws promise | throws error | returns T
}

// => wrapPromise: converts Promise to Suspense Resource
function wrapPromise<T>(promise: Promise<T>): Resource<T> {
  let status: 'pending' | 'success' | 'error' = 'pending';
  // => status: tracks promise lifecycle
  let result: T;
  // => result: stores resolved data
  let error: any;
  // => error: stores rejection reason

  // => Execute promise immediately (not lazy)
  const suspender = promise.then(
    (data) => {
      status = 'success';
      // => Update status on resolution
      result = data;
      // => Cache resolved data
    },
    (err) => {
      status = 'error';
      // => Update status on rejection
      error = err;
      // => Cache error
    }
  );

  return {
    read(): T {
      // => Pending: throw promise to trigger Suspense
      if (status === 'pending') {
        throw suspender;
        // => Suspense catches, shows fallback
      }

      // => Error: throw to trigger Error Boundary
      if (status === 'error') {
        throw error;
        // => Error Boundary handles
      }

      // => Success: return cached data
      return result;
      // => Component renders with data
    },
  };
}

interface Donation {
  id: string;
  amount: number;
  donor: string;
  timestamp: string;
}

// => fetchDonations: returns Resource (not Promise)
function fetchDonations(): Resource<Donation[]> {
  const promise = new Promise<Donation[]>((resolve) => {
    setTimeout(() => {
      // => Simulate 2-second API delay
      resolve([
        { id: '1', amount: 100, donor: 'Aisha', timestamp: '2026-01-29T10:00:00Z' },
        { id: '2', amount: 250, donor: 'Omar', timestamp: '2026-01-29T11:00:00Z' },
        { id: '3', amount: 75, donor: 'Fatima', timestamp: '2026-01-29T12:00:00Z' },
      ]);
      // => Resolve with donation array
    }, 2000);
  });

  return wrapPromise(promise);
  // => Convert Promise to Suspense Resource
}

// => Create resource immediately (module scope)
// => Starts fetch before component mounts (early fetch)
const donationResource = fetchDonations();

// => Component reading from Suspense resource
function DonationList() {
  // => read(): throws promise (pending) or returns data (success)
  const donations = donationResource.read();
  // => If pending: throws → Suspense shows fallback
  // => If success: returns → component renders
  // => Component "suspends" while loading

  return (
    <div>
      <h3>Recent Donations</h3>
      <ul>
        {donations.map((donation) => (
          <li key={donation.id}>
            ${donation.amount} from {donation.donor}
            {' - '}
            {new Date(donation.timestamp).toLocaleString()}
            {/* => Parse ISO timestamp to locale string */}
          </li>
        ))}
      </ul>
      <p>Total: ${donations.reduce((sum, d) => sum + d.amount, 0)}</p>
      {/* => Compute total from donation amounts */}
    </div>
  );
}

function SuspenseDemo() {
  return (
    <div>
      <h2>Suspense for Data Fetching</h2>

      {/* => Suspense: declarative loading boundary */}
      <Suspense
        fallback={
          // => fallback: shown while DonationList suspended
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px' }}>⏳</div>
            <p>Loading donations...</p>
          </div>
        }
      >
        {/* => DonationList calls read() → throws if pending */}
        {/* => Suspense catches thrown promise → shows fallback */}
        {/* => When promise resolves → re-renders DonationList */}
        <DonationList />
      </Suspense>
    </div>
  );
}

export default SuspenseDemo;
```

**Key Takeaway**: Suspense handles async data loading declaratively. Components "suspend" (throw promise) while loading data. Suspense boundary catches suspension and shows fallback UI. When data ready, component renders normally. Enables "render-as-you-fetch" pattern for better UX.

**Why It Matters**: Suspense for data fetching represents React's vision for async-first component development. Instead of components managing their own loading states, Suspense boundary components handle the loading UI, letting data-consuming components assume their data is ready. This inverts the control of loading states from individual components to their parents, enabling more consistent loading experiences and eliminating loading state management code in leaf components. Production adoption requires either a Suspense-compatible data fetching library (React Query v5 supports Suspense mode, SWR supports it) or the use-framework pattern. This is increasingly the direction React's ecosystem is moving.

### Example 17: startTransition for Non-Urgent Updates

startTransition marks state updates as low-priority, keeping UI responsive during expensive updates. Use for non-urgent updates like filtering or search results.

```mermaid
graph TD
    A["User types in search\nhigh priority input"] -->|"startTransition()"| B["Filter computation\nlow priority"]
    B -->|"React defers"| C["Input stays responsive\nno jank"]
    B -->|"main thread free"| D["Filter results update\nwhen ready"]
    E["Typing continues"] -->|"interrupts if needed"| B

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#000
```

**startTransition**: Marks expensive updates as non-urgent, keeps urgent updates fast.

```typescript
import { useState, startTransition, useDeferredValue } from 'react';

interface Donation {
  id: string;
  amount: number;
  donor: string;
  category: string;
}

// => Generate 5000 donations (large enough to cause filter lag)
function generateDonations(count: number): Donation[] {
  const categories = ['general', 'zakat', 'sadaqah', 'emergency'];
  const donations: Donation[] = [];

  for (let i = 0; i < count; i++) {
    donations.push({
      id: `donation-${i}`,
      amount: Math.floor(Math.random() * 500) + 10,
      donor: `Donor ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
    });
  }

  return donations;
}

function TransitionDemo() {
  const [donations] = useState(() => generateDonations(5000));
  // => 5000 donations: filtering is expensive

  const [query, setQuery] = useState('');
  // => query: urgent update (input value)
  const [filteredDonations, setFilteredDonations] = useState(donations);
  // => filteredDonations: non-urgent update
  const [isPending, startTransition] = useState(false);
  // => isPending: true while transition in progress

  // => WITHOUT startTransition: blocks UI
  const handleSearchWithoutTransition = (value: string) => {
    setQuery(value);
    // => Urgent: update immediately

    const filtered = donations.filter(
      (d) =>
        d.donor.toLowerCase().includes(value.toLowerCase()) ||
        d.category.toLowerCase().includes(value.toLowerCase())
    );
    // => Expensive: filtering 5000 items blocks UI

    setFilteredDonations(filtered);
    // => Blocks until complete, causes input lag
  };

  // => WITH startTransition: keeps input responsive
  const handleSearchWithTransition = (value: string) => {
    setQuery(value);
    // => Urgent: updates immediately

    // => Mark filtered update as non-urgent
    startTransition(() => {
      const filtered = donations.filter(
        (d) =>
          d.donor.toLowerCase().includes(value.toLowerCase()) ||
          d.category.toLowerCase().includes(value.toLowerCase())
      );

      setFilteredDonations(filtered);
      // => Non-urgent: React can interrupt for urgent updates
    });
    // => Input stays responsive during filtering
  };

  return (
    <div>
      <h2>startTransition Demo</h2>

      <div style={{ marginBottom: '16px' }}>
        <label>
          Search donations (try typing quickly):
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchWithTransition(e.target.value)}
            // => Using transition: input stays responsive
            style={{
              padding: '8px',
              fontSize: '16px',
              width: '100%',
              marginTop: '8px',
            }}
            placeholder="Search by donor or category..."
          />
        </label>
      </div>

      {/* => Pending indicator during transition */}
      {isPending && (
        <div style={{ padding: '8px', backgroundColor: '#FFF8E1', marginBottom: '16px' }}>
          ⏳ Filtering results...
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <strong>Results:</strong> {filteredDonations.length} of {donations.length} donations
      </div>

      {/* => Show first 100 results */}
      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd' }}>
        {filteredDonations.slice(0, 100).map((donation) => (
          <div
            key={donation.id}
            style={{
              padding: '12px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <strong>${donation.amount}</strong> from {donation.donor}
            {' - '}
            <span style={{ color: '#666' }}>{donation.category}</span>
          </div>
        ))}
        {/* => Rendering happens during transition (non-blocking) */}
      </div>

      {/* => Comparison */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F0F0F0' }}>
        <h3>startTransition Benefits:</h3>
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Aspect</th>
              <th>Without startTransition</th>
              <th>With startTransition</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Input Responsiveness</td>
              <td>Laggy (blocks on keystroke)</td>
              <td>Smooth (never blocks)</td>
            </tr>
            <tr>
              <td>Results Update</td>
              <td>Immediate but janky</td>
              <td>Slightly delayed but smooth</td>
            </tr>
            <tr>
              <td>User Experience</td>
              <td>Frustrating during typing</td>
              <td>Responsive, professional feel</td>
            </tr>
            <tr>
              <td>Priority</td>
              <td>All updates equal priority</td>
              <td>Input urgent, filtering deferred</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* => Usage notes */}
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#FFF8E1' }}>
        <h4>When to Use startTransition:</h4>
        <ul>
          <li>Filtering/searching large lists (keeps input responsive)</li>
          <li>Tab switching with heavy rendering (current tab responsive)</li>
          <li>Non-urgent updates during user interaction (form input, clicks)</li>
          <li>Updating derived state from expensive computations</li>
        </ul>
        <h4>When NOT to Use:</h4>
        <ul>
          <li>Input field controlled values (must update immediately)</li>
          <li>Critical UI feedback (loading states, error messages)</li>
          <li>Quick updates (no performance benefit)</li>
        </ul>
      </div>
    </div>
  );
}

export default TransitionDemo;
```

**Key Takeaway**: startTransition marks state updates as non-urgent, preventing them from blocking urgent updates like input. React can interrupt transitions for higher-priority work. Keeps UI responsive during expensive updates. Use for filtering, search results, tab switching, and derived state updates.

**Why It Matters**: startTransition is React 18's mechanism for distinguishing urgent updates (typing, clicking) from non-urgent updates (search results filtering, UI transitions). Without this distinction, a slow filter computation on a large list blocks typing in the search input - the UI feels frozen. By wrapping expensive state updates in startTransition, React prioritizes keeping the input responsive and defers the expensive re-render until the main thread is free. Production use cases: search filtering, tab switching with complex tab content, wizard step transitions, and report generation that updates a data visualization. This API prevents the most common form of UI jank in interactive data-heavy applications.

### Example 18: useDeferredValue for Expensive Renders

useDeferredValue defers expensive rendering based on state value. React shows stale value during expensive updates, keeping UI responsive.

```typescript
import { useState, useDeferredValue, memo } from 'react';

interface Donation {
  id: string;
  amount: number;
  donor: string;
}

function generateDonations(count: number): Donation[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `donation-${i}`,
    amount: Math.floor(Math.random() * 500) + 10,
    donor: `Donor ${i + 1}`,
  }));
}

// => Expensive component: memoized to skip renders when props unchanged
const ExpensiveDonationList = memo(
  ({ donations, query }: { donations: Donation[]; query: string }) => {
    // => Simulate expensive render (100ms block)
    const startTime = performance.now();
    while (performance.now() - startTime < 100) {
      // => In production: complex calculations, heavy rendering
    }

    const filtered = donations.filter((d) =>
      d.donor.toLowerCase().includes(query.toLowerCase())
    );

    return (
      <div>
        <p>Showing {filtered.length} of {donations.length} donations</p>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd' }}>
          {filtered.map((donation) => (
            <div
              key={donation.id}
              style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}
            >
              ${donation.amount} from {donation.donor}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

function DeferredValueDemo() {
  const [donations] = useState(() => generateDonations(1000));

  const [query, setQuery] = useState('');
  // => query: urgent, updates immediately

  // => deferredQuery: can lag behind query during expensive renders
  const deferredQuery = useDeferredValue(query);
  // => Keeps input responsive

  const isStale = query !== deferredQuery;
  // => true when deferredQuery hasn't caught up to query

  return (
    <div>
      <h2>useDeferredValue Demo</h2>

      <div style={{ marginBottom: '16px' }}>
        <label>
          Search donations (try typing quickly):
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            // => query updates immediately (input responsive)
            style={{
              padding: '8px',
              fontSize: '16px',
              width: '100%',
              marginTop: '8px',
            }}
            placeholder="Search by donor name..."
          />
        </label>
      </div>

      {/* => Show indicator when deferred value lagging */}
      {isStale && (
        <div style={{ padding: '8px', backgroundColor: '#FFF8E1', marginBottom: '16px' }}>
          ⏳ Updating results...
        </div>
      )}

      {/* => Dim list during update */}
      <div style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        <ExpensiveDonationList donations={donations} query={deferredQuery} />
        {/* => Uses deferredQuery (can be stale), not query */}
      </div>

      {/* => Comparison */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F0F0F0' }}>
        <h3>useDeferredValue vs useMemo:</h3>
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Aspect</th>
              <th>useMemo</th>
              <th>useDeferredValue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Purpose</td>
              <td>Memoize computed value</td>
              <td>Defer expensive renders</td>
            </tr>
            <tr>
              <td>When Recomputes</td>
              <td>Dependencies change</td>
              <td>Value changes + React idle</td>
            </tr>
            <tr>
              <td>Input Responsiveness</td>
              <td>Can block if computation slow</td>
              <td>Never blocks (defers update)</td>
            </tr>
            <tr>
              <td>Use Case</td>
              <td>Expensive calculations</td>
              <td>Expensive rendering</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* => Usage notes */}
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#E3F2FD' }}>
        <h4>How useDeferredValue Works:</h4>
        <ol>
          <li>User types in input → query state updates immediately</li>
          <li>React attempts to render with new deferredQuery</li>
          <li>Render is expensive (takes time) → React continues with stale value</li>
          <li>Input stays responsive, shows stale results temporarily</li>
          <li>When React idle → completes render with new value</li>
        </ol>
        <h4>When to Use useDeferredValue:</h4>
        <ul>
          <li>Expensive list rendering based on search/filter</li>
          <li>Charts/visualizations updating from input</li>
          <li>Any slow UI update during user interaction</li>
        </ul>
        <h4>Benefits:</h4>
        <ul>
          <li>Input never lags (always responsive)</li>
          <li>No manual debouncing needed</li>
          <li>React automatically optimizes timing</li>
          <li>Better UX than blocking updates</li>
        </ul>
      </div>
    </div>
  );
}

export default DeferredValueDemo;
```

**Key Takeaway**: useDeferredValue defers expensive renders by allowing React to show stale values during expensive updates. Input stays responsive while expensive component updates in background. Automatically handles timing - no manual debouncing needed. Use for expensive rendering based on user input.

**Why It Matters**: useDeferredValue provides an alternative approach to startTransition when you don't control where the state update originates. While startTransition wraps state updates, useDeferredValue accepts any value and provides a deferred version that lags behind during fast updates. This is particularly useful when the expensive computation is in a child component and you can't refactor to use startTransition at the source. Production use cases: expensive chart re-renders, complex text highlighting in editors, and filter/search result lists that should show stale results while new results compute. useDeferredValue and startTransition are complementary tools for React 18 concurrency.

### Example 19: Error Boundaries with Retry Logic

Error boundaries catch React component errors and show fallback UI. Add retry logic to recover from transient failures.

```mermaid
graph TD
    A["Component mounts\nfetch fails"] -->|"error caught"| B["Error Boundary\nerrorInfo captured"]
    B -->|"1st retry"| C["Fetch attempt 2\ndelay 1s"]
    C -->|"fails again"| D["2nd retry\ndelay 2s"]
    D -->|"fails again"| E["3rd retry\ndelay 4s"]
    E -->|"success"| F["Component renders\nerror cleared"]
    E -->|"max retries"| G["Permanent error state\nManual retry button"]

    style A fill:#CC78BC,stroke:#000,color:#000
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#CA9161,stroke:#000,color:#000
    style D fill:#CA9161,stroke:#000,color:#000
    style E fill:#CA9161,stroke:#000,color:#000
    style F fill:#029E73,stroke:#000,color:#fff
    style G fill:#CC78BC,stroke:#000,color:#000
```

**Error boundary retry**: Automatic retries with exponential backoff and manual fallback.

```typescript
import { Component, ReactNode, useState } from 'react';

// => Error boundary props interface
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

// => Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;                       // => Track retry attempts
}

// => Error boundary class component
// => Must be class component (no hooks equivalent yet)
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // => Initial state: no error
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  // => Static method called when child component throws error
  // => Returns new state to render fallback UI
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // => Update state to trigger fallback render
    return {
      hasError: true,
      error,
    };
  }

  // => Lifecycle method called after error caught
  // => Used for error logging, analytics
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // => Log error details
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    // => In production: send to error tracking service (Sentry, LogRocket, etc.)

    // => Update state with error details
    this.setState({
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });
  }

  // => Retry handler
  // => Resets error state, attempts to render children again
  handleRetry = () => {
    console.log('Retrying render...');
    // => Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      // => Keep errorCount to track retry attempts
    });
    // => Children re-render when state updates
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // => Error occurred, render fallback UI
      if (this.props.fallback) {
        // => Use custom fallback if provided
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // => Default fallback UI
      return (
        <div style={{ padding: '24px', backgroundColor: '#FFEBEE', borderRadius: '8px' }}>
          <h2 style={{ color: '#C62828' }}>⚠️ Something went wrong</h2>
          <details style={{ marginTop: '16px', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 'bold' }}>Error details</summary>
            <pre style={{ marginTop: '8px', fontSize: '12px', overflow: 'auto' }}>
              {this.state.error.toString()}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
          <p style={{ marginTop: '16px', color: '#666' }}>
            Retry attempts: {this.state.errorCount}
          </p>
        </div>
      );
    }

    // => No error, render children normally
    return this.props.children;
  }
}

// => Buggy component for demonstration
// => Throws error when shouldFail is true
function BuggyDonationForm({ shouldFail }: { shouldFail: boolean }) {
  if (shouldFail) {
    // => Simulate runtime error
    throw new Error('Failed to load donation form: API connection timeout');
    // => Error boundary catches this error
  }

  return (
    <div style={{ padding: '16px', border: '1px solid #4CAF50', borderRadius: '8px' }}>
      <h3>Donation Form</h3>
      <form>
        <label>
          Amount: $
          <input type="number" placeholder="100" />
        </label>
        <button type="submit">Submit Donation</button>
      </form>
    </div>
  );
}

function ErrorBoundaryDemo() {
  const [shouldFail, setShouldFail] = useState(false);
  const [key, setKey] = useState(0);
  // => Key forces unmount/remount of BuggyDonationForm

  // => Toggle error state
  const handleToggleError = () => {
    setShouldFail(!shouldFail);
    // => Next render: BuggyDonationForm throws or succeeds
  };

  // => Force retry by remounting component
  const handleForceRetry = () => {
    setKey((prev) => prev + 1);
    // => Changing key forces React to unmount and remount
    // => Fresh component instance, error boundary resets
  };

  return (
    <div>
      <h2>Error Boundary with Retry Logic</h2>

      {/* => Controls */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleToggleError}
          style={{
            padding: '12px 24px',
            marginRight: '8px',
            backgroundColor: shouldFail ? '#4CAF50' : '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {shouldFail ? 'Fix Component' : 'Break Component'}
        </button>
        <button
          onClick={handleForceRetry}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Force Retry (Remount)
        </button>
      </div>

      {/* => Error boundary wraps potentially buggy component */}
      <ErrorBoundary
        key={key}
        // => Key prop forces boundary to reset on remount
        fallback={(error, retry) => (
          // => Custom fallback UI
          <div
            style={{
              padding: '24px',
              backgroundColor: '#FFEBEE',
              borderRadius: '8px',
              border: '2px solid #C62828',
            }}
          >
            <h3 style={{ color: '#C62828' }}>⚠️ Donation Form Error</h3>
            <p style={{ marginTop: '12px' }}>
              We encountered an error loading the donation form. This could be due to:
            </p>
            <ul style={{ marginTop: '8px' }}>
              <li>Network connection issues</li>
              <li>Server timeout</li>
              <li>Temporary service unavailability</li>
            </ul>
            <details style={{ marginTop: '16px', cursor: 'pointer' }}>
              <summary style={{ fontWeight: 'bold', color: '#666' }}>
                Technical details
              </summary>
              <pre
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  overflow: 'auto',
                  backgroundColor: '#FFF',
                  padding: '12px',
                  borderRadius: '4px',
                }}
              >
                {error.message}
              </pre>
            </details>
            <button
              onClick={retry}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry Loading Form
            </button>
            <p style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
              If problem persists, please contact support.
            </p>
          </div>
        )}
      >
        {/* => Component that might throw error */}
        <BuggyDonationForm shouldFail={shouldFail} />
        {/* => Error boundary catches errors from children */}
      </ErrorBoundary>

      {/* => Usage notes */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#E3F2FD' }}>
        <h3>Error Boundary Features:</h3>
        <ul>
          <li>Catches errors in child component tree</li>
          <li>Prevents entire app crash</li>
          <li>Shows user-friendly fallback UI</li>
          <li>Provides retry mechanism for recovery</li>
          <li>Logs errors for debugging/monitoring</li>
        </ul>
        <h3>What Error Boundaries Catch:</h3>
        <ul>
          <li>Render errors (component lifecycle)</li>
          <li>Constructor errors</li>
          <li>useEffect errors (some cases)</li>
        </ul>
        <h3>What Error Boundaries DON'T Catch:</h3>
        <ul>
          <li>Event handler errors (use try-catch)</li>
          <li>Async code errors (use .catch())</li>
          <li>Server-side rendering errors</li>
          <li>Errors in error boundary itself</li>
        </ul>
      </div>
    </div>
  );
}

export default ErrorBoundaryDemo;
```

**Key Takeaway**: Error boundaries catch component errors and show fallback UI, preventing entire app crash. Must be class components (no hooks equivalent yet). Add retry logic to recover from transient failures. Use custom fallback UI for user-friendly error messages. Log errors to monitoring services for debugging.

**Why It Matters**: Error Boundaries with retry logic transform transient failures into recoverable experiences rather than dead ends. Production network environments are unreliable: mobile users switch between WiFi and cellular, corporate firewalls occasionally block requests, CDNs experience brief outages. Without retry, any transient error shows a permanent error screen until the user manually refreshes. Automatic retry with exponential backoff handles transient failures transparently. Manual retry (retry button) handles failures the user is aware of and can act on. The combination of both - automatic retry for network errors, manual retry for server errors - provides the resilience users expect from production applications.

### Example 20: Render-as-You-Fetch Pattern

Render-as-you-fetch starts data fetching early (before render), enabling faster page loads. Combine with Suspense for optimal loading UX.

```typescript
import { Suspense, useState, lazy } from 'react';

// => Resource interface for Suspense-compatible fetching
interface Resource<T> {
  read(): T;
}

// => Wrap promise for Suspense
function wrapPromise<T>(promise: Promise<T>): Resource<T> {
  let status: 'pending' | 'success' | 'error' = 'pending';
  let result: T;
  let error: any;

  const suspender = promise.then(
    (data) => {
      status = 'success';
      result = data;
    },
    (err) => {
      status = 'error';
      error = err;
    }
  );

  return {
    read(): T {
      if (status === 'pending') throw suspender;
      if (status === 'error') throw error;
      return result;
    },
  };
}

// => Domain interfaces
interface DonationSummary {
  totalAmount: number;
  donationCount: number;
  topDonor: string;
}

interface Donation {
  id: string;
  amount: number;
  donor: string;
}

// => API functions
// => Return resources immediately (don't wait)
function fetchDonationSummary(): Resource<DonationSummary> {
  const promise = new Promise<DonationSummary>((resolve) => {
    setTimeout(() => {
      // => Simulate 2-second API call
      resolve({
        totalAmount: 12500,
        donationCount: 45,
        topDonor: 'Aisha',
      });
    }, 2000);
  });

  return wrapPromise(promise);
  // => Returns resource immediately, starts fetching in background
}

function fetchDonations(): Resource<Donation[]> {
  const promise = new Promise<Donation[]>((resolve) => {
    setTimeout(() => {
      // => Simulate 1.5-second API call
      resolve([
        { id: '1', amount: 100, donor: 'Aisha' },
        { id: '2', amount: 250, donor: 'Omar' },
        { id: '3', amount: 75, donor: 'Fatima' },
      ]);
    }, 1500);
  });

  return wrapPromise(promise);
  // => Returns resource immediately, starts fetching in background
}

// => Summary component (reads from resource)
function DonationSummary({ resource }: { resource: Resource<DonationSummary> }) {
  const summary = resource.read();
  // => Suspends if data not ready
  // => Returns data when ready

  return (
    <div style={{ padding: '16px', backgroundColor: '#E3F2FD', borderRadius: '8px' }}>
      <h3>Donation Summary</h3>
      <p><strong>Total Amount:</strong> ${summary.totalAmount}</p>
      <p><strong>Total Donations:</strong> {summary.donationCount}</p>
      <p><strong>Top Donor:</strong> {summary.topDonor}</p>
    </div>
  );
}

// => List component (reads from resource)
function DonationList({ resource }: { resource: Resource<Donation[]> }) {
  const donations = resource.read();
  // => Suspends if data not ready
  // => Returns data when ready

  return (
    <div style={{ marginTop: '16px' }}>
      <h3>Recent Donations</h3>
      <ul>
        {donations.map((donation) => (
          <li key={donation.id}>
            ${donation.amount} from {donation.donor}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RenderAsFetchDemo() {
  const [showDashboard, setShowDashboard] = useState(false);

  // => ANTI-PATTERN: Fetch-on-render
  // => Resources created AFTER render starts
  // => Sequential loading (slow)
  const handleFetchOnRender = () => {
    setShowDashboard(true);
    // => Component renders first
    // => Then creates resources (starts fetching)
    // => Then waits for data
    // => SLOW: render → fetch → wait
  };

  // => PATTERN: Render-as-you-fetch
  // => Resources created BEFORE render starts
  // => Parallel loading (fast)
  const [resources, setResources] = useState<{
    summary: Resource<DonationSummary> | null;
    donations: Resource<Donation[]> | null;
  }>({ summary: null, donations: null });

  const handleRenderAsFetch = () => {
    // => Start fetching IMMEDIATELY (before render)
    // => Both requests start in parallel
    const summaryResource = fetchDonationSummary();
    const donationsResource = fetchDonations();
    // => Fetching started, resources created

    // => Store resources
    setResources({
      summary: summaryResource,
      donations: donationsResource,
    });

    // => Show dashboard
    setShowDashboard(true);
    // => Render starts with fetching already in progress
    // => FAST: fetch → render → wait (parallel)
  };

  return (
    <div>
      <h2>Render-as-You-Fetch Pattern</h2>

      {/* => Action buttons */}
      {!showDashboard && (
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleRenderAsFetch}
            style={{
              padding: '12px 24px',
              marginRight: '8px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Load Dashboard (Render-as-Fetch)
          </button>
          <p style={{ marginTop: '8px', color: '#666' }}>
            ✓ Starts fetching before render (parallel, fast)
          </p>
        </div>
      )}

      {/* => Dashboard with render-as-fetch pattern */}
      {showDashboard && resources.summary && resources.donations && (
        <div>
          {/* => Summary suspends while loading */}
          <Suspense
            fallback={
              <div style={{ padding: '16px', backgroundColor: '#F5F5F5' }}>
                Loading summary...
              </div>
            }
          >
            <DonationSummary resource={resources.summary} />
            {/* => Reads from resource (suspends if not ready) */}
          </Suspense>

          {/* => List suspends independently */}
          <Suspense
            fallback={
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#F5F5F5' }}>
                Loading donations...
              </div>
            }
          >
            <DonationList resource={resources.donations} />
            {/* => Reads from resource (suspends if not ready) */}
          </Suspense>

          <button
            onClick={() => {
              setShowDashboard(false);
              setResources({ summary: null, donations: null });
            }}
            style={{
              marginTop: '24px',
              padding: '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset Demo
          </button>
        </div>
      )}

      {/* => Pattern comparison */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F0F0F0' }}>
        <h3>Pattern Comparison:</h3>
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Execution Order</th>
              <th>Total Time</th>
              <th>UX</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Fetch-on-Render</strong></td>
              <td>
                1. Render component<br />
                2. Start fetch 1<br />
                3. Wait for fetch 1<br />
                4. Start fetch 2<br />
                5. Wait for fetch 2
              </td>
              <td>2s + 1.5s = 3.5s</td>
              <td>Sequential, slow</td>
            </tr>
            <tr style={{ backgroundColor: '#C8E6C9' }}>
              <td><strong>Render-as-Fetch</strong></td>
              <td>
                1. Start fetch 1 & 2 (parallel)<br />
                2. Render component<br />
                3. Wait for both fetches
              </td>
              <td>max(2s, 1.5s) = 2s</td>
              <td>Parallel, fast ✓</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* => Usage notes */}
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#E3F2FD' }}>
        <h4>Render-as-You-Fetch Benefits:</h4>
        <ul>
          <li><strong>Parallel fetching:</strong> Multiple requests start simultaneously</li>
          <li><strong>Early fetching:</strong> Requests start before component renders</li>
          <li><strong>Faster page loads:</strong> Total time = slowest request (not sum)</li>
          <li><strong>Better UX:</strong> Content appears as soon as ready</li>
        </ul>
        <h4>Implementation Steps:</h4>
        <ol>
          <li>Create resource functions that return immediately</li>
          <li>Call resource functions BEFORE showing component</li>
          <li>Pass resources to components via props</li>
          <li>Components read() from resources (suspend if not ready)</li>
          <li>Suspense boundaries handle loading states</li>
        </ol>
        <h4>Best Practices:</h4>
        <ul>
          <li>Start fetching as early as possible (event handlers, route changes)</li>
          <li>Use separate Suspense boundaries for independent data</li>
          <li>Show progressive loading (parts of UI load independently)</li>
          <li>Combine with React Router for route-level fetching</li>
        </ul>
      </div>
    </div>
  );
}

export default RenderAsFetchDemo;
```

**Key Takeaway**: Render-as-you-fetch starts data fetching before component renders, enabling parallel requests and faster page loads. Create resources immediately, pass to components, components read() and suspend if not ready. Combines with Suspense for progressive loading. Much faster than fetch-on-render (sequential) pattern.

**Why It Matters**: The Render-as-You-Fetch pattern is the correct approach to eliminating loading waterfalls in Suspense-enabled applications. The waterfall problem: first render shows spinner, then fetches user, then user data arrives, then fetches user's organization, then that arrives, then renders content. Each step waits for the previous, multiplying latency. Render-as-You-Fetch starts all fetches immediately when the user navigates, before any rendering happens. When components finally render, their data is already in-flight or loaded. Combined with React Query's prefetching APIs, this pattern reduces perceived page load time significantly for complex pages with multiple data dependencies.

## Group 5: Testing, Security, and Production (5 examples)

### Example 21: Vitest with React Testing Library

Vitest provides fast unit testing for React components. React Testing Library enables user-centric testing focusing on behavior, not implementation.

```mermaid
graph TD
    A["Component under test"] -->|"render()"| B["React Testing Library\nDOM"]
    B -->|"getByRole('button')"| C["Button element"]
    C -->|"userEvent.click()"| D["Click event fires"]
    D -->|"state update"| E["Re-render"]
    E -->|"expect(screen.getByText(...))"| F["Assertion: text visible"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#CA9161,stroke:#000,color:#000
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#CC78BC,stroke:#000,color:#000
```

**RTL testing**: Test user behavior (what users see/do), not implementation details.

```typescript
// DonationForm.tsx - Component to test
import { useState } from 'react';

export interface DonationFormProps {
  onSubmit: (amount: number, donor: string) => void;
}

export function DonationForm({ onSubmit }: DonationFormProps) {
  const [amount, setAmount] = useState(0);
  const [donor, setDonor] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // => Validation
    if (amount <= 0) {
      setError('Amount must be greater than \$0');
      return;
    }

    if (donor.trim() === '') {
      setError('Donor name is required');
      return;
    }

    // => Clear error and submit
    setError('');
    onSubmit(amount, donor);

    // => Reset form
    setAmount(0);
    setDonor('');
  };

  return (
    <form onSubmit={handleSubmit} data-testid="donation-form">
      <div>
        <label htmlFor="amount">Amount: $</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          data-testid="amount-input"
        />
      </div>

      <div>
        <label htmlFor="donor">Donor Name:</label>
        <input
          id="donor"
          type="text"
          value={donor}
          onChange={(e) => setDonor(e.target.value)}
          data-testid="donor-input"
        />
      </div>

      {error && (
        <div role="alert" style={{ color: 'red' }}>
          {error}
        </div>
      )}

      <button type="submit" data-testid="submit-button">
        Submit Donation
      </button>
    </form>
  );
}

// DonationForm.test.tsx - Vitest + React Testing Library tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonationForm } from './DonationForm';

// => Test suite for DonationForm component
describe('DonationForm', () => {
  // => Test: renders form fields
  it('renders amount input, donor input, and submit button', () => {
    // => Arrange: render component with mock onSubmit
    const mockOnSubmit = vi.fn();
    // => vi.fn() creates mock function for testing
    render(<DonationForm onSubmit={mockOnSubmit} />);

    // => Assert: form fields present in DOM
    // => screen queries simulate user perspective
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    // => getByLabelText finds input by associated label
    expect(screen.getByLabelText(/donor name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit donation/i })).toBeInTheDocument();
    // => getByRole finds button by accessible role and name
  });

  // => Test: submits form with valid data
  it('calls onSubmit with form data when valid', async () => {
    // => Arrange
    const mockOnSubmit = vi.fn();
    render(<DonationForm onSubmit={mockOnSubmit} />);
    const user = userEvent.setup();
    // => userEvent provides realistic user interactions

    // => Act: user enters data and submits
    const amountInput = screen.getByLabelText(/amount/i);
    const donorInput = screen.getByLabelText(/donor name/i);
    const submitButton = screen.getByRole('button', { name: /submit donation/i });

    await user.type(amountInput, '100');
    // => Types '100' into amount input (realistic typing)
    await user.type(donorInput, 'Aisha');
    // => Types 'Aisha' into donor input
    await user.click(submitButton);
    // => Clicks submit button

    // => Assert: onSubmit called with correct data
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    // => Called exactly once
    expect(mockOnSubmit).toHaveBeenCalledWith(100, 'Aisha');
    // => Called with amount 100 and donor 'Aisha'
  });

  // => Test: validation error for zero amount
  it('shows error when amount is zero', async () => {
    // => Arrange
    const mockOnSubmit = vi.fn();
    render(<DonationForm onSubmit={mockOnSubmit} />);
    const user = userEvent.setup();

    // => Act: submit with zero amount
    const donorInput = screen.getByLabelText(/donor name/i);
    await user.type(donorInput, 'Omar');
    // => Enter donor name but leave amount at 0

    const submitButton = screen.getByRole('button', { name: /submit donation/i });
    await user.click(submitButton);

    // => Assert: error message shown, onSubmit not called
    expect(screen.getByRole('alert')).toHaveTextContent('Amount must be greater than \$0');
    // => Error message displayed in alert role
    expect(mockOnSubmit).not.toHaveBeenCalled();
    // => onSubmit should not be called on validation error
  });

  // => Test: validation error for empty donor name
  it('shows error when donor name is empty', async () => {
    // => Arrange
    const mockOnSubmit = vi.fn();
    render(<DonationForm onSubmit={mockOnSubmit} />);
    const user = userEvent.setup();

    // => Act: submit with amount but no donor name
    const amountInput = screen.getByLabelText(/amount/i);
    await user.type(amountInput, '50');

    const submitButton = screen.getByRole('button', { name: /submit donation/i });
    await user.click(submitButton);

    // => Assert: error message shown, onSubmit not called
    expect(screen.getByRole('alert')).toHaveTextContent('Donor name is required');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // => Test: form resets after successful submission
  it('resets form after successful submission', async () => {
    // => Arrange
    const mockOnSubmit = vi.fn();
    render(<DonationForm onSubmit={mockOnSubmit} />);
    const user = userEvent.setup();

    // => Act: submit valid form
    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
    const donorInput = screen.getByLabelText(/donor name/i) as HTMLInputElement;

    await user.type(amountInput, '75');
    await user.type(donorInput, 'Fatima');

    const submitButton = screen.getByRole('button', { name: /submit donation/i });
    await user.click(submitButton);

    // => Assert: inputs cleared after submission
    await waitFor(() => {
      expect(amountInput.value).toBe('0');
      // => Amount reset to 0
      expect(donorInput.value).toBe('');
      // => Donor name cleared
    });
    // => waitFor waits for async state updates
  });

  // => Test: clears error on valid submission
  it('clears previous error when submitting valid form', async () => {
    // => Arrange
    const mockOnSubmit = vi.fn();
    render(<DonationForm onSubmit={mockOnSubmit} />);
    const user = userEvent.setup();

    // => Act: trigger error first
    const submitButton = screen.getByRole('button', { name: /submit donation/i });
    await user.click(submitButton);
    // => Error shown for missing donor name

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // => Act: submit valid form
    const amountInput = screen.getByLabelText(/amount/i);
    const donorInput = screen.getByLabelText(/donor name/i);
    await user.type(amountInput, '200');
    await user.type(donorInput, 'Ali');
    await user.click(submitButton);

    // => Assert: error cleared
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // => queryByRole returns null if not found (no error)
    expect(mockOnSubmit).toHaveBeenCalledWith(200, 'Ali');
  });
});
```

**Key Takeaway**: Vitest provides fast unit testing with vi.fn() mocks. React Testing Library enables user-centric testing focusing on behavior (what user sees/does), not implementation details. Use screen queries (getByRole, getByLabelText) to find elements as users would. userEvent provides realistic user interactions. Test behavior, not internal state.

**Why It Matters**: The testing patterns in this example represent the production testing philosophy for React: test user behavior, not implementation details. React Testing Library's `getByRole`, `userEvent.click`, and `expect(element).toBeInTheDocument()` assertions verify what users see and can do, not how components are internally structured. This makes tests resilient to refactoring: you can completely rewrite a component's implementation as long as the user-visible behavior remains the same. Production test suites built on this philosophy require less maintenance and provide more confidence than test suites that assert on state variables, DOM structure, or implementation functions.

### Example 22: Testing Custom Hooks

Test custom hooks in isolation using @testing-library/react-hooks. Focus on hook logic without rendering components.

```typescript
// useDonationForm.ts - Custom hook to test
import { useState } from "react";

export interface UseDonationFormReturn {
  amount: number;
  donor: string;
  error: string;
  isValid: boolean;
  setAmount: (amount: number) => void;
  setDonor: (donor: string) => void;
  submitDonation: () => boolean;
  resetForm: () => void;
}

export function useDonationForm(): UseDonationFormReturn {
  const [amount, setAmount] = useState(0);
  const [donor, setDonor] = useState("");
  const [error, setError] = useState("");

  // => Validation logic
  const isValid = amount > 0 && donor.trim() !== "";

  // => Submit handler
  const submitDonation = (): boolean => {
    // => Validate amount
    if (amount <= 0) {
      setError("Amount must be greater than \$0");
      return false;
    }

    // => Validate donor name
    if (donor.trim() === "") {
      setError("Donor name is required");
      return false;
    }

    // => Clear error on valid submission
    setError("");
    return true;
  };

  // => Reset form
  const resetForm = () => {
    setAmount(0);
    setDonor("");
    setError("");
  };

  return {
    amount,
    donor,
    error,
    isValid,
    setAmount,
    setDonor,
    submitDonation,
    resetForm,
  };
}

// useDonationForm.test.ts - Hook tests
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDonationForm } from "./useDonationForm";

// => Test suite for useDonationForm hook
describe("useDonationForm", () => {
  // => Test: initial state
  it("initializes with default values", () => {
    // => Arrange & Act: render hook
    const { result } = renderHook(() => useDonationForm());
    // => renderHook() renders hook in test component
    // => result.current contains hook return value

    // => Assert: initial values correct
    expect(result.current.amount).toBe(0);
    // => amount starts at 0
    expect(result.current.donor).toBe("");
    // => donor starts empty
    expect(result.current.error).toBe("");
    // => no error initially
    expect(result.current.isValid).toBe(false);
    // => form not valid initially (amount 0, donor empty)
  });

  // => Test: updating amount
  it("updates amount when setAmount called", () => {
    // => Arrange
    const { result } = renderHook(() => useDonationForm());

    // => Act: update amount
    act(() => {
      result.current.setAmount(100);
      // => act() wraps state updates
      // => Ensures React processes updates before assertions
    });

    // => Assert: amount updated
    expect(result.current.amount).toBe(100);
    // => amount now 100
  });

  // => Test: updating donor name
  it("updates donor when setDonor called", () => {
    // => Arrange
    const { result } = renderHook(() => useDonationForm());

    // => Act: update donor
    act(() => {
      result.current.setDonor("Aisha");
    });

    // => Assert: donor updated
    expect(result.current.donor).toBe("Aisha");
  });

  // => Test: isValid computation
  it("computes isValid based on amount and donor", () => {
    // => Arrange
    const { result } = renderHook(() => useDonationForm());

    // => Initially invalid (amount 0, donor empty)
    expect(result.current.isValid).toBe(false);

    // => Act: set valid amount, donor still empty
    act(() => {
      result.current.setAmount(50);
    });

    // => Assert: still invalid (donor required)
    expect(result.current.isValid).toBe(false);

    // => Act: set valid donor
    act(() => {
      result.current.setDonor("Omar");
    });

    // => Assert: now valid (both amount and donor present)
    expect(result.current.isValid).toBe(true);
  });

  // => Test: submitDonation validation (zero amount)
  it("returns false and sets error when amount is zero", () => {
    // => Arrange
    const { result } = renderHook(() => useDonationForm());

    act(() => {
      result.current.setDonor("Fatima");
      // => Set valid donor, leave amount at 0
    });

    // => Act: attempt submission with zero amount
    let submitResult: boolean = false;
    act(() => {
      submitResult = result.current.submitDonation();
    });

    // => Assert: submission failed, error set
    expect(submitResult).toBe(false);
    // => submitDonation returns false
    expect(result.current.error).toBe("Amount must be greater than \$0");
    // => Error message set
  });

  // => Test: submitDonation validation (empty donor)
  it("returns false and sets error when donor is empty", () => {
    // => Arrange
    const { result } = renderHook(() => useDonationForm());

    act(() => {
      result.current.setAmount(75);
      // => Set valid amount, leave donor empty
    });

    // => Act: attempt submission with empty donor
    let submitResult: boolean = false;
    act(() => {
      submitResult = result.current.submitDonation();
    });

    // => Assert: submission failed, error set
    expect(submitResult).toBe(false);
    expect(result.current.error).toBe("Donor name is required");
  });

  // => Test: submitDonation success
  it("returns true and clears error when form valid", () => {
    // => Arrange
    const { result } = renderHook(() => useDonationForm());

    act(() => {
      result.current.setAmount(100);
      result.current.setDonor("Ali");
      // => Set valid amount and donor
    });

    // => Act: submit valid form
    let submitResult: boolean = false;
    act(() => {
      submitResult = result.current.submitDonation();
    });

    // => Assert: submission succeeded, no error
    expect(submitResult).toBe(true);
    // => submitDonation returns true
    expect(result.current.error).toBe("");
    // => No error message
  });

  // => Test: resetForm
  it("resets all form fields to initial state", () => {
    // => Arrange: set form values
    const { result } = renderHook(() => useDonationForm());

    act(() => {
      result.current.setAmount(200);
      result.current.setDonor("Zahra");
      result.current.submitDonation();
      // => Set values and submit
    });

    // => Act: reset form
    act(() => {
      result.current.resetForm();
    });

    // => Assert: all fields reset to initial values
    expect(result.current.amount).toBe(0);
    expect(result.current.donor).toBe("");
    expect(result.current.error).toBe("");
    expect(result.current.isValid).toBe(false);
  });

  // => Test: error cleared on valid submission
  it("clears previous error on valid submission", () => {
    // => Arrange: trigger error first
    const { result } = renderHook(() => useDonationForm());

    act(() => {
      result.current.submitDonation();
      // => Submit with invalid data (amount 0, donor empty)
    });

    expect(result.current.error).not.toBe("");
    // => Error set

    // => Act: submit valid form
    act(() => {
      result.current.setAmount(150);
      result.current.setDonor("Hassan");
      result.current.submitDonation();
    });

    // => Assert: error cleared
    expect(result.current.error).toBe("");
  });
});
```

**Key Takeaway**: Test custom hooks in isolation using renderHook() from @testing-library/react. Wrap state updates in act() to ensure React processes updates before assertions. Test hook logic (return values, state updates, computed values) without rendering UI components. Focus on hook behavior, not implementation details.

**Why It Matters**: Accessibility testing automation catches the structural accessibility violations that visual inspection misses. `jest-axe` verifies: color contrast ratios, ARIA role correctness, required ARIA attributes, focusable element order, and label associations. Production applications are legally required to meet WCAG 2.1 AA standards in many jurisdictions. Accessibility testing integrated into CI prevents regression: once accessible, your application stays accessible. Manual accessibility testing (screen reader walkthroughs, keyboard navigation testing) catches behavioral issues that automated tools can't detect, but automated testing provides the continuous safety net. Building accessible applications from the start is far cheaper than retrofitting accessibility after launch.

### Example 23: XSS Prevention and Input Sanitization

Prevent Cross-Site Scripting (XSS) attacks by sanitizing user input and using React's built-in protections. Never use dangerouslySetInnerHTML with unsanitized content.

```typescript
import { useState } from 'react';
import DOMPurify from 'dompurify';

function XSSPreventionDemo() {
  const [userInput, setUserInput] = useState('');
  const [displayMethod, setDisplayMethod] = useState<'safe' | 'dangerous'>('safe');

  // => Malicious input examples for demonstration
  const maliciousExamples = [
    '<script>alert("XSS Attack!")</script>',
    // => Script tag attempts to execute JavaScript

    '<img src="x" onerror="alert(\'XSS\')">',
    // => Image with onerror handler

    '<a href="javascript:alert(\'XSS\')">Click me</a>',
    // => Link with javascript: protocol

    '<div onload="alert(\'XSS\')">Text</div>',
    // => Event handler in div

    'Hello <b onmouseover="alert(\'XSS\')">World</b>',
    // => Event handler in bold tag
  ];

  // => Sanitize HTML using DOMPurify
  // => Removes dangerous elements and attributes
  const sanitizedHTML = DOMPurify.sanitize(userInput);
  // => DOMPurify strips <script>, event handlers, javascript: protocols
  // => Returns safe HTML string

  return (
    <div>
      <h2>XSS Prevention and Input Sanitization</h2>

      {/* => Input area */}
      <div style={{ marginBottom: '24px' }}>
        <label>
          <strong>User Input:</strong>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '12px',
              fontFamily: 'monospace',
              marginTop: '8px',
            }}
            placeholder="Enter HTML (try malicious examples below)..."
          />
        </label>

        {/* => Quick test buttons */}
        <div style={{ marginTop: '12px' }}>
          <p><strong>Test with malicious input:</strong></p>
          {maliciousExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => setUserInput(example)}
              style={{
                marginRight: '8px',
                marginBottom: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: '#FF5722',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Example {index + 1}
            </button>
          ))}
          <button
            onClick={() => setUserInput('')}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* => Display method selector */}
      <div style={{ marginBottom: '24px' }}>
        <label>
          <strong>Display Method:</strong>
          <select
            value={displayMethod}
            onChange={(e) => setDisplayMethod(e.target.value as 'safe' | 'dangerous')}
            style={{ marginLeft: '12px', padding: '8px' }}
          >
            <option value="safe">✓ Safe (React default)</option>
            <option value="dangerous">✗ Dangerous (dangerouslySetInnerHTML)</option>
          </select>
        </label>
      </div>

      {/* => Safe display (React default) */}
      {displayMethod === 'safe' && (
        <div style={{ padding: '16px', backgroundColor: '#C8E6C9', borderRadius: '8px' }}>
          <h3>✓ Safe Display (React Default)</h3>
          <p style={{ color: '#666', marginBottom: '12px' }}>
            React automatically escapes content in JSX. Scripts and event handlers won't execute.
          </p>

          {/* => React escapes userInput automatically */}
          {/* => <script> tags rendered as text, not executed */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #4CAF50',
            }}
          >
            <strong>Rendered Output:</strong>
            <div>{userInput}</div>
            {/* => React converts HTML tags to text */}
            {/* => <script> displays as literal text, doesn't execute */}
          </div>

          <details style={{ marginTop: '12px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              How React prevents XSS
            </summary>
            <ul style={{ marginTop: '8px' }}>
              <li>Automatically escapes text content in JSX</li>
              <li>Converts {"<"} to &lt;, {">"} to &gt;</li>
              <li>Scripts rendered as text, not executed</li>
              <li>Event handlers in strings ignored</li>
              <li>No special escaping needed by developer</li>
            </ul>
          </details>
        </div>
      )}

      {/* => Dangerous display (with sanitization) */}
      {displayMethod === 'dangerous' && (
        <div style={{ padding: '16px', backgroundColor: '#FFF8E1', borderRadius: '8px' }}>
          <h3>⚠️ Using dangerouslySetInnerHTML (Sanitized with DOMPurify)</h3>
          <p style={{ color: '#666', marginBottom: '12px' }}>
            When you MUST render HTML, use DOMPurify to sanitize first. Never use dangerouslySetInnerHTML with raw user input.
          </p>

          {/* => Show raw input */}
          <div style={{ marginBottom: '12px' }}>
            <strong>Raw Input:</strong>
            <pre
              style={{
                padding: '12px',
                backgroundColor: '#FFCCBC',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
              }}
            >
              {userInput}
            </pre>
          </div>

          {/* => Show sanitized HTML */}
          <div style={{ marginBottom: '12px' }}>
            <strong>Sanitized HTML (DOMPurify):</strong>
            <pre
              style={{
                padding: '12px',
                backgroundColor: '#C8E6C9',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
              }}
            >
              {sanitizedHTML}
            </pre>
            {/* => DOMPurify removed <script>, event handlers, javascript: */}
          </div>

          {/* => Render sanitized HTML */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #FFA000',
            }}
          >
            <strong>Rendered Output:</strong>
            {/* => dangerouslySetInnerHTML with sanitized content */}
            {/* => DOMPurify ensures no scripts execute */}
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
              // => CRITICAL: Only use with sanitized content
              // => Never use with raw user input
            />
          </div>

          <details style={{ marginTop: '12px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#E65100' }}>
              DANGER: What DOMPurify removed
            </summary>
            <ul style={{ marginTop: '8px' }}>
              <li><code>{'<script>'}</code> tags (JavaScript execution)</li>
              <li>Event handlers (<code>onclick</code>, <code>onerror</code>, <code>onload</code>)</li>
              <li><code>javascript:</code> protocol in links</li>
              <li>Dangerous attributes (<code>formaction</code>, <code>data-*</code> with scripts)</li>
              <li>SVG/MathML with embedded scripts</li>
            </ul>
          </details>
        </div>
      )}

      {/* => Security guidelines */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#E3F2FD' }}>
        <h3>XSS Prevention Best Practices:</h3>

        <h4>✓ DO:</h4>
        <ul>
          <li><strong>Use React's default rendering</strong> - React escapes content automatically</li>
          <li><strong>Sanitize HTML</strong> - Use DOMPurify before dangerouslySetInnerHTML</li>
          <li><strong>Validate input</strong> - Check format, length, allowed characters</li>
          <li><strong>Content Security Policy</strong> - Use CSP headers to block inline scripts</li>
          <li><strong>HttpOnly cookies</strong> - Prevent JavaScript access to sensitive cookies</li>
        </ul>

        <h4>✗ DON'T:</h4>
        <ul>
          <li><strong>Never</strong> use dangerouslySetInnerHTML with unsanitized user input</li>
          <li><strong>Never</strong> trust user input (always validate and sanitize)</li>
          <li><strong>Never</strong> concatenate user input into HTML strings</li>
          <li><strong>Never</strong> use eval() or Function() with user input</li>
          <li><strong>Never</strong> disable React's XSS protections</li>
        </ul>

        <h4>Common XSS Attack Vectors:</h4>
        <ul>
          <li><code>{'<script>'}</code> tags in user input</li>
          <li>Event handlers in HTML attributes (<code>onclick</code>, <code>onerror</code>)</li>
          <li><code>javascript:</code> protocol in URLs</li>
          <li>CSS expressions with JavaScript</li>
          <li>SVG/MathML with embedded scripts</li>
        </ul>
      </div>
    </div>
  );
}

export default XSSPreventionDemo;
```

**Key Takeaway**: React automatically escapes content in JSX, preventing XSS attacks by default. Never use dangerouslySetInnerHTML with unsanitized user input. When rendering HTML is necessary, use DOMPurify to sanitize first. Validate and sanitize all user input. Use Content Security Policy headers for additional protection.

**Why It Matters**: Custom hooks testing verifies the state management logic independently from any rendering concern. useZakatCalculation manages the conversion between input values and calculated results - logic that matters for correctness but doesn't depend on which button the user clicked or which element displays the result. Testing hooks directly with renderHook gives you: precise control over inputs, clear assertion on outputs, and tests that run in milliseconds without mounting full component trees. Production hook tests serve as executable specifications of business logic. When the calculation rules change, failing tests immediately identify exactly what changed.

### Example 24: CSRF Protection Patterns

Prevent Cross-Site Request Forgery (CSRF) attacks using tokens and SameSite cookies. Verify request origin and use anti-CSRF tokens for state-changing operations.

```typescript
import { useState, useEffect } from 'react';

// => CSRF token management
// => Token stored in meta tag or fetched from API
function getCSRFToken(): string {
  // => Method 1: Read from meta tag (Django, Rails pattern)
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '';
  }

  // => Method 2: Read from cookie (if using cookie-based tokens)
  const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
  if (cookieMatch) {
    return cookieMatch[1];
  }

  // => Method 3: Fetch from API endpoint
  // => In production: GET request to /api/csrf-token
  return 'demo-csrf-token-' + Date.now();
}

// => Secure fetch wrapper with CSRF protection
// => Adds CSRF token to all state-changing requests
async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // => Only add CSRF token for state-changing methods
  // => GET and HEAD are safe methods (idempotent, no side effects)
  const needsCSRFToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    options.method?.toUpperCase() || 'GET'
  );

  if (needsCSRFToken) {
    // => Get CSRF token
    const csrfToken = getCSRFToken();

    // => Add CSRF token to headers
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
      // => Custom header with CSRF token
      // => Server validates this token
    };
  }

  // => Add credentials to include cookies
  // => SameSite cookies provide additional CSRF protection
  options.credentials = 'include';
  // => Sends cookies with request
  // => Server can verify session

  // => Make request with CSRF protection
  const response = await fetch(url, options);

  // => Check for CSRF error (403 Forbidden)
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.error === 'CSRF token invalid') {
      throw new Error('CSRF token validation failed. Please refresh the page.');
    }
  }

  return response;
}

function CSRFProtectionDemo() {
  const [csrfToken, setCSRFToken] = useState('');
  const [donationAmount, setDonationAmount] = useState(100);
  const [status, setStatus] = useState('');
  const [requestLog, setRequestLog] = useState<string[]>([]);

  // => Load CSRF token on mount
  useEffect(() => {
    const token = getCSRFToken();
    setCSRFToken(token);
    // => Token loaded from meta tag or API
  }, []);

  // => Simulate donation submission with CSRF protection
  const handleDonateWithCSRF = async () => {
    setStatus('Submitting donation...');
    addToLog('POST /api/donations (with CSRF token)');

    try {
      // => Use secure fetch with CSRF protection
      const response = await secureFetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: donationAmount,
          donor: 'Anonymous',
        }),
      });
      // => CSRF token automatically added by secureFetch

      if (response.ok) {
        setStatus('✓ Donation submitted successfully (CSRF protected)');
        addToLog('Response: 200 OK - CSRF token validated');
      } else {
        setStatus('✗ Donation failed');
        addToLog(`Response: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addToLog(`Error: ${error}`);
    }
  };

  // => Simulate donation without CSRF protection (VULNERABLE)
  const handleDonateWithoutCSRF = async () => {
    setStatus('Submitting donation (NO CSRF PROTECTION)...');
    addToLog('POST /api/donations (NO CSRF token) - VULNERABLE!');

    try {
      // => Regular fetch WITHOUT CSRF token
      // => Vulnerable to CSRF attacks
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        // => Sends cookies but no CSRF token
        body: JSON.stringify({
          amount: donationAmount,
          donor: 'Anonymous',
        }),
      });

      if (response.ok) {
        setStatus('✓ Donation submitted (but CSRF vulnerable!)');
        addToLog('Response: 200 OK - NO CSRF validation (DANGEROUS)');
      } else {
        setStatus('✗ Request blocked - CSRF token missing');
        addToLog(`Response: ${response.status} - CSRF token required`);
      }
    } catch (error) {
      setStatus(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addToLog(`Error: ${error}`);
    }
  };

  // => Add entry to request log
  const addToLog = (message: string) => {
    setRequestLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev,
    ].slice(0, 10));
    // => Keep last 10 log entries
  };

  return (
    <div>
      <h2>CSRF Protection Demo</h2>

      {/* => CSRF token display */}
      <div style={{ padding: '16px', backgroundColor: '#E3F2FD', borderRadius: '8px', marginBottom: '24px' }}>
        <h3>CSRF Token</h3>
        <p style={{ color: '#666', marginBottom: '12px' }}>
          Token generated on page load. Sent with all state-changing requests.
        </p>
        <code
          style={{
            display: 'block',
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            wordBreak: 'break-all',
          }}
        >
          {csrfToken || 'Loading...'}
        </code>
      </div>

      {/* => Donation form */}
      <div style={{ marginBottom: '24px' }}>
        <h3>Make a Donation</h3>
        <label>
          Amount: $
          <input
            type="number"
            value={donationAmount}
            onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
            style={{
              marginLeft: '8px',
              padding: '8px',
              fontSize: '16px',
            }}
          />
        </label>

        <div style={{ marginTop: '16px' }}>
          {/* => Protected submission */}
          <button
            onClick={handleDonateWithCSRF}
            style={{
              padding: '12px 24px',
              marginRight: '8px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ✓ Submit with CSRF Protection
          </button>

          {/* => Unprotected submission (for demonstration) */}
          <button
            onClick={handleDonateWithoutCSRF}
            style={{
              padding: '12px 24px',
              backgroundColor: '#F44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ✗ Submit WITHOUT CSRF Protection
          </button>
        </div>

        {/* => Status message */}
        {status && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: status.includes('✓') ? '#C8E6C9' : '#FFCCBC',
              borderRadius: '4px',
            }}
          >
            {status}
          </div>
        )}
      </div>

      {/* => Request log */}
      <div style={{ marginBottom: '24px' }}>
        <h3>Request Log</h3>
        <div
          style={{
            padding: '12px',
            backgroundColor: '#F5F5F5',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {requestLog.length === 0 ? (
            <p style={{ color: '#999' }}>No requests yet</p>
          ) : (
            <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace' }}>
              {requestLog.join('\n')}
            </pre>
          )}
        </div>
      </div>

      {/* => CSRF protection explanation */}
      <div style={{ padding: '16px', backgroundColor: '#FFF8E1', borderRadius: '8px' }}>
        <h3>How CSRF Attacks Work</h3>
        <p>
          Attacker creates malicious website with form:
        </p>
        <pre
          style={{
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
          }}
        >
          {`<!-- Malicious site: evil.com -->
<form action="https://yourbank.com/transfer" method="POST">
  <input name="to" value="attacker-account" />
  <input name="amount" value="10000" />
</form>
<script>document.forms[0].submit()</script>`}
        </pre>
        <p style={{ marginTop: '12px' }}>
          If user logged into yourbank.com visits evil.com:
        </p>
        <ol>
          <li>Browser sends cookies to yourbank.com (user authenticated)</li>
          <li>Request appears legitimate (has valid session cookie)</li>
          <li>Without CSRF protection, money transferred to attacker!</li>
        </ol>

        <h3 style={{ marginTop: '24px' }}>CSRF Protection Mechanisms</h3>

        <h4>1. Anti-CSRF Tokens (Synchronizer Token Pattern)</h4>
        <ul>
          <li>Server generates unique token per session</li>
          <li>Token stored in page (meta tag, form field, or JS variable)</li>
          <li>Client sends token with state-changing requests</li>
          <li>Server validates token matches session</li>
          <li>Attacker can't get token (same-origin policy)</li>
        </ul>

        <h4>2. SameSite Cookies</h4>
        <pre
          style={{
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        >
          Set-Cookie: sessionid=abc123; SameSite=Strict; Secure; HttpOnly
        </pre>
        <ul>
          <li><code>SameSite=Strict</code>: Cookie not sent on cross-site requests</li>
          <li><code>SameSite=Lax</code>: Cookie sent on top-level navigation only</li>
          <li><code>Secure</code>: Cookie only sent over HTTPS</li>
          <li><code>HttpOnly</code>: Cookie not accessible to JavaScript</li>
        </ul>

        <h4>3. Custom Request Headers</h4>
        <ul>
          <li>Add custom header (e.g., <code>X-CSRF-Token</code>)</li>
          <li>Simple CORS requests can't add custom headers</li>
          <li>Attacker can't forge request with custom header</li>
        </ul>

        <h4>4. Origin/Referer Validation</h4>
        <ul>
          <li>Server checks <code>Origin</code> or <code>Referer</code> header</li>
          <li>Verifies request from same origin</li>
          <li>Blocks requests from external sites</li>
        </ul>

        <h3 style={{ marginTop: '24px' }}>Implementation Checklist</h3>
        <ul>
          <li>✓ Use CSRF tokens for all POST/PUT/PATCH/DELETE requests</li>
          <li>✓ Set SameSite cookie attribute (Strict or Lax)</li>
          <li>✓ Validate Origin/Referer headers on server</li>
          <li>✓ Use HttpOnly cookies for session management</li>
          <li>✓ Require authentication for state-changing operations</li>
          <li>✓ Log and monitor CSRF validation failures</li>
        </ul>
      </div>
    </div>
  );
}

export default CSRFProtectionDemo;
```

**Key Takeaway**: CSRF attacks exploit authenticated user sessions to perform unauthorized actions. Protect with anti-CSRF tokens (sent with state-changing requests), SameSite cookies (prevent cross-site cookie sending), custom headers (can't be forged), and origin validation. Use secure fetch wrapper to add CSRF tokens automatically. Never rely on cookies alone for authentication.

**Why It Matters**: CSRF protection is a mandatory security requirement for any production application handling state-changing requests (form submissions, API mutations). Without CSRF protection, a malicious website can make authenticated requests to your API using the victim user's browser cookies. The double-submit cookie pattern is a stateless CSRF defense: the server sets a CSRF token in a cookie, the client reads it via JavaScript and sends it as a header, the server verifies they match. This is impossible to forge from cross-origin requests due to the Same-Origin Policy. Production React applications implement CSRF via interceptors (Axios interceptors, fetch wrappers) so protection is automatic rather than manually added to each request.

### Example 25: Complete Zakat Management System (Financial Domain Example)

Comprehensive production-ready Zakat management system demonstrating advanced React patterns: TypeScript generics, Zustand state management, form validation, error boundaries, performance optimization, and security best practices.

```typescript
// store/zakatStore.ts - Zustand store with slices
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// => Domain interfaces
interface Wealth {
  id: string;
  category: 'cash' | 'gold' | 'silver' | 'investments' | 'business';
  amount: number;
  description: string;
}

interface ZakatPayment {
  id: string;
  wealth: Wealth[];
  totalWealth: number;
  nisab: number;
  zakatAmount: number;
  isPaid: boolean;
  paidDate: string | null;
  notes: string;
}

interface ZakatState {
  // => Wealth tracking
  wealth: Wealth[];
  addWealth: (wealth: Omit<Wealth, 'id'>) => void;
  removeWealth: (id: string) => void;
  updateWealth: (id: string, updates: Partial<Wealth>) => void;

  // => Zakat calculations
  payments: ZakatPayment[];
  calculateZakat: () => ZakatPayment;
  markAsPaid: (id: string) => void;

  // => Settings
  nisabThreshold: number;
  setNisabThreshold: (nisab: number) => void;
}

// => Create Zustand store with persistence
export const useZakatStore = create<ZakatState>()(
  persist(
    (set, get) => ({
      // => Initial state
      wealth: [],
      payments: [],
      nisabThreshold: 5000,
      // => Default nisab: \$5000 (approximate)

      // => Add wealth entry
      addWealth: (wealth) => {
        set((state) => ({
          wealth: [
            ...state.wealth,
            {
              ...wealth,
              id: Date.now().toString(),
              // => Generate unique ID
            },
          ],
        }));
      },

      // => Remove wealth entry
      removeWealth: (id) => {
        set((state) => ({
          wealth: state.wealth.filter((w) => w.id !== id),
        }));
      },

      // => Update wealth entry
      updateWealth: (id, updates) => {
        set((state) => ({
          wealth: state.wealth.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      // => Calculate zakat based on current wealth
      calculateZakat: () => {
        const { wealth, nisabThreshold } = get();

        // => Sum total wealth
        const totalWealth = wealth.reduce((sum, w) => sum + w.amount, 0);

        // => Check if zakat is due
        const isZakatDue = totalWealth >= nisabThreshold;

        // => Calculate zakat (2.5% of wealth exceeding nisab)
        const zakatAmount = isZakatDue
          ? (totalWealth - nisabThreshold) * 0.025
          : 0;

        // => Create payment record
        const payment: ZakatPayment = {
          id: Date.now().toString(),
          wealth: [...wealth],
          // => Snapshot of wealth at calculation time
          totalWealth,
          nisab: nisabThreshold,
          zakatAmount,
          isPaid: false,
          paidDate: null,
          notes: '',
        };

        // => Add to payments history
        set((state) => ({
          payments: [payment, ...state.payments],
        }));

        return payment;
      },

      // => Mark payment as paid
      markAsPaid: (id) => {
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  isPaid: true,
                  paidDate: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      // => Update nisab threshold
      setNisabThreshold: (nisab) => {
        set({ nisabThreshold: nisab });
      },
    }),
    {
      name: 'zakat-storage',
      // => Persist to localStorage
    }
  )
);

// components/WealthForm.tsx - Form with validation
import { useState } from 'react';
import { useZakatStore } from '../store/zakatStore';

export function WealthForm() {
  const addWealth = useZakatStore((state) => state.addWealth);

  const [category, setCategory] = useState<'cash' | 'gold' | 'silver' | 'investments' | 'business'>('cash');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // => Validate amount
    if (amount <= 0) {
      setError('Amount must be greater than \$0');
      return;
    }

    // => Validate description
    if (description.trim() === '') {
      setError('Description is required');
      return;
    }

    // => Add wealth entry
    addWealth({
      category,
      amount,
      description: description.trim(),
    });

    // => Reset form
    setAmount(0);
    setDescription('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
      <h3>Add Wealth Entry</h3>

      {/* => Category select */}
      <div style={{ marginBottom: '12px' }}>
        <label>
          Category:
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            style={{ marginLeft: '8px', padding: '8px' }}
          >
            <option value="cash">Cash</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="investments">Investments</option>
            <option value="business">Business Assets</option>
          </select>
        </label>
      </div>

      {/* => Amount input */}
      <div style={{ marginBottom: '12px' }}>
        <label>
          Amount: $
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            style={{ marginLeft: '8px', padding: '8px', width: '200px' }}
          />
        </label>
      </div>

      {/* => Description input */}
      <div style={{ marginBottom: '12px' }}>
        <label>
          Description:
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Savings account, Gold jewelry"
            style={{ marginLeft: '8px', padding: '8px', width: '300px' }}
          />
        </label>
      </div>

      {/* => Error message */}
      {error && (
        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#FFCCBC', borderRadius: '4px', color: '#C62828' }}>
          {error}
        </div>
      )}

      {/* => Submit button */}
      <button
        type="submit"
        style={{
          padding: '12px 24px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Add Entry
      </button>
    </form>
  );
}

// components/WealthList.tsx - List with memoization
import { memo } from 'react';
import { useZakatStore } from '../store/zakatStore';

const WealthItem = memo(({ wealth }: { wealth: Wealth }) => {
  const removeWealth = useZakatStore((state) => state.removeWealth);

  return (
    <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong>${wealth.amount.toFixed(2)}</strong> - {wealth.category}
        <div style={{ fontSize: '14px', color: '#666' }}>{wealth.description}</div>
      </div>
      <button
        onClick={() => removeWealth(wealth.id)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#F44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Remove
      </button>
    </div>
  );
});

export function WealthList() {
  const wealth = useZakatStore((state) => state.wealth);

  if (wealth.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
        No wealth entries yet. Add your assets above.
      </div>
    );
  }

  return (
    <div>
      <h3>Your Wealth ({wealth.length} entries)</h3>
      {wealth.map((w) => (
        <WealthItem key={w.id} wealth={w} />
      ))}
    </div>
  );
}

// components/ZakatCalculator.tsx - Calculator with results
import { useState } from 'react';
import { useZakatStore } from '../store/zakatStore';

export function ZakatCalculator() {
  const wealth = useZakatStore((state) => state.wealth);
  const nisabThreshold = useZakatStore((state) => state.nisabThreshold);
  const calculateZakat = useZakatStore((state) => state.calculateZakat);

  const [result, setResult] = useState<ZakatPayment | null>(null);

  // => Calculate total wealth
  const totalWealth = wealth.reduce((sum, w) => sum + w.amount, 0);
  const isZakatDue = totalWealth >= nisabThreshold;

  const handleCalculate = () => {
    const payment = calculateZakat();
    setResult(payment);
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#E3F2FD', borderRadius: '8px' }}>
      <h3>Zakat Calculation</h3>

      {/* => Summary */}
      <div style={{ marginBottom: '16px' }}>
        <p><strong>Total Wealth:</strong> ${totalWealth.toFixed(2)}</p>
        <p><strong>Nisab Threshold:</strong> ${nisabThreshold.toFixed(2)}</p>
        <p>
          <strong>Status:</strong>{' '}
          {isZakatDue ? (
            <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Zakat is due</span>
          ) : (
            <span style={{ color: 'gray' }}>Wealth below nisab</span>
          )}
        </p>
      </div>

      {/* => Calculate button */}
      <button
        onClick={handleCalculate}
        disabled={!isZakatDue}
        style={{
          padding: '12px 24px',
          backgroundColor: isZakatDue ? '#2196F3' : '#CCC',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isZakatDue ? 'pointer' : 'not-allowed',
        }}
      >
        Calculate Zakat
      </button>

      {/* => Result */}
      {result && (
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '4px' }}>
          <h4 style={{ color: '#2196F3' }}>Zakat Amount</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '8px' }}>
            ${result.zakatAmount.toFixed(2)}
          </div>
          <p style={{ fontSize: '14px', color: '#666' }}>
            2.5% of wealth exceeding nisab (${totalWealth.toFixed(2)} - ${nisabThreshold.toFixed(2)})
          </p>
        </div>
      )}
    </div>
  );
}

// App.tsx - Main application
import { WealthForm } from './components/WealthForm';
import { WealthList } from './components/WealthList';
import { ZakatCalculator } from './components/ZakatCalculator';

function ZakatManagementSystem() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Zakat Management System</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Track your wealth and calculate zakat obligations according to Islamic principles.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* => Left column */}
        <div>
          <WealthForm />
          <div style={{ marginTop: '24px' }}>
            <WealthList />
          </div>
        </div>

        {/* => Right column */}
        <div>
          <ZakatCalculator />
        </div>
      </div>

      {/* => Information */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#FFF8E1', borderRadius: '8px' }}>
        <h3>About Zakat</h3>
        <p>
          Zakat is one of the Five Pillars of Islam. It's an obligatory charity paid annually by Muslims who meet the nisab threshold (minimum wealth required).
        </p>
        <ul>
          <li><strong>Nisab:</strong> Minimum wealth threshold (\$5000 approximate, based on gold/silver value)</li>
          <li><strong>Rate:</strong> 2.5% of wealth exceeding nisab</li>
          <li><strong>Assets:</strong> Cash, gold, silver, investments, business assets</li>
          <li><strong>Timing:</strong> Once lunar year (Hawl) passes from reaching nisab</li>
        </ul>
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          <em>Note: This calculator provides estimates. Consult with a qualified Islamic scholar for specific rulings.</em>
        </p>
      </div>
    </div>
  );
}

export default ZakatManagementSystem;
```

**Key Takeaway**: Production-ready Zakat management system demonstrates advanced React patterns: Zustand for global state with persistence, TypeScript for type safety, memoization for performance, form validation, domain-driven design with clear interfaces, and user-friendly UI. Showcases real-world financial domain application with Islamic principles integration.

**Why It Matters**: The Zakat Management System demonstrates the production architecture for a complete domain feature: custom hooks separate business logic from rendering, TypeScript models the domain precisely, Zustand manages client state, React Query handles server state, error boundaries provide resilience, and accessible markup ensures broad usability. Production features of this complexity require architectural decisions that balance: separation of concerns (logic, state, and UI independently testable), performance (memoized computations, virtualized lists if needed), resilience (error recovery at multiple levels), and correctness (TypeScript preventing invalid calculations). This is the standard you should hold your production React work to.

---

## Summary

This advanced tutorial covered 25 production-grade React + TypeScript patterns:

**Group 1: Advanced TypeScript Patterns (5 examples)**

1. Generic Components with TypeScript
2. Utility Types in React (Partial, Pick, Omit, Record)
3. Discriminated Unions for State
4. Advanced Type Guards
5. Template Literal Types for Props

**Group 2: Advanced State Management (5 examples)** 6. Zustand Store Setup 7. Zustand with TypeScript and Slices 8. Zustand Middleware (Persist, Devtools) 9. Server State vs Client State Separation 10. State Machine Pattern with XState

**Group 3: Performance Optimization (5 examples)** 11. Code Splitting with React.lazy and Suspense 12. Route-Based Code Splitting 13. React.memo and Memoization Strategies 14. Virtual Scrolling for Large Lists 15. Web Workers for Heavy Computations

**Group 4: Concurrent Features and Advanced Patterns (5 examples)** 16. Suspense for Data Fetching 17. startTransition for Non-Urgent Updates 18. useDeferredValue for Expensive Renders 19. Error Boundaries with Retry Logic 20. Render-as-You-Fetch Pattern

**Group 5: Testing, Security, and Production (5 examples)** 21. Vitest with React Testing Library 22. Testing Custom Hooks 23. XSS Prevention and Input Sanitization 24. CSRF Protection Patterns 25. Complete Zakat Management System (Financial Domain Example)

Each example maintains 1-2.25 comment lines per code line for deep understanding. You now have comprehensive knowledge of advanced React patterns for building production-ready applications with TypeScript, state management, performance optimization, security, and testing.

## Next Steps

- Practice implementing these patterns in your own projects
- Explore framework-specific features (Next.js, Remix) in dedicated tutorials
- Study advanced TypeScript patterns for even stronger type safety
- Deep dive into React internals and Fiber architecture
- Learn React Native for mobile development

For questions or further exploration, consult [React documentation](https://react.dev), [TypeScript handbook](https://www.typescriptlang.org/docs/), and community resources.

---
title: "React TypeScript Integration"
description: TypeScript patterns and best practices for React applications
category: explanation
subcategory: platform-web
tags:
  - react
  - typescript
  - type-safety
  - generics
  - props
related:
  - ./idioms.md
  - ./best-practices.md
principles:
  - explicit-over-implicit
---

# React TypeScript Integration

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [TypeScript React](./README.md) > TypeScript Integration

**Related Guides**:

- [Idioms](idioms.md) - React patterns
- [Best Practices](best-practices.md) - Type safety standards
- [Component Architecture](component-architecture.md) - Component patterns
- [Hooks](hooks.md) - Hook patterns

## Overview

TypeScript provides static type checking for React applications, catching errors at compile time and improving developer experience with autocomplete and refactoring support.

**Target Audience**: Developers building type-safe React applications, particularly for Islamic finance platforms requiring robust data validation and domain modeling.

**React Version**: React 19.0 with TypeScript 5+

## Component Props

### Basic Props

```typescript
// Interface for props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // Optional
  variant?: 'primary' | 'secondary'; // Union type
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`button button-${variant}`}
  >
    {label}
  </button>
);

// Usage with type checking
<Button label="Submit" onClick={() => console.log('Clicked')} />
<Button label="Cancel" onClick={() => {}} variant="secondary" disabled />
```

### Children Props

```typescript
// Children as ReactNode
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="card">
    <h3>{title}</h3>
    <div className="card-content">{children}</div>
  </div>
);

// Render prop pattern
interface DataLoaderProps<T> {
  data: T;
  children: (data: T) => React.ReactNode;
}

export function DataLoader<T>({ data, children }: DataLoaderProps<T>) {
  return <>{children(data)}</>;
}

// Usage
<DataLoader<Donation> data={donation}>
  {(d) => <div>{d.campaignName}</div>}
</DataLoader>

// Component as prop
interface LayoutProps {
  header: React.ComponentType<{ title: string }>;
  content: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ header: Header, content }) => (
  <div>
    <Header title="Dashboard" />
    <main>{content}</main>
  </div>
);
```

### Props with Ref

```typescript
// Using forwardRef with TypeScript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...rest }, ref) => (
    <div className="input-wrapper">
      <label>{label}</label>
      <input ref={ref} {...rest} />
      {error && <span className="error">{error}</span>}
    </div>
  )
);

// Usage
const MyForm: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  return <Input ref={inputRef} label="Email" type="email" />;
};
```

### Complex Props

```typescript
// Discriminated unions for polymorphic components
type ButtonProps =
  | {
      variant: 'link';
      href: string;
      onClick?: never;
    }
  | {
      variant: 'button';
      onClick: () => void;
      href?: never;
    };

export const Button: React.FC<ButtonProps> = (props) => {
  if (props.variant === 'link') {
    return <a href={props.href}>Link</a>;
  }

  return <button onClick={props.onClick}>Button</button>;
};

// Usage (type-safe)
<Button variant="link" href="/about" />
<Button variant="button" onClick={() => {}} />

// Error: can't mix href with button variant
// <Button variant="button" href="/about" /> // TypeScript error

// Props with generics
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
        const option = options.find((o) => getValue(o) === e.target.value);
        if (option) onChange(option);
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

// Usage
interface Campaign {
  id: string;
  name: string;
}

const campaigns: Campaign[] = [
  { id: '1', name: 'Education Fund' },
  { id: '2', name: 'Healthcare' },
];

<Select<Campaign>
  options={campaigns}
  value={campaigns[0]}
  onChange={(campaign) => console.log(campaign.id)}
  getLabel={(c) => c.name}
  getValue={(c) => c.id}
/>;
```

## Event Handlers

### Common Event Types

```typescript
export const FormComponent: React.FC = () => {
  // Form events
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submit');
  };

  // Input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  // Textarea change
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log(e.target.value);
  };

  // Select change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
  };

  // Click events
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log(e.clientX, e.clientY);
  };

  // Keyboard events
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enter pressed');
    }
  };

  // Focus events
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log('Input focused');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={handleFocus}
      />
      <textarea onChange={handleTextareaChange} />
      <select onChange={handleSelectChange}>
        <option>Option 1</option>
      </select>
      <button type="button" onClick={handleClick}>
        Click
      </button>
      <button type="submit">Submit</button>
    </form>
  );
};
```

### Custom Event Handlers

```typescript
// Generic event handler type
interface DonationFormProps {
  onSubmit: (donation: Donation) => void;
  onCancel: () => void;
  onFieldChange?: (field: keyof Donation, value: any) => void;
}

export const DonationForm: React.FC<DonationFormProps> = ({
  onSubmit,
  onCancel,
  onFieldChange,
}) => {
  const [donation, setDonation] = useState<Partial<Donation>>({});

  const handleChange = (field: keyof Donation) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setDonation((prev) => ({ ...prev, [field]: value }));
    onFieldChange?.(field, value);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(donation as Donation);
    }}>
      <input
        type="text"
        onChange={handleChange('campaignName')}
      />
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit">Submit</button>
    </form>
  );
};
```

## Hooks with TypeScript

### useState

```typescript
// Type inference
const [count, setCount] = useState(0); // number
const [name, setName] = useState(""); // string

// Explicit typing
const [user, setUser] = useState<User | null>(null);

// With initial undefined
const [data, setData] = useState<Donation>();

// Complex state
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const [form, setForm] = useState<FormState>({
  values: {},
  errors: {},
  touched: {},
});
```

### useEffect

```typescript
// No return (no cleanup)
useEffect(() => {
  console.log("Component mounted");
}, []);

// With cleanup
useEffect(() => {
  const timer = setInterval(() => {
    console.log("Tick");
  }, 1000);

  return () => clearInterval(timer);
}, []);

// Async effect (with IIFE)
useEffect(() => {
  (async () => {
    const data = await fetchData();
    setData(data);
  })();
}, []);

// Async effect (with separate function)
useEffect(() => {
  const fetchUser = async () => {
    const user = await userApi.getById(userId);
    setUser(user);
  };

  fetchUser();
}, [userId]);
```

### useRef

```typescript
// DOM ref
const inputRef = useRef<HTMLInputElement>(null);

// Mutable value
const countRef = useRef<number>(0);

// Nullable ref
const divRef = useRef<HTMLDivElement | null>(null);

// Accessing ref
const focusInput = () => {
  inputRef.current?.focus(); // Optional chaining
};
```

### useContext

```typescript
// Context with type
interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

// Custom hook with type guard
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

### Custom Hooks

```typescript
// Generic fetch hook
interface UseFetchReturn<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFetch<T>(url: string): UseFetchReturn<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Implementation...

  return { data, loading, error, refetch };
}

// Usage with type parameter
const { data, loading, error } = useFetch<Donation[]>("/api/donations");

// Hook with options
interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T>(asyncFunction: () => Promise<T>, options: UseAsyncOptions<T> = {}) {
  // Implementation...
}
```

## Domain Types

### Basic Domain Models

```typescript
// Donation domain
export interface Donation {
  id: string;
  campaignId: string;
  campaignName: string;
  amount: number;
  currency: string;
  donor: Donor;
  message?: string;
  isRecurring: boolean;
  recurrenceInterval?: "monthly" | "quarterly" | "annually";
  status: DonationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type DonationStatus = "pending" | "completed" | "failed" | "refunded";

export interface Donor {
  name: string;
  email: string;
  phoneNumber?: string;
  isAnonymous: boolean;
}

// Zakat domain
export interface ZakatCalculation {
  id: string;
  userId: string;
  wealth: number;
  nisab: number;
  zakatAmount: number;
  isEligible: boolean;
  assets: Asset[];
  calculatedAt: Date;
}

export interface Asset {
  id: string;
  type: AssetType;
  description: string;
  value: number;
  currency: string;
}

export type AssetType = "cash" | "gold" | "silver" | "investment" | "property";
```

### Utility Types

```typescript
// Partial form state
type DonationFormState = Partial<Donation>;

// Pick specific fields
type DonationSummary = Pick<Donation, "id" | "amount" | "campaignName">;

// Omit fields
type NewDonation = Omit<Donation, "id" | "createdAt" | "updatedAt">;

// Make fields required
type RequiredDonation = Required<Donation>;

// Make fields readonly
type ImmutableDonation = Readonly<Donation>;

// Record type
type DonationsByStatus = Record<DonationStatus, Donation[]>;

// Extract/Exclude
type SuccessStatus = Extract<DonationStatus, "completed">;
type PendingStatuses = Exclude<DonationStatus, "completed" | "refunded">;

// ReturnType
function getDonation() {
  return {
    id: "1",
    amount: 100,
  };
}

type DonationType = ReturnType<typeof getDonation>;
```

### Discriminated Unions

```typescript
// API Response types
type ApiResponse<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Usage with type narrowing
function handleResponse<T>(response: ApiResponse<T>) {
  switch (response.status) {
    case 'loading':
      return <LoadingSpinner />;

    case 'success':
      return <DataDisplay data={response.data} />; // data is typed as T

    case 'error':
      return <ErrorMessage error={response.error} />; // error is typed as Error
  }
}

// Form field types
type FormField =
  | { type: 'text'; value: string; placeholder: string }
  | { type: 'number'; value: number; min: number; max: number }
  | { type: 'select'; value: string; options: string[] }
  | { type: 'checkbox'; value: boolean; label: string };

function renderField(field: FormField) {
  switch (field.type) {
    case 'text':
      return <input type="text" value={field.value} placeholder={field.placeholder} />;

    case 'number':
      return <input type="number" value={field.value} min={field.min} max={field.max} />;

    case 'select':
      return (
        <select value={field.value}>
          {field.options.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      );

    case 'checkbox':
      return <input type="checkbox" checked={field.value} />;
  }
}
```

## Generic Components

### Data List Component

```typescript
interface DataListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function DataList<T>({
  data,
  keyExtractor,
  renderItem,
  emptyMessage = 'No items',
}: DataListProps<T>) {
  if (data.length === 0) {
    return <div className="empty">{emptyMessage}</div>;
  }

  return (
    <ul className="data-list">
      {data.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Usage
<DataList<Donation>
  data={donations}
  keyExtractor={(d) => d.id}
  renderItem={(d) => (
    <div>
      {d.campaignName}: {d.amount}
    </div>
  )}
  emptyMessage="No donations yet"
/>
```

### Form Component

```typescript
interface FormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  children: (props: {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    handleChange: (field: keyof T, value: any) => void;
    handleSubmit: (e: React.FormEvent) => void;
  }) => React.ReactNode;
}

export function Form<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  children,
}: FormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length === 0) {
        onSubmit(values);
      }
    } else {
      onSubmit(values);
    }
  };

  return (
    <>
      {children({
        values,
        errors,
        handleChange,
        handleSubmit,
      })}
    </>
  );
}

// Usage
interface DonationFormValues {
  amount: number;
  campaignId: string;
  donorName: string;
}

<Form<DonationFormValues>
  initialValues={{ amount: 0, campaignId: '', donorName: '' }}
  onSubmit={(values) => console.log(values)}
  validate={(values) => {
    const errors: Partial<Record<keyof DonationFormValues, string>> = {};
    if (values.amount <= 0) errors.amount = 'Amount must be positive';
    return errors;
  }}
>
  {({ values, errors, handleChange, handleSubmit }) => (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={values.amount}
        onChange={(e) => handleChange('amount', Number(e.target.value))}
      />
      {errors.amount && <span>{errors.amount}</span>}

      <button type="submit">Submit</button>
    </form>
  )}
</Form>
```

## Type Guards and Narrowing

### Type Guards

```typescript
// User-defined type guard
function isDonation(value: unknown): value is Donation {
  return typeof value === "object" && value !== null && "id" in value && "amount" in value && "campaignId" in value;
}

// Usage
function processDonation(data: unknown) {
  if (isDonation(data)) {
    // TypeScript knows data is Donation
    console.log(data.campaignId);
  }
}

// Generic type guard
function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

// Usage
if (isArrayOf(data, isDonation)) {
  // data is Donation[]
  data.forEach((d) => console.log(d.amount));
}
```

### Narrowing with typeof and in

```typescript
function processValue(value: string | number) {
  // typeof narrowing
  if (typeof value === "string") {
    return value.toUpperCase(); // string methods available
  } else {
    return value.toFixed(2); // number methods available
  }
}

function processUser(user: User | GuestUser) {
  // 'in' operator narrowing
  if ("email" in user) {
    // User type
    console.log(user.email);
  } else {
    // GuestUser type
    console.log(user.sessionId);
  }
}
```

## Advanced Patterns

### Render Props with Generics

```typescript
interface RenderDataProps<T> {
  data: T[];
  render: (item: T, index: number) => React.ReactNode;
}

export function RenderData<T>({ data, render }: RenderDataProps<T>) {
  return <>{data.map((item, index) => render(item, index))}</>;
}

// Usage
<RenderData<Donation>
  data={donations}
  render={(donation, index) => (
    <div key={donation.id}>
      {index + 1}. {donation.campaignName}
    </div>
  )}
/>
```

### Higher-Order Components

```typescript
// HOC with generics
function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { loading: boolean }> {
  return ({ loading, ...props }) => {
    if (loading) {
      return <LoadingSpinner />;
    }

    return <Component {...(props as P)} />;
  };
}

// Usage
interface DataDisplayProps {
  data: Donation[];
}

const DataDisplay: React.FC<DataDisplayProps> = ({ data }) => (
  <ul>
    {data.map((d) => (
      <li key={d.id}>{d.campaignName}</li>
    ))}
  </ul>
);

const DataDisplayWithLoading = withLoading(DataDisplay);

// Use with loading prop
<DataDisplayWithLoading data={donations} loading={isLoading} />;
```

### Component Props Extraction

```typescript
// Extract props from component
type ButtonProps = React.ComponentProps<typeof Button>;

// Extract HTML element props
type DivProps = React.ComponentProps<'div'>;
type InputProps = React.ComponentProps<'input'>;

// Extend HTML element props
interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  ...inputProps
}) => (
  <div>
    <label>{label}</label>
    <input {...inputProps} />
    {error && <span>{error}</span>}
  </div>
);
```

## Type-Safe API Calls

### API Client

```typescript
// API response wrapper
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Generic API function
async function apiCall<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return {
        success: false,
        error: { code: data.code, message: data.message },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: String(error) },
    };
  }
}

// Type-safe API client
const donationApi = {
  getAll: () => apiCall<Donation[]>("/api/donations"),

  getById: (id: string) => apiCall<Donation>(`/api/donations/${id}`),

  create: (donation: NewDonation) =>
    apiCall<Donation>("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donation),
    }),
};

// Usage with type narrowing
const response = await donationApi.getAll();

if (response.success) {
  // response.data is Donation[]
  response.data.forEach((d) => console.log(d.amount));
} else {
  // response.error is defined
  console.error(response.error.message);
}
```

## Related Documentation

- **[Idioms](idioms.md)** - React patterns
- **[Best Practices](best-practices.md)** - Type safety standards
- **[Component Architecture](component-architecture.md)** - Component patterns
- **[Hooks](hooks.md)** - Hook patterns
- **[TypeScript Language Guide](../../../programming-languages/typescript/README.md)** - TypeScript fundamentals

---
title: "React Version Migration"
description: Upgrading React versions and migration strategies
category: explanation
subcategory: platform-web
tags:
  - react
  - migration
  - upgrade
  - version
related:
  - ./README.md
principles:
  - automation-over-manual
---

# React Version Migration

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [TypeScript React](./README.md) > Version Migration

**Related Guides**:

- [Hooks](hooks.md) - Modern hook patterns
- [Best Practices](best-practices.md) - Current standards

## Overview

React version migrations require understanding breaking changes and new features. This guide covers upgrading from React 16 to 19 and migrating class components to functional components.

**Target Audience**: Developers maintaining React applications and planning version upgrades.

**React Version**: React 19.0 (current)

## React 17 to 18 Migration

### Key Changes

**Breaking Changes**:

- Automatic batching for all updates
- Strict mode effects run twice in development
- Removed IE support
- New root API required

**New Features**:

- Concurrent features (transitions, suspense)
- Automatic batching
- New hooks (useId, useTransition, useDeferredValue)

### Update Root API

```typescript
// ❌ React 17
import ReactDOM from 'react-dom';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// ✅ React 18
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Automatic Batching

```typescript
// React 17 - only batched in event handlers
setTimeout(() => {
  setCount((c) => c + 1); // Re-render
  setFlag((f) => !f); // Re-render
}, 1000);

// React 18 - batched everywhere
setTimeout(() => {
  setCount((c) => c + 1); // Batched
  setFlag((f) => !f); // Batched (single re-render)
}, 1000);

// Opt out of batching if needed
import { flushSync } from "react-dom";

flushSync(() => {
  setCount((c) => c + 1); // Re-render immediately
});
setFlag((f) => !f); // Re-render immediately
```

## Class to Functional Component Migration

### Basic Conversion

```typescript
// ❌ Class component
class DonationCard extends React.Component<DonationCardProps> {
  render() {
    const { donation } = this.props;

    return (
      <div className="donation-card">
        <h3>{donation.campaignName}</h3>
        <p>{donation.amount}</p>
      </div>
    );
  }
}

// ✅ Functional component
const DonationCard: React.FC<DonationCardProps> = ({ donation }) => (
  <div className="donation-card">
    <h3>{donation.campaignName}</h3>
    <p>{donation.amount}</p>
  </div>
);
```

### State Conversion

```typescript
// ❌ Class with state
class Counter extends React.Component<{}, { count: number }> {
  state = { count: 0 };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>Increment</button>
      </div>
    );
  }
}

// ✅ Functional with useState
const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(prev => prev + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};
```

### Lifecycle Methods to Hooks

```typescript
// ❌ componentDidMount
class UserProfile extends React.Component<{ userId: string }> {
  componentDidMount() {
    this.fetchUser(this.props.userId);
  }

  fetchUser(userId: string) {
    // Fetch logic
  }

  render() {
    return <div>{/* UI */}</div>;
  }
}

// ✅ useEffect
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  useEffect(() => {
    const fetchUser = async () => {
      // Fetch logic
    };

    fetchUser();
  }, []); // Empty deps = runs once on mount

  return <div>{/* UI */}</div>;
};

// ❌ componentDidUpdate
class SearchResults extends React.Component<{ query: string }> {
  componentDidUpdate(prevProps: { query: string }) {
    if (prevProps.query !== this.props.query) {
      this.fetchResults(this.props.query);
    }
  }

  render() {
    return <div>{/* UI */}</div>;
  }
}

// ✅ useEffect with dependencies
const SearchResults: React.FC<{ query: string }> = ({ query }) => {
  useEffect(() => {
    const fetchResults = async () => {
      // Fetch logic
    };

    fetchResults();
  }, [query]); // Runs when query changes

  return <div>{/* UI */}</div>;
};

// ❌ componentWillUnmount
class Timer extends React.Component {
  intervalId: number | null = null;

  componentDidMount() {
    this.intervalId = window.setInterval(() => {
      // Timer logic
    }, 1000);
  }

  componentWillUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  render() {
    return <div>{/* UI */}</div>;
  }
}

// ✅ useEffect cleanup
const Timer: React.FC = () => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Timer logic
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return <div>{/* UI */}</div>;
};
```

### Context Migration

```typescript
// ❌ Class with Context Consumer
class ZakatCalculator extends React.Component {
  render() {
    return (
      <AuthContext.Consumer>
        {(auth) => (
          <div>
            <h2>Zakat Calculator for {auth.user.name}</h2>
            {/* Calculator UI */}
          </div>
        )}
      </AuthContext.Consumer>
    );
  }
}

// ✅ Functional with useContext
const ZakatCalculator: React.FC = () => {
  const { user } = useContext(AuthContext);

  return (
    <div>
      <h2>Zakat Calculator for {user.name}</h2>
      {/* Calculator UI */}
    </div>
  );
};
```

### Refs Migration

```typescript
// ❌ Class with createRef
class DonationForm extends React.Component {
  private inputRef = React.createRef<HTMLInputElement>();

  focusInput = () => {
    this.inputRef.current?.focus();
  };

  render() {
    return (
      <div>
        <input ref={this.inputRef} type="number" />
        <button onClick={this.focusInput}>Focus</button>
      </div>
    );
  }
}

// ✅ Functional with useRef
const DonationForm: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="number" />
      <button onClick={focusInput}>Focus</button>
    </div>
  );
};
```

### Error Boundaries (Still Require Classes)

Error boundaries are one of the few cases where class components are still needed in React 18.

```typescript
// Error boundary (no functional equivalent yet)
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage with functional components
const App: React.FC = () => (
  <ErrorBoundary>
    <ZakatCalculator />
    <MurabahaContracts />
    <WaqfProjects />
  </ErrorBoundary>
);
```

## React 18 Concurrent Features

### useTransition

Use transitions to mark updates as non-urgent, keeping the UI responsive.

```typescript
// Zakat calculation with transition
const ZakatCalculator: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [calculation, setCalculation] = useState<ZakatCalculation | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAddAsset = (newAsset: Asset) => {
    // Update immediately (urgent)
    setAssets((prev) => [...prev, newAsset]);

    // Recalculate in transition (non-urgent)
    startTransition(() => {
      const service = new ZakatCalculationService();
      const nisab = NisabThreshold.create(60, 1.5, "USD");
      const result = service.calculate([...assets, newAsset], nisab.getNisab());
      setCalculation(result);
    });
  };

  return (
    <div className="zakat-calculator">
      <h2>Zakat Calculator</h2>

      <AssetForm onAdd={handleAddAsset} />

      <AssetList assets={assets} />

      {isPending && <LoadingSpinner text="Calculating..." />}

      {calculation && !isPending && <ZakatResult calculation={calculation} />}
    </div>
  );
};
```

### useDeferredValue

Defer expensive renders while keeping the UI responsive.

```typescript
// Search with deferred results
const WaqfProjectSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const { data: projects, isLoading } = useWaqfProjects(deferredQuery);

  return (
    <div className="project-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Waqf projects..."
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ProjectList projects={projects} isStale={deferredQuery !== query} />
      )}
    </div>
  );
};
```

### Suspense for Data Fetching

Suspense boundaries handle loading states declaratively.

```typescript
// Suspense with lazy loading
const MurabahaContractDetail = lazy(() => import("./MurabahaContractDetail"));
const WaqfProjectDetail = lazy(() => import("./WaqfProjectDetail"));

const App: React.FC = () => (
  <Suspense fallback={<PageLoadingSpinner />}>
    <Routes>
      <Route
        path="/murabaha/:id"
        element={
          <Suspense fallback={<DetailLoadingSpinner />}>
            <MurabahaContractDetail />
          </Suspense>
        }
      />
      <Route
        path="/waqf/:id"
        element={
          <Suspense fallback={<DetailLoadingSpinner />}>
            <WaqfProjectDetail />
          </Suspense>
        }
      />
    </Routes>
  </Suspense>
);

// Suspense with data fetching (React Query)
const MurabahaContract: React.FC<{ id: string }> = ({ id }) => {
  const { data: contract } = useSuspenseQuery({
    queryKey: ["murabaha", id],
    queryFn: () => murabahaApi.getContract(id),
  });

  return <ContractDetails contract={contract} />;
};
```

## React 19 Features

### React Compiler (Automatic Memoization)

React 19 introduces an automatic compiler that eliminates manual memoization.

```typescript
// ❌ React 18 - Manual memoization
const ZakatCalculator: React.FC<{ userId: string }> = ({ userId }) => {
  const [assets, setAssets] = useState<Asset[]>([]);

  const totalWealth = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [assets]);

  const calculateZakat = useCallback(() => {
    return totalWealth * 0.025;
  }, [totalWealth]);

  return <div>{/* UI */}</div>;
};

// ✅ React 19 - No manual memoization needed
const ZakatCalculator: React.FC<{ userId: string }> = ({ userId }) => {
  const [assets, setAssets] = useState<Asset[]>([]);

  // Compiler automatically memoizes
  const totalWealth = assets.reduce((sum, asset) => sum + asset.value, 0);

  const calculateZakat = () => {
    return totalWealth * 0.025;
  };

  return <div>{/* UI */}</div>;
};
```

### use() Hook

The new `use()` hook unwraps promises and context in render.

```typescript
// use() with promises
const ZakatHistory: React.FC<{ userId: string }> = ({ userId }) => {
  const historyPromise = zakatApi.getHistory(userId);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HistoryList promise={historyPromise} />
    </Suspense>
  );
};

const HistoryList: React.FC<{ promise: Promise<ZakatCalculation[]> }> = ({ promise }) => {
  const history = use(promise);

  return (
    <ul>
      {history.map((calc) => (
        <li key={calc.id}>
          {calc.calculatedAt.toDateString()}: {calc.zakatDue.toString()}
        </li>
      ))}
    </ul>
  );
};

// use() with context (can be conditional)
const ConditionalAuth: React.FC<{ needsAuth: boolean }> = ({ needsAuth }) => {
  const auth = needsAuth ? use(AuthContext) : null;

  if (needsAuth && !auth?.isAuthenticated) {
    return <LoginPrompt />;
  }

  return <ProtectedContent />;
};
```

### Actions (Async Transitions)

Actions simplify form submissions and async operations.

```typescript
// Form with action
const DonationForm: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submitDonation = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const amount = Number(formData.get("amount"));
        const projectId = formData.get("projectId") as string;

        await donationApi.create({
          amount: Money.create(amount, "USD"),
          projectId,
        });

        toast.success("Donation successful");
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  return (
    <form action={submitDonation}>
      <input name="projectId" type="hidden" value="waqf-123" />
      <input name="amount" type="number" min="0" required />

      <button type="submit" disabled={isPending}>
        {isPending ? "Processing..." : "Donate"}
      </button>

      {error && <ErrorMessage message={error} />}
    </form>
  );
};
```

## OSE Platform Migration Examples

### Zakat Calculator Migration (Class → Functional)

```typescript
// ❌ React 16 Class Component
class ZakatCalculatorLegacy extends React.Component<
  { userId: string },
  { assets: Asset[]; calculation: ZakatCalculation | null; loading: boolean; error: string | null }
> {
  state = {
    assets: [],
    calculation: null,
    loading: false,
    error: null,
  };

  calculationService = new ZakatCalculationService();

  componentDidMount() {
    this.loadAssets();
  }

  componentDidUpdate(prevProps: { userId: string }) {
    if (prevProps.userId !== this.props.userId) {
      this.loadAssets();
    }
  }

  async loadAssets() {
    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(`/api/zakat/assets?userId=${this.props.userId}`);
      const assets = await response.json();
      this.setState({ assets, loading: false });
    } catch (error) {
      this.setState({ error: (error as Error).message, loading: false });
    }
  }

  handleCalculate = () => {
    const nisab = NisabThreshold.create(60, 1.5, "USD");
    const calculation = this.calculationService.calculate(this.state.assets, nisab.getNisab());
    this.setState({ calculation });
  };

  render() {
    const { assets, calculation, loading, error } = this.state;

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
      <div className="zakat-calculator">
        <h2>Zakat Calculator</h2>
        <AssetList assets={assets} />
        <button onClick={this.handleCalculate}>Calculate Zakat</button>
        {calculation && <ZakatResult calculation={calculation} />}
      </div>
    );
  }
}

// ✅ React 18 Functional Component
const ZakatCalculator: React.FC<{ userId: string }> = ({ userId }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [calculation, setCalculation] = useState<ZakatCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculationService = useMemo(() => new ZakatCalculationService(), []);

  useEffect(() => {
    const loadAssets = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/zakat/assets?userId=${userId}`);
        const data = await response.json();
        setAssets(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [userId]);

  const handleCalculate = useCallback(() => {
    const nisab = NisabThreshold.create(60, 1.5, "USD");
    const result = calculationService.calculate(assets, nisab.getNisab());
    setCalculation(result);
  }, [assets, calculationService]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="zakat-calculator">
      <h2>Zakat Calculator</h2>
      <AssetList assets={assets} />
      <button onClick={handleCalculate}>Calculate Zakat</button>
      {calculation && <ZakatResult calculation={calculation} />}
    </div>
  );
};

// ✅ React 19 with Compiler (No Manual Memoization)
const ZakatCalculatorOptimized: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ["zakat-assets", userId],
    queryFn: () => zakatApi.getAssets(userId),
  });

  const [calculation, setCalculation] = useState<ZakatCalculation | null>(null);

  // Compiler handles memoization automatically
  const calculationService = new ZakatCalculationService();

  const handleCalculate = () => {
    const nisab = NisabThreshold.create(60, 1.5, "USD");
    const result = calculationService.calculate(assets || [], nisab.getNisab());
    setCalculation(result);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;

  return (
    <div className="zakat-calculator">
      <h2>Zakat Calculator</h2>
      <AssetList assets={assets || []} />
      <button onClick={handleCalculate}>Calculate Zakat</button>
      {calculation && <ZakatResult calculation={calculation} />}
    </div>
  );
};
```

### Murabaha Contract List with Concurrent Features

```typescript
// React 18 with concurrent features
const MurabahaContractList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["murabaha-contracts", deferredQuery],
    queryFn: () => murabahaApi.searchContracts(deferredQuery),
  });

  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelectContract = (contractId: string) => {
    startTransition(() => {
      setSelectedContract(contractId);
    });
  };

  return (
    <div className="contract-list">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search contracts..."
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="contracts">
          {contracts?.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onClick={() => handleSelectContract(contract.id)}
              isStale={deferredQuery !== searchQuery}
            />
          ))}
        </div>
      )}

      {isPending && <DetailLoadingSpinner />}

      {selectedContract && (
        <Suspense fallback={<DetailLoadingSpinner />}>
          <ContractDetail contractId={selectedContract} />
        </Suspense>
      )}
    </div>
  );
};
```

## Migration Strategy

### Step-by-Step Approach

**Phase 1: Preparation (1-2 weeks)**

1. **Audit current codebase**:

   ```bash
   # Count class components
   grep -r "class.*extends.*Component" src/ | wc -l

   # Find lifecycle methods
   grep -r "componentDidMount\|componentDidUpdate\|componentWillUnmount" src/
   ```

2. **Update dependencies**:

   ```json
   {
     "dependencies": {
       "react": "^18.2.0",
       "react-dom": "^18.2.0"
     }
   }
   ```

3. **Set up testing infrastructure**:

   ```bash
   npm install --save-dev @testing-library/react@latest
   ```

**Phase 2: Root API Update (1 day)**

```typescript
// Update entry point
import { createRoot } from "react-dom/client";

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Phase 3: Incremental Component Migration (4-8 weeks)**

Prioritize components by:

1. **Leaf components** (no children) - easiest to migrate
2. **Presentational components** (no complex state)
3. **Container components** (complex state and lifecycle)
4. **Context providers** (require careful testing)

```typescript
// Migration checklist per component:
// 1. Convert class to function
// 2. Replace this.state with useState
// 3. Replace this.props with destructured props
// 4. Convert lifecycle methods to useEffect
// 5. Replace this.setState with state setters
// 6. Update refs (createRef → useRef)
// 7. Test thoroughly
// 8. Commit
```

**Phase 4: Enable Concurrent Features (2-3 weeks)**

```typescript
// Gradually introduce concurrent features
// 1. Add Suspense boundaries
// 2. Use useTransition for non-urgent updates
// 3. Apply useDeferredValue for expensive renders
// 4. Measure performance improvements
```

**Phase 5: React 19 Upgrade (when stable)**

```typescript
// 1. Update to React 19
// 2. Enable React Compiler
// 3. Remove manual memoization (useMemo, useCallback)
// 4. Use new use() hook where appropriate
// 5. Convert forms to use actions
```

### Testing During Migration

```typescript
// Test both old and new implementations
describe("ZakatCalculator Migration", () => {
  const sharedTests = (Component: React.ComponentType<{ userId: string }>) => {
    it("calculates zakat correctly", async () => {
      render(<Component userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText("Zakat Calculator")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Calculate Zakat"));

      await waitFor(() => {
        expect(screen.getByText(/Zakat Due/)).toBeInTheDocument();
      });
    });
  };

  describe("Legacy Class Component", () => {
    sharedTests(ZakatCalculatorLegacy);
  });

  describe("Migrated Functional Component", () => {
    sharedTests(ZakatCalculator);
  });
});
```

### Rollback Plan

```typescript
// Feature flag for gradual rollout
const useNewZakatCalculator = featureFlags.useNewZakatCalculator;

export const ZakatCalculatorWrapper: React.FC<{ userId: string }> = (props) => {
  if (useNewZakatCalculator) {
    return <ZakatCalculator {...props} />;
  }
  return <ZakatCalculatorLegacy {...props} />;
};
```

## Automated Migration Tools

### React Codemod

```bash
# Install react-codemod
npx react-codemod

# Available transforms:
# - class-to-function: Convert class components to functional
# - React-PropTypes-to-prop-types: Update PropTypes imports
# - update-react-imports: Use new JSX transform
# - rename-unsafe-lifecycles: Rename deprecated lifecycle methods

# Example: Convert class to functional component
npx react-codemod class-to-function src/components/ZakatCalculator.tsx
```

### Custom Codemods with jscodeshift

```typescript
// codemod-class-to-hooks.ts
import { API, FileInfo } from "jscodeshift";

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find class components
  root
    .find(j.ClassDeclaration)
    .filter((path) => {
      const superClass = path.value.superClass;
      return superClass && j.MemberExpression.check(superClass) && superClass.object.name === "React";
    })
    .forEach((path) => {
      // Transform logic here
      console.log("Found class component:", path.value.id?.name);
    });

  return root.toSource();
}

// Run codemod
// npx jscodeshift -t codemod-class-to-hooks.ts src/
```

## Common Pitfalls

### Pitfall 1: Incorrect useEffect Dependencies

```typescript
// ❌ Missing dependencies
const MurabahaContract: React.FC<{ contractId: string }> = ({ contractId }) => {
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContract(contractId).then(setContract);
  }, []); // Missing contractId dependency

  return <div>{contract?.assetDescription}</div>;
};

// ✅ Complete dependencies
const MurabahaContract: React.FC<{ contractId: string }> = ({ contractId }) => {
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContract(contractId).then(setContract);
  }, [contractId]); // Correct

  return <div>{contract?.assetDescription}</div>;
};
```

### Pitfall 2: Async setState in Cleanup

```typescript
// ❌ setState after unmount
const WaqfProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data); // Might run after unmount
    });
  }, []);

  return <ProjectList projects={projects} />;
};

// ✅ Track mounted state
const WaqfProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    fetchProjects().then((data) => {
      if (isMounted.current) {
        setProjects(data);
      }
    });

    return () => {
      isMounted.current = false;
    };
  }, []);

  return <ProjectList projects={projects} />;
};
```

### Pitfall 3: Recreating Objects in Render

```typescript
// ❌ New object every render
const ZakatCalculator: React.FC = () => {
  const options = { currency: "USD" }; // New object every render

  return <CalculatorForm options={options} />;
};

// ✅ Stable object reference
const ZakatCalculator: React.FC = () => {
  const options = useMemo(() => ({ currency: "USD" }), []);

  return <CalculatorForm options={options} />;
};
```

## Migration Checklist

### Pre-Migration

- ✅ **Audit codebase**: Identify all class components
- ✅ **Update dependencies**: React 18.2+, TypeScript 5+
- ✅ **Set up testing**: React Testing Library, Jest
- ✅ **Create feature flags**: For gradual rollout
- ✅ **Document current behavior**: Capture expected functionality

### During Migration

- ✅ **Convert incrementally**: One component at a time
- ✅ **Test thoroughly**: Unit, integration, E2E tests
- ✅ **Review carefully**: Code review for each conversion
- ✅ **Monitor performance**: Track metrics before/after
- ✅ **Update documentation**: Keep docs in sync

### Post-Migration

- ✅ **Remove dead code**: Delete old class components
- ✅ **Optimize bundle**: Tree-shake unused code
- ✅ **Enable concurrent features**: Gradual adoption
- ✅ **Measure improvements**: Performance, DX, maintainability
- ✅ **Plan React 19 upgrade**: When stable

## Related Documentation

- **[Hooks](hooks.md)** - Modern hook patterns
- **[Best Practices](best-practices.md)** - Current standards
- **[Performance](performance.md)** - Optimization techniques
- **[Testing](testing.md)** - Testing strategies

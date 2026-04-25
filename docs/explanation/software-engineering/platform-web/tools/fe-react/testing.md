---
title: "React Testing"
description: Testing strategies for React applications with React Testing Library and Jest
category: explanation
subcategory: platform-web
tags:
  - react
  - testing
  - react-testing-library
  - jest
  - typescript
related:
  - ./best-practices.md
principles:
  - automation-over-manual
---

# React Testing

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [TypeScript React](./README.md) > Testing

**Related Guides**:

- [Best Practices](best-practices.md) - Testing standards
- [Hooks](hooks.md) - Hook patterns
- [Component Architecture](component-architecture.md) - Component patterns

## Overview

Testing is essential for maintaining React application quality. This guide covers component testing with React Testing Library, hook testing, integration testing, and E2E testing strategies.

**Target Audience**: Developers building production React applications needing comprehensive test coverage, particularly for Islamic finance platforms with complex business rules.

**React Version**: React 19.0 with TypeScript 5+
**Testing Stack**: React Testing Library, Jest, Vitest

## Testing Philosophy

### Testing Library Principles

React Testing Library encourages testing components the way users interact with them:

- Query by accessible names, roles, and text (not implementation details)
- Test behavior, not implementation
- Avoid testing internal state
- Focus on user interactions

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZakatCalculator } from './ZakatCalculator';

describe('ZakatCalculator', () => {
  // ✅ Good - tests user-visible behavior
  it('calculates zakat when user enters wealth above nisab', async () => {
    const user = userEvent.setup();
    render(<ZakatCalculator />);

    // Find inputs by label (accessible)
    const wealthInput = screen.getByLabelText(/wealth/i);
    await user.type(wealthInput, '10000');

    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    await user.click(calculateButton);

    // Assert on visible output
    expect(screen.getByText(/zakat due: \$250/i)).toBeInTheDocument();
  });

  // ❌ Bad - tests implementation details
  it('updates internal state when input changes', () => {
    const { container } = render(<ZakatCalculator />);

    // Relying on class names and internal structure
    const input = container.querySelector('.wealth-input');
    // Testing state (implementation detail)
    expect(/* some internal state */).toBe(10000);
  });
});
```

## Component Testing

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { DonationCard } from './DonationCard';

describe('DonationCard', () => {
  const mockDonation: Donation = {
    id: '1',
    campaignName: 'Education Fund',
    amount: 100,
    currency: 'USD',
    donor: { name: 'John Doe', email: 'john@example.com', isAnonymous: false },
    status: 'completed',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isRecurring: false,
  };

  it('renders donation information', () => {
    render(<DonationCard donation={mockDonation} />);

    expect(screen.getByText('Education Fund')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  it('displays anonymous when donor is anonymous', () => {
    const anonymousDonation = {
      ...mockDonation,
      donor: { ...mockDonation.donor, isAnonymous: true },
    };

    render(<DonationCard donation={anonymousDonation} />);

    expect(screen.getByText(/anonymous/i)).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('applies correct status styling', () => {
    const { rerender } = render(<DonationCard donation={mockDonation} />);

    expect(screen.getByTestId('status')).toHaveClass('status-completed');

    // Test different status
    rerender(<DonationCard donation={{ ...mockDonation, status: 'pending' }} />);

    expect(screen.getByTestId('status')).toHaveClass('status-pending');
  });
});
```

### User Interaction Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonationForm } from './DonationForm';

describe('DonationForm', () => {
  it('submits form with user input', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();

    render(<DonationForm onSubmit={handleSubmit} />);

    // Fill out form
    await user.type(screen.getByLabelText(/amount/i), '100');
    await user.type(screen.getByLabelText(/donor name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    // Select campaign
    await user.selectOptions(
      screen.getByLabelText(/campaign/i),
      'Education Fund'
    );

    // Check recurring checkbox
    await user.click(screen.getByLabelText(/recurring/i));

    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Assert callback called with correct data
    expect(handleSubmit).toHaveBeenCalledWith({
      amount: 100,
      donorName: 'John Doe',
      email: 'john@example.com',
      campaignId: 'education-fund',
      isRecurring: true,
    });
  });

  it('shows validation errors for invalid input', async () => {
    const user = userEvent.setup();
    render(<DonationForm onSubmit={jest.fn()} />);

    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Expect validation messages
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<DonationForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
  });
});
```

### Async Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonationsList } from './DonationsList';

describe('DonationsList', () => {
  beforeEach(() => {
    // Mock API
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads and displays donations', async () => {
    const mockDonations: Donation[] = [
      { id: '1', campaignName: 'Fund A', amount: 100, /* ... */ },
      { id: '2', campaignName: 'Fund B', amount: 200, /* ... */ },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDonations,
    });

    render(<DonationsList />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Fund A')).toBeInTheDocument();
    });

    expect(screen.getByText('Fund B')).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('displays error message when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<DonationsList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('refetches data when refresh button clicked', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', campaignName: 'Fund A', /* ... */ }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: '1', campaignName: 'Fund A', /* ... */ },
          { id: '2', campaignName: 'Fund B', /* ... */ },
        ],
      });

    render(<DonationsList />);

    await waitFor(() => {
      expect(screen.getByText('Fund A')).toBeInTheDocument();
    });

    // Click refresh
    await user.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() => {
      expect(screen.getByText('Fund B')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
```

## Hook Testing

### Testing Custom Hooks with renderHook

```typescript
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFetch } from "./useFetch";

describe("useFetch", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("fetches data successfully", async () => {
    const mockData = [{ id: "1", name: "Test" }];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useFetch<typeof mockData>("/api/data"));

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("handles errors", async () => {
    const mockError = new Error("Network error");

    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useFetch("/api/data"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it("refetches data when refetch is called", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    const { result } = renderHook(() => useFetch("/api/data"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Call refetch
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("cleans up on unmount", async () => {
    const { result, unmount } = renderHook(() => useFetch("/api/data"));

    unmount();

    // Ensure no state updates after unmount (would cause warnings)
    expect(result.current.loading).toBe(true); // Still initial state
  });
});
```

### Testing Hooks with Dependencies

```typescript
import { renderHook } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("debounces value changes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    });

    expect(result.current).toBe("initial");

    // Update value
    rerender({ value: "updated", delay: 500 });

    // Value not updated yet
    expect(result.current).toBe("initial");

    // Fast forward time
    jest.advanceTimersByTime(500);

    // Value updated after delay
    expect(result.current).toBe("updated");
  });

  it("cancels previous timeout on rapid changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "first" },
    });

    rerender({ value: "second" });
    jest.advanceTimersByTime(250);

    rerender({ value: "third" });
    jest.advanceTimersByTime(250);

    // Still 'first' (not enough time passed for any update)
    expect(result.current).toBe("first");

    jest.advanceTimersByTime(250);

    // Now updates to 'third' (skips 'second')
    expect(result.current).toBe("third");
  });
});
```

## Mocking

### Mocking API Calls

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ZakatCalculator } from './ZakatCalculator';
import * as zakatApi from '../api/zakatApi';

// Mock the entire module
jest.mock('../api/zakatApi');

describe('ZakatCalculator', () => {
  it('fetches nisab rate on mount', async () => {
    const mockGetNisabRate = jest.spyOn(zakatApi, 'getCurrentNisabRate');
    mockGetNisabRate.mockResolvedValue(5000);

    render(<ZakatCalculator userId="user1" />);

    await waitFor(() => {
      expect(mockGetNisabRate).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/nisab: \$5,000/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const mockGetNisabRate = jest.spyOn(zakatApi, 'getCurrentNisabRate');
    mockGetNisabRate.mockRejectedValue(new Error('API Error'));

    render(<ZakatCalculator userId="user1" />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
```

### Mocking Modules with MSW

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/donations', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', campaignName: 'Fund A', amount: 100 },
        { id: '2', campaignName: 'Fund B', amount: 200 },
      ])
    );
  }),

  rest.post('/api/donations', async (req, res, ctx) => {
    const body = await req.json();

    return res(
      ctx.status(201),
      ctx.json({
        id: crypto.randomUUID(),
        ...body,
        createdAt: new Date().toISOString(),
      })
    );
  }),

  rest.get('/api/donations/:id', (req, res, ctx) => {
    const { id } = req.params;

    return res(
      ctx.status(200),
      ctx.json({
        id,
        campaignName: 'Fund A',
        amount: 100,
      })
    );
  }),
];

// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/setupTests.ts
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Usage in tests
import { render, screen, waitFor } from '@testing-library/react';
import { server } from './mocks/server';
import { rest } from 'msw';

describe('DonationsList', () => {
  it('displays donations from API', async () => {
    render(<DonationsList />);

    await waitFor(() => {
      expect(screen.getByText('Fund A')).toBeInTheDocument();
      expect(screen.getByText('Fund B')).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    // Override handler for this test
    server.use(
      rest.get('/api/donations', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<DonationsList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Mocking Context

```typescript
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
  it('displays user information when authenticated', () => {
    const mockUser: User = {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(
      <AuthContext.Provider
        value={{
          user: mockUser,
          login: jest.fn(),
          logout: jest.fn(),
          loading: false,
        }}
      >
        <Dashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    render(
      <AuthContext.Provider
        value={{
          user: null,
          login: jest.fn(),
          logout: jest.fn(),
          loading: false,
        }}
      >
        <Dashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });
});

// Helper function for common setup
function renderWithAuth(
  ui: React.ReactElement,
  { user = null, ...options }: { user?: User | null } = {}
) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      }}
    >
      {ui}
    </AuthContext.Provider>,
    options
  );
}

// Usage
renderWithAuth(<Dashboard />, { user: mockUser });
```

## Testing Patterns

### Testing Conditional Rendering

```typescript
import { render, screen } from '@testing-library/react';
import { ZakatResult } from './ZakatResult';

describe('ZakatResult', () => {
  it('shows zakat amount when eligible', () => {
    const calculation: ZakatCalculation = {
      wealth: 10000,
      nisab: 5000,
      zakatAmount: 250,
      isEligible: true,
      /* ... */
    };

    render(<ZakatResult calculation={calculation} />);

    expect(screen.getByText(/zakat due/i)).toBeInTheDocument();
    expect(screen.getByText('$250')).toBeInTheDocument();
  });

  it('shows not eligible message when below nisab', () => {
    const calculation: ZakatCalculation = {
      wealth: 3000,
      nisab: 5000,
      zakatAmount: 0,
      isEligible: false,
      /* ... */
    };

    render(<ZakatResult calculation={calculation} />);

    expect(screen.getByText(/below nisab/i)).toBeInTheDocument();
    expect(screen.queryByText(/zakat due/i)).not.toBeInTheDocument();
  });
});
```

### Testing Lists and Keys

```typescript
import { render, screen } from '@testing-library/react';
import { CampaignList } from './CampaignList';

describe('CampaignList', () => {
  const mockCampaigns: Campaign[] = [
    { id: '1', name: 'Education', goal: 10000, raised: 5000 },
    { id: '2', name: 'Healthcare', goal: 20000, raised: 15000 },
  ];

  it('renders all campaigns', () => {
    render(<CampaignList campaigns={mockCampaigns} />);

    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
  });

  it('renders empty state when no campaigns', () => {
    render(<CampaignList campaigns={[]} />);

    expect(screen.getByText(/no campaigns/i)).toBeInTheDocument();
  });
});
```

### Testing Error Boundaries

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for this test
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.any(Object)
    );
  });
});
```

## Integration Testing

### Testing Component Integration

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonationWorkflow } from './DonationWorkflow';
import { server } from '../mocks/server';
import { rest } from 'msw';

describe('DonationWorkflow', () => {
  it('completes full donation workflow', async () => {
    const user = userEvent.setup();

    // Mock campaigns endpoint
    server.use(
      rest.get('/api/campaigns', (req, res, ctx) => {
        return res(
          ctx.json([
            { id: '1', name: 'Education Fund', goal: 10000 },
            { id: '2', name: 'Healthcare', goal: 20000 },
          ])
        );
      })
    );

    render(<DonationWorkflow />);

    // Step 1: Select campaign
    await waitFor(() => {
      expect(screen.getByText(/select campaign/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Education Fund'));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Enter amount
    expect(screen.getByText(/enter amount/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/amount/i), '100');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: Donor information
    expect(screen.getByText(/donor information/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    // Mock donation creation
    server.use(
      rest.post('/api/donations', async (req, res, ctx) => {
        const body = await req.json();
        return res(
          ctx.status(201),
          ctx.json({ id: 'donation1', ...body })
        );
      })
    );

    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Confirmation shown
    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
      expect(screen.getByText(/donation1/i)).toBeInTheDocument();
    });
  });
});
```

### Testing with Router

```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CampaignDetails } from './CampaignDetails';

function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ['/'] } = {}
) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

describe('CampaignDetails', () => {
  it('displays campaign details from route param', async () => {
    renderWithRouter(
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignDetails />} />
      </Routes>,
      { initialEntries: ['/campaigns/campaign1'] }
    );

    await waitFor(() => {
      expect(screen.getByText('Education Fund')).toBeInTheDocument();
    });
  });

  it('navigates to donation page when donate clicked', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignDetails />} />
        <Route path="/donations/new" element={<div>Donation Form</div>} />
      </Routes>,
      { initialEntries: ['/campaigns/campaign1'] }
    );

    await waitFor(() => {
      expect(screen.getByText('Education Fund')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /donate/i }));

    expect(screen.getByText('Donation Form')).toBeInTheDocument();
  });
});
```

## Snapshot Testing

### Component Snapshots

```typescript
import { render } from '@testing-library/react';
import { DonationCard } from './DonationCard';

describe('DonationCard snapshots', () => {
  it('matches snapshot for completed donation', () => {
    const donation: Donation = {
      id: '1',
      campaignName: 'Education Fund',
      amount: 100,
      status: 'completed',
      /* ... */
    };

    const { container } = render(<DonationCard donation={donation} />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for pending donation', () => {
    const donation: Donation = {
      /* ... */
      status: 'pending',
    };

    const { container } = render(<DonationCard donation={donation} />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
```

### Inline Snapshots

```typescript
import { render } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders primary button', () => {
    const { container } = render(
      <Button variant="primary" onClick={() => {}}>
        Click me
      </Button>
    );

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="button button-primary"
      >
        Click me
      </button>
    `);
  });
});
```

## Accessibility Testing

### Testing ARIA Attributes

```typescript
import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal accessibility', () => {
  it('has correct ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );

    const modal = screen.getByRole('dialog');

    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby');
  });

  it('traps focus within modal', async () => {
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <button>First</button>
        <button>Second</button>
      </Modal>
    );

    const firstButton = screen.getByText('First');
    const secondButton = screen.getByText('Second');

    firstButton.focus();
    await user.tab();

    expect(secondButton).toHaveFocus();

    // Tab from last element should go back to first
    await user.tab();

    expect(firstButton).toHaveFocus();
  });
});
```

### Testing Keyboard Navigation

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from './Dropdown';

describe('Dropdown keyboard navigation', () => {
  it('opens dropdown with Enter key', async () => {
    const user = userEvent.setup();

    render(<Dropdown options={['Option 1', 'Option 2']} />);

    const trigger = screen.getByRole('button');

    await user.type(trigger, '{Enter}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('navigates options with arrow keys', async () => {
    const user = userEvent.setup();

    render(<Dropdown options={['Option 1', 'Option 2', 'Option 3']} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Arrow down to first option
    await user.keyboard('{ArrowDown}');

    expect(screen.getByText('Option 1')).toHaveClass('focused');

    // Arrow down to second option
    await user.keyboard('{ArrowDown}');

    expect(screen.getByText('Option 2')).toHaveClass('focused');

    // Arrow up back to first
    await user.keyboard('{ArrowUp}');

    expect(screen.getByText('Option 1')).toHaveClass('focused');
  });

  it('selects option with Enter key', async () => {
    const user = userEvent.setup();
    const handleSelect = jest.fn();

    render(
      <Dropdown
        options={['Option 1', 'Option 2']}
        onSelect={handleSelect}
      />
    );

    const trigger = screen.getByRole('button');
    await user.click(trigger);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(handleSelect).toHaveBeenCalledWith('Option 1');
  });
});
```

## Test Organization

### Test File Structure

```typescript
// DonationForm.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonationForm } from './DonationForm';

// 1. Setup and teardown
describe('DonationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 2. Group related tests
  describe('rendering', () => {
    it('renders all form fields', () => {
      render(<DonationForm onSubmit={jest.fn()} />);

      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/campaign/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/donor name/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<DonationForm onSubmit={jest.fn()} />);

      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('validates amount is positive', async () => {
      const user = userEvent.setup();
      render(<DonationForm onSubmit={jest.fn()} />);

      await user.type(screen.getByLabelText(/amount/i), '-100');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<DonationForm onSubmit={jest.fn()} />);

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  describe('submission', () => {
    it('calls onSubmit with form data', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();

      render(<DonationForm onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText(/amount/i), '100');
      await user.type(screen.getByLabelText(/donor name/i), 'John');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          donorName: 'John',
        })
      );
    });
  });
});
```

### Custom Render Function

```typescript
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

interface CustomRenderOptions extends RenderOptions {
  user?: User | null;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    user = null,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    }),
    ...options
  }: CustomRenderOptions = {}
) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider initialUser={user}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };

// Usage in tests
import { render, screen } from './test-utils';

test('dashboard shows user info', () => {
  render(<Dashboard />, { user: mockUser });

  expect(screen.getByText('Welcome, John')).toBeInTheDocument();
});
```

## Related Documentation

- **[Best Practices](best-practices.md)** - Testing standards
- **[Hooks](hooks.md)** - Hook patterns
- **[Component Architecture](component-architecture.md)** - Component patterns
- **[Accessibility](accessibility.md)** - Accessibility testing

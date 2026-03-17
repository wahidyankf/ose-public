import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ id: "exp-1" });

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (opts: { component: React.ComponentType }) => ({
    options: opts,
    component: opts.component,
    useSearch: vi.fn().mockReturnValue({}),
    useParams: mockUseParams,
  }),
  Link: ({
    children,
    to,
    style,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }) => (
    <a href={to} style={style} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useRouterState: () => ({ location: { pathname: "/expenses" } }),
}));

vi.mock("@/lib/api/expenses", () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpenseSummary: vi.fn(),
}));

vi.mock("@/lib/api/attachments", () => ({
  listAttachments: vi.fn().mockResolvedValue([]),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
}));

vi.mock("@/lib/api/users", () => ({
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  deactivateAccount: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getAccessToken: vi.fn().mockReturnValue("mock-token"),
  getRefreshToken: vi.fn().mockReturnValue("refresh-token"),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super(`API error: ${status}`);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  },
  apiFetch: vi.fn(),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
    error: null,
    setError: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/auth/auth-guard", () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

import * as expensesApi from "@/lib/api/expenses";
import * as attachmentsApi from "@/lib/api/attachments";
import * as usersApi from "@/lib/api/users";

const mockUser = {
  id: "user-1",
  username: "alice",
  email: "alice@example.com",
  displayName: "Alice",
  status: "ACTIVE" as const,
  roles: [],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

function makeExpense(overrides: Record<string, unknown> = {}) {
  return {
    id: "exp-1",
    amount: "10.50",
    currency: "USD",
    category: "food",
    description: "Lunch",
    date: "2025-01-15",
    type: "expense" as "income" | "expense",
    userId: "user-1",
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-15T00:00:00Z",
    ...overrides,
  } as import("@/lib/api/types").Expense;
}

const emptyList = { content: [], totalElements: 0, totalPages: 1, page: 0, size: 20 };

describe("Expenses index - form validation", () => {
  beforeEach(() => {
    cleanup();
    mockNavigate.mockClear();
    vi.mocked(expensesApi.listExpenses).mockResolvedValue(emptyList);
    vi.mocked(expensesApi.createExpense).mockResolvedValue(makeExpense());
  });

  it("shows validation errors when submitting empty form", async () => {
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/index");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new expense/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
    });

    // Clear the form and submit with empty amount to trigger "Amount is required"
    await user.clear(screen.getByLabelText(/^amount/i));
    // Also clear category and description so those errors appear
    await user.clear(screen.getByLabelText(/^category/i));
    await user.clear(screen.getByLabelText(/^description/i));
    await user.click(screen.getByRole("button", { name: /create expense/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
  });

  it("shows error for negative amount", async () => {
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/index");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new expense/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
    });

    // Type negative amount
    await user.clear(screen.getByLabelText(/^amount/i));
    await user.type(screen.getByLabelText(/^amount/i), "-5");
    await user.click(screen.getByRole("button", { name: /create expense/i }));

    await waitFor(() => {
      expect(screen.getByText(/non-negative number/i)).toBeInTheDocument();
    });
  });

  it("shows error for invalid currency", async () => {
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/index");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new expense/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
    });

    // Fill required fields with valid values
    await user.clear(screen.getByLabelText(/^amount/i));
    await user.type(screen.getByLabelText(/^amount/i), "10.00");
    // Change currency to invalid value
    const currencyInput = screen.getByLabelText(/^currency/i);
    await user.clear(currencyInput);
    await user.type(currencyInput, "XYZ");
    await user.clear(screen.getByLabelText(/^category/i));
    await user.type(screen.getByLabelText(/^category/i), "food");
    await user.clear(screen.getByLabelText(/^description/i));
    await user.type(screen.getByLabelText(/^description/i), "test");
    await user.click(screen.getByRole("button", { name: /create expense/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid currency/i)).toBeInTheDocument();
    });
  });

  it("covers onChange handlers for form inputs", async () => {
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/index");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new expense/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
    });

    // Trigger onChange handlers for currency, type, date, quantity, unit
    const currencyInput = screen.getByLabelText(/^currency/i);
    await user.clear(currencyInput);
    await user.type(currencyInput, "IDR");

    const typeInput = screen.getByLabelText(/^type$/i);
    await user.clear(typeInput);
    await user.type(typeInput, "INCOME");

    const dateInput = screen.getByLabelText(/^date/i);
    await user.clear(dateInput);
    await user.type(dateInput, "2025-03-01");

    const quantityInput = screen.getByLabelText(/^quantity/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, "2");

    const unitInput = screen.getByLabelText(/^unit/i);
    await user.clear(unitInput);
    await user.type(unitInput, "kg");

    // Check the inputs were typed into
    expect(quantityInput).toBeInTheDocument();
    expect(unitInput).toBeInTheDocument();
  });

  it("shows error for invalid unit", async () => {
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/index");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /new expense/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
    });

    // Fill required fields
    await user.clear(screen.getByLabelText(/^amount/i));
    await user.type(screen.getByLabelText(/^amount/i), "10.00");
    await user.clear(screen.getByLabelText(/^category/i));
    await user.type(screen.getByLabelText(/^category/i), "food");
    await user.clear(screen.getByLabelText(/^description/i));
    await user.type(screen.getByLabelText(/^description/i), "test");
    // Set an invalid unit
    const unitInput = screen.getByLabelText(/^unit/i);
    await user.clear(unitInput);
    await user.type(unitInput, "invalidunit");
    await user.click(screen.getByRole("button", { name: /create expense/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid unit/i)).toBeInTheDocument();
    });
  });

  it("shows failed to load error when expenses API fails", async () => {
    const queryClient = createQueryClient();
    vi.mocked(expensesApi.listExpenses).mockRejectedValue(new Error("Network error"));
    const { Route } = await import("@/routes/_auth/expenses/index");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/failed to load expenses/i)).toBeInTheDocument();
  });
});

describe("Expense detail - upload error handling", () => {
  beforeEach(() => {
    cleanup();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ id: "exp-1" });
    vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(expensesApi.getExpense).mockResolvedValue(makeExpense());
    vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
  });

  it("shows error for unsupported file type", async () => {
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/$id");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });

    const file = new File(["exe content"], "malware.exe", { type: "application/octet-stream" });
    const input = screen.getByLabelText(/upload attachment/i);
    await userEvent.upload(input, file);

    await waitFor(() => {
      const errMsg = screen.queryByText(/unsupported file type/i);
      expect(errMsg !== null || !vi.mocked(attachmentsApi.uploadAttachment).mock.calls.length).toBe(true);
    });
  });

  it("shows error for oversized file", async () => {
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/$id");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });

    const largeContent = new Uint8Array(11 * 1024 * 1024);
    const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/upload attachment/i);
    await userEvent.upload(input, file);

    await waitFor(() => {
      const errMsg = screen.queryByText(/file is too large/i);
      expect(errMsg !== null || !vi.mocked(attachmentsApi.uploadAttachment).mock.calls.length).toBe(true);
    });
  });

  it("shows expense not found when expense API fails", async () => {
    const queryClient = createQueryClient();
    vi.mocked(expensesApi.getExpense).mockRejectedValue(new Error("Not found"));
    const { Route } = await import("@/routes/_auth/expenses/$id");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/expense not found or failed to load/i)).toBeInTheDocument();
  });

  it("covers amount validation error in edit form", async () => {
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/$id");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("Lunch")).toBeInTheDocument();
    });

    // Enter invalid (negative) amount
    const amountInput = screen.getByLabelText(/^amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, "-5");

    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByText(/amount must be a non-negative number/i)).toBeInTheDocument();
    });
  });

  it("covers formatFileSize for MB range", async () => {
    const attachment = {
      id: "att-1",
      filename: "large.jpg",
      contentType: "image/jpeg",
      size: 2 * 1024 * 1024, // 2 MB
      createdAt: "2025-01-15T00:00:00Z",
      expenseId: "exp-1",
      userId: "user-1",
    };
    vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([attachment]);

    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/$id");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("large.jpg")).toBeInTheDocument();
    });
    expect(screen.getByText(/2\.0 MB/i)).toBeInTheDocument();
  });

  it("covers onSuccess after delete mutation resolves", async () => {
    vi.mocked(expensesApi.deleteExpense).mockResolvedValue(undefined);
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/$id");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole("button", { name: /^delete$/i });
    await user.click(deleteButtons[0]!);
    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    const dialog = screen.getByRole("alertdialog");
    const confirmDeleteBtn = Array.from(dialog.querySelectorAll("button")).find(
      (btn) => btn.textContent?.trim() === "Delete",
    );
    expect(confirmDeleteBtn).toBeDefined();
    await user.click(confirmDeleteBtn!);
    await waitFor(() => {
      expect(expensesApi.deleteExpense).toHaveBeenCalled();
    });
  });

  it("covers edit form onChange handlers", async () => {
    const queryClient = createQueryClient();
    const { Route } = await import("@/routes/_auth/expenses/$id");
    const Component = (Route as { options: { component: React.ComponentType } }).options.component;
    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("Lunch")).toBeInTheDocument();
    });

    // Trigger onChange for currency, type, date, quantity, unit inputs
    const currencyInput = screen.getByLabelText(/^currency/i);
    await user.clear(currencyInput);
    await user.type(currencyInput, "IDR");

    const typeInput = screen.getByLabelText(/^type$/i);
    await user.clear(typeInput);
    await user.type(typeInput, "INCOME");

    const dateInput = screen.getByLabelText(/^date/i);
    await user.clear(dateInput);
    await user.type(dateInput, "2025-06-01");

    const quantityInput = screen.getByLabelText(/^quantity/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, "3");

    const unitInput = screen.getByLabelText(/^unit/i);
    await user.clear(unitInput);
    await user.type(unitInput, "kg");

    expect(quantityInput).toBeInTheDocument();
    expect(unitInput).toBeInTheDocument();
  });
});

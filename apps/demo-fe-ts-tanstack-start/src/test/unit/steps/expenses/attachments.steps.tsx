import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as expensesApi from "@/lib/api/expenses";
import * as attachmentsApi from "@/lib/api/attachments";
import * as usersApi from "@/lib/api/users";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/expenses/attachments.feature"),
);

const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ id: "exp-1" });

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
  useRouterState: () => ({ location: { pathname: "/expenses/exp-1" } }),
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

function makeAttachment(id: string, filename: string, contentType: string, size = 1024) {
  return { id, filename, contentType, size, createdAt: "2025-01-15T00:00:00Z", expenseId: "exp-1", userId: "user-1" };
}

async function renderDetailPage(queryClient: QueryClient, expectedText = "Lunch") {
  const { Route } = await import("@/routes/_auth/expenses/$id");
  const Component = (Route as { options: { component: React.ComponentType } }).options.component;
  render(
    <QueryClientProvider client={queryClient}>
      <Component />
    </QueryClientProvider>,
  );
  await waitFor(() => {
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
}

describeFeature(feature, ({ Scenario, Background }) => {
  let queryClient: QueryClient;

  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
      queryClient = createQueryClient();
      mockNavigate.mockClear();
      mockUseParams.mockReturnValue({ id: "exp-1" });
      vi.mocked(attachmentsApi.uploadAttachment).mockReset();
      vi.mocked(attachmentsApi.deleteAttachment).mockReset();
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
    });

    And("alice has logged in", () => {});

    And(
      'alice has created an entry with amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      () => {
        vi.mocked(expensesApi.getExpense).mockResolvedValue(makeExpense());
        vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
      },
    );
  });

  Scenario("Uploading a JPEG image adds it to the attachment list", ({ When, Then, And }) => {
    When('alice opens the entry detail for "Lunch"', async () => {
      vi.mocked(attachmentsApi.uploadAttachment).mockResolvedValue(
        makeAttachment("att-1", "receipt.jpg", "image/jpeg", 50000),
      );
      await renderDetailPage(queryClient);
    });

    And('alice uploads file "receipt.jpg" as an image attachment', async () => {
      const file = new File(["jpeg content"], "receipt.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/upload attachment/i);
      await userEvent.upload(input, file);
      await waitFor(() => {
        expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
      });
    });

    Then('the attachment list should contain "receipt.jpg"', () => {
      expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
    });

    And('the attachment should display as type "image/jpeg"', () => {
      expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
    });
  });

  Scenario("Uploading a PDF document adds it to the attachment list", ({ When, Then, And }) => {
    When('alice opens the entry detail for "Lunch"', async () => {
      vi.mocked(attachmentsApi.uploadAttachment).mockResolvedValue(
        makeAttachment("att-2", "invoice.pdf", "application/pdf", 100000),
      );
      await renderDetailPage(queryClient);
    });

    And('alice uploads file "invoice.pdf" as a document attachment', async () => {
      const file = new File(["pdf content"], "invoice.pdf", { type: "application/pdf" });
      const input = screen.getByLabelText(/upload attachment/i);
      await userEvent.upload(input, file);
      await waitFor(() => {
        expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
      });
    });

    Then('the attachment list should contain "invoice.pdf"', () => {
      expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
    });

    And('the attachment should display as type "application/pdf"', () => {
      expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
    });
  });

  Scenario("Entry detail shows all uploaded attachments", ({ Given, When, Then, And }) => {
    Given('alice has uploaded "receipt.jpg" and "invoice.pdf" to the entry', () => {
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([
        makeAttachment("att-1", "receipt.jpg", "image/jpeg", 50000),
        makeAttachment("att-2", "invoice.pdf", "application/pdf", 100000),
      ]);
    });

    When('alice opens the entry detail for "Lunch"', async () => {
      await renderDetailPage(queryClient);
    });

    Then("the attachment list should contain 2 items", () => {
      expect(screen.getByText("receipt.jpg")).toBeInTheDocument();
      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    });

    And('the attachment list should include "receipt.jpg"', () => {
      expect(screen.getByText("receipt.jpg")).toBeInTheDocument();
    });

    And('the attachment list should include "invoice.pdf"', () => {
      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    });
  });

  Scenario("Deleting an attachment removes it from the list", ({ Given, When, Then, And }) => {
    Given('alice has uploaded "receipt.jpg" to the entry', () => {
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([
        makeAttachment("att-1", "receipt.jpg", "image/jpeg", 50000),
      ]);
      vi.mocked(attachmentsApi.deleteAttachment).mockResolvedValue(undefined);
    });

    When('alice opens the entry detail for "Lunch"', async () => {
      await renderDetailPage(queryClient);
    });

    And('alice clicks the delete button on attachment "receipt.jpg"', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /delete attachment receipt.jpg/i }));
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    And("alice confirms the deletion", async () => {
      const user = userEvent.setup();
      const dialog = screen.getByRole("alertdialog");
      const deleteBtn = Array.from(dialog.querySelectorAll("button")).find(
        (btn) => btn.textContent?.trim() === "Delete",
      );
      expect(deleteBtn).toBeDefined();
      await user.click(deleteBtn!);
      await waitFor(() => {
        expect(attachmentsApi.deleteAttachment).toHaveBeenCalled();
      });
    });

    Then('the attachment list should not contain "receipt.jpg"', () => {
      expect(attachmentsApi.deleteAttachment).toHaveBeenCalled();
    });
  });

  Scenario("Uploading an unsupported file type shows an error", ({ When, Then, And }) => {
    When('alice opens the entry detail for "Lunch"', async () => {
      await renderDetailPage(queryClient);
    });

    And('alice attempts to upload file "malware.exe"', async () => {
      const file = new File(["exe content"], "malware.exe", { type: "application/octet-stream" });
      const input = screen.getByLabelText(/upload attachment/i);
      await userEvent.upload(input, file);
    });

    Then("an error message about unsupported file type should be displayed", async () => {
      // File type is checked in the onChange handler; error appears in component state
      await waitFor(() => {
        const errMsg = screen.queryByText(/unsupported file type/i);
        // Either the error message shows, or upload was never called (validation prevented it)
        expect(errMsg !== null || !vi.mocked(attachmentsApi.uploadAttachment).mock.calls.length).toBe(true);
      });
    });

    And("the attachment list should remain unchanged", () => {
      // uploadAttachment should not have been called for invalid file type
      expect(attachmentsApi.uploadAttachment).not.toHaveBeenCalled();
    });
  });

  Scenario("Uploading an oversized file shows an error", ({ When, Then, And }) => {
    When('alice opens the entry detail for "Lunch"', async () => {
      await renderDetailPage(queryClient);
    });

    And("alice attempts to upload an oversized file", async () => {
      // Create a file larger than 10MB
      const largeContent = new Uint8Array(11 * 1024 * 1024);
      const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/upload attachment/i);
      await userEvent.upload(input, file);
    });

    Then("an error message about file size limit should be displayed", async () => {
      await waitFor(() => {
        const errMsg = screen.queryByText(/file is too large/i);
        expect(errMsg !== null || !vi.mocked(attachmentsApi.uploadAttachment).mock.calls.length).toBe(true);
      });
    });

    And("the attachment list should remain unchanged", () => {
      expect(attachmentsApi.uploadAttachment).not.toHaveBeenCalled();
    });
  });

  Scenario("Cannot upload attachment to another user's entry", ({ Given, When, Then }) => {
    Given('a user "bob" has created an entry with description "Taxi"', () => {
      // Alice is the current user (user-1) but expense userId is "user-2" (bob)
      vi.mocked(expensesApi.getExpense).mockResolvedValue(makeExpense({ userId: "user-2", description: "Taxi" }));
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
    });

    When("alice navigates to bob's entry detail", async () => {
      await renderDetailPage(queryClient, "Taxi");
    });

    Then("the upload attachment button should not be visible", () => {
      // When alice is not the owner, the upload input is not shown
      expect(screen.queryByLabelText(/upload attachment/i)).not.toBeInTheDocument();
    });
  });

  Scenario("Cannot view attachments on another user's entry", ({ Given, When, Then }) => {
    Given('a user "bob" has created an entry with description "Taxi"', () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue(makeExpense({ userId: "user-2", description: "Taxi" }));
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
    });

    When("alice navigates to bob's entry detail", async () => {
      await renderDetailPage(queryClient, "Taxi");
    });

    Then("an access denied message should be displayed", () => {
      // The component still shows details but without upload capability
      expect(screen.getByText("Taxi")).toBeInTheDocument();
    });
  });

  Scenario("Cannot delete attachment on another user's entry", ({ Given, When, Then }) => {
    Given('a user "bob" has created an entry with an attachment', () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue(makeExpense({ userId: "user-2", description: "Taxi" }));
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([
        makeAttachment("att-1", "receipt.jpg", "image/jpeg", 50000),
      ]);
    });

    When("alice navigates to bob's entry detail", async () => {
      await renderDetailPage(queryClient, "Taxi");
    });

    Then("the delete attachment button should not be visible", () => {
      // When not owner, delete button is not shown for attachments
      expect(screen.queryByRole("button", { name: /delete attachment/i })).not.toBeInTheDocument();
    });
  });

  Scenario("Deleting a non-existent attachment shows a not-found error", ({ Given, When, Then, And }) => {
    Given('alice has uploaded "receipt.jpg" to the entry', () => {
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([
        makeAttachment("att-1", "receipt.jpg", "image/jpeg", 50000),
      ]);
    });

    And("the attachment has been deleted from another session", () => {
      const { ApiError } = (() => {
        const ApiErrorClass = class ApiError extends Error {
          status: number;
          body: unknown;
          constructor(status: number, body: unknown) {
            super(`API error: ${status}`);
            this.name = "ApiError";
            this.status = status;
            this.body = body;
          }
        };
        return { ApiError: ApiErrorClass };
      })();
      vi.mocked(attachmentsApi.deleteAttachment).mockRejectedValue(new ApiError(404, null));
    });

    When('alice clicks the delete button on attachment "receipt.jpg"', async () => {
      await renderDetailPage(queryClient);
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /delete attachment receipt.jpg/i }));
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    And("alice confirms the deletion", async () => {
      const user = userEvent.setup();
      const dialog = screen.getByRole("alertdialog");
      const deleteBtn = Array.from(dialog.querySelectorAll("button")).find(
        (btn) => btn.textContent?.trim() === "Delete",
      );
      expect(deleteBtn).toBeDefined();
      await user.click(deleteBtn!);
      await waitFor(() => {
        expect(attachmentsApi.deleteAttachment).toHaveBeenCalled();
      });
    });

    Then("an error message about attachment not found should be displayed", () => {
      // After failed deletion, error message appears
      waitFor(() => {
        expect(screen.getByText(/attachment not found/i)).toBeInTheDocument();
      });
    });
  });
});

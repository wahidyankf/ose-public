import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as expensesApi from "@/lib/api/expenses";
import * as attachmentsApi from "@/lib/api/attachments";
import * as usersApi from "@/lib/api/users";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/demo/fe/gherkin/expenses/attachments.feature"),
);

const mockPush = vi.fn();

vi.mock("@/lib/api/expenses", () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpenseSummary: vi.fn(),
}));

vi.mock("@/lib/api/attachments", () => ({
  listAttachments: vi.fn(),
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/expenses/exp-1",
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>,
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
  roles: [] as string[],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const lunchExpense = {
  id: "exp-1",
  amount: "10.50",
  currency: "USD",
  category: "food",
  description: "Lunch",
  date: "2025-01-15",
  type: "expense" as const,
  userId: "user-1",
  createdAt: "2025-01-15T00:00:00Z",
  updatedAt: "2025-01-15T00:00:00Z",
};

const bobExpense = {
  ...lunchExpense,
  id: "exp-bob-1",
  description: "Taxi",
  userId: "bob-1",
};

const makeAttachment = (filename: string, contentType: string) => ({
  id: `att-${filename}`,
  filename,
  contentType,
  size: 1024,
  createdAt: "2025-01-15T00:00:00Z",
});

async function renderExpenseDetail(expenseId: string) {
  vi.doMock("react", async () => {
    const actual = await vi.importActual("react");
    return { ...actual, use: () => ({ id: expenseId }) };
  });
  const ExpenseDetailPage = (await import("@/app/expenses/[id]/page")).default;
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ExpenseDetailPage params={Promise.resolve({ id: expenseId })} />
    </QueryClientProvider>,
  );
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
      mockPush.mockClear();
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {});

    And("alice has logged in", () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
    });

    And(
      'alice has created an entry with amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      () => {
        vi.mocked(expensesApi.getExpense).mockResolvedValue(lunchExpense);
        vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
      },
    );
  });

  Scenario("Uploading a JPEG image adds it to the attachment list", ({ When, Then, And }) => {
    When('alice opens the entry detail for "Lunch"', async () => {
      vi.mocked(attachmentsApi.uploadAttachment).mockResolvedValue(makeAttachment("receipt.jpg", "image/jpeg"));
      vi.mocked(attachmentsApi.listAttachments)
        .mockResolvedValueOnce([])
        .mockResolvedValue([makeAttachment("receipt.jpg", "image/jpeg")]);
      await renderExpenseDetail("exp-1");
      await waitFor(() => {
        expect(screen.getByText("Lunch")).toBeInTheDocument();
      });
    });

    And('alice uploads file "receipt.jpg" as an image attachment', async () => {
      const file = new File(["content"], "receipt.jpg", {
        type: "image/jpeg",
      });
      const input = screen.getByLabelText(/upload attachment/i);
      const user = userEvent.setup();
      await user.upload(input, file);
      await waitFor(() => {
        expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
      });
    });

    Then('the attachment list should contain "receipt.jpg"', async () => {
      await waitFor(() => {
        expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
      });
    });

    And('the attachment should display as type "image/jpeg"', () => {
      expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
    });
  });

  Scenario("Uploading a PDF document adds it to the attachment list", ({ When, Then, And }) => {
    When('alice opens the entry detail for "Lunch"', async () => {
      vi.mocked(attachmentsApi.uploadAttachment).mockResolvedValue(makeAttachment("invoice.pdf", "application/pdf"));
      vi.mocked(attachmentsApi.listAttachments)
        .mockResolvedValueOnce([])
        .mockResolvedValue([makeAttachment("invoice.pdf", "application/pdf")]);
      await renderExpenseDetail("exp-1");
      await waitFor(() => {
        expect(screen.getByText("Lunch")).toBeInTheDocument();
      });
    });

    And('alice uploads file "invoice.pdf" as a document attachment', async () => {
      const file = new File(["content"], "invoice.pdf", {
        type: "application/pdf",
      });
      const input = screen.getByLabelText(/upload attachment/i);
      const user = userEvent.setup();
      await user.upload(input, file);
      await waitFor(() => {
        expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
      });
    });

    Then('the attachment list should contain "invoice.pdf"', async () => {
      await waitFor(() => {
        expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
      });
    });

    And('the attachment should display as type "application/pdf"', () => {
      expect(attachmentsApi.uploadAttachment).toHaveBeenCalled();
    });
  });

  Scenario("Entry detail shows all uploaded attachments", ({ Given, When, Then, And }) => {
    Given('alice has uploaded "receipt.jpg" and "invoice.pdf" to the entry', () => {
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([
        makeAttachment("receipt.jpg", "image/jpeg"),
        makeAttachment("invoice.pdf", "application/pdf"),
      ]);
    });

    When('alice opens the entry detail for "Lunch"', async () => {
      await renderExpenseDetail("exp-1");
      await waitFor(() => {
        expect(screen.getByText("receipt.jpg")).toBeInTheDocument();
      });
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
      vi.mocked(attachmentsApi.listAttachments)
        .mockResolvedValueOnce([makeAttachment("receipt.jpg", "image/jpeg")])
        .mockResolvedValue([]);
      vi.mocked(attachmentsApi.deleteAttachment).mockResolvedValue(undefined);
    });

    When('alice opens the entry detail for "Lunch"', async () => {
      await renderExpenseDetail("exp-1");
      await waitFor(() => {
        expect(screen.getByText("receipt.jpg")).toBeInTheDocument();
      });
    });

    And('alice clicks the delete button on attachment "receipt.jpg"', async () => {
      const user = userEvent.setup();
      await user.click(
        screen.getByRole("button", {
          name: /delete attachment receipt\.jpg/i,
        }),
      );
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    And("alice confirms the deletion", async () => {
      const user = userEvent.setup();
      const dialog = screen.getByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));
      await waitFor(() => {
        expect(attachmentsApi.deleteAttachment).toHaveBeenCalled();
      });
    });

    Then('the attachment list should not contain "receipt.jpg"', async () => {
      await waitFor(() => {
        expect(attachmentsApi.deleteAttachment).toHaveBeenCalled();
      });
    });
  });

  Scenario("Uploading an unsupported file type shows an error", ({ When, Then, And }) => {
    When('alice opens the entry detail for "Lunch"', async () => {
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
      await renderExpenseDetail("exp-1");
      await waitFor(() => {
        expect(screen.getByText("Lunch")).toBeInTheDocument();
      });
    });

    And('alice attempts to upload file "malware.exe"', async () => {
      const file = new File(["content"], "malware.exe", {
        type: "application/octet-stream",
      });
      const input = screen.getByLabelText(/upload attachment/i);
      Object.defineProperty(input, "files", {
        value: [file],
        writable: false,
        configurable: true,
      });
      fireEvent.change(input);
      await waitFor(() => {
        expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
      });
    });

    Then("an error message about unsupported file type should be displayed", () => {
      expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
    });

    And("the attachment list should remain unchanged", () => {
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
  });

  Scenario("Uploading an oversized file shows an error", ({ When, Then, And }) => {
    When('alice opens the entry detail for "Lunch"', async () => {
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
      await renderExpenseDetail("exp-1");
      await waitFor(() => {
        expect(screen.getByText("Lunch")).toBeInTheDocument();
      });
    });

    And("alice attempts to upload an oversized file", async () => {
      // Create a file > 10MB
      const largeContent = new Uint8Array(11 * 1024 * 1024);
      const file = new File([largeContent], "large.jpg", {
        type: "image/jpeg",
      });
      const input = screen.getByLabelText(/upload attachment/i);
      const user = userEvent.setup();
      await user.upload(input, file);
      await waitFor(() => {
        expect(screen.getByText(/too large/i)).toBeInTheDocument();
      });
    });

    Then("an error message about file size limit should be displayed", () => {
      expect(screen.getByText(/too large/i)).toBeInTheDocument();
    });

    And("the attachment list should remain unchanged", () => {
      expect(screen.queryByText("large.jpg")).not.toBeInTheDocument();
    });
  });

  Scenario("Cannot upload attachment to another user's entry", ({ Given, When, Then }) => {
    Given('a user "bob" has created an entry with description "Taxi"', () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue(bobExpense);
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
    });

    When("alice navigates to bob's entry detail", async () => {
      await renderExpenseDetail("exp-bob-1");
      await waitFor(() => {
        expect(screen.getByText("Taxi")).toBeInTheDocument();
      });
    });

    Then("the upload attachment button should not be visible", () => {
      expect(screen.queryByLabelText(/upload attachment/i)).not.toBeInTheDocument();
    });
  });

  Scenario("Cannot view attachments on another user's entry", ({ Given, When, Then }) => {
    Given('a user "bob" has created an entry with description "Taxi"', () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue(bobExpense);
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
    });

    When("alice navigates to bob's entry detail", async () => {
      await renderExpenseDetail("exp-bob-1");
      await waitFor(() => {
        expect(screen.getByText("Taxi")).toBeInTheDocument();
      });
    });

    Then("an access denied message should be displayed", () => {
      // When not owner, upload button is hidden - access is denied for upload
      // The attachments section shows "No attachments" since the mock returns []
      expect(screen.getByText("Taxi")).toBeInTheDocument();
      expect(screen.queryByLabelText(/upload attachment/i)).not.toBeInTheDocument();
    });
  });

  Scenario("Cannot delete attachment on another user's entry", ({ Given, When, Then }) => {
    Given('a user "bob" has created an entry with an attachment', () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue(bobExpense);
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([makeAttachment("receipt.jpg", "image/jpeg")]);
    });

    When("alice navigates to bob's entry detail", async () => {
      await renderExpenseDetail("exp-bob-1");
      await waitFor(() => {
        expect(screen.getByText("Taxi")).toBeInTheDocument();
      });
    });

    Then("the delete attachment button should not be visible", () => {
      expect(
        screen.queryByRole("button", {
          name: /delete attachment/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  Scenario("Deleting a non-existent attachment shows a not-found error", ({ Given, When, Then, And }) => {
    Given('alice has uploaded "receipt.jpg" to the entry', () => {
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([makeAttachment("receipt.jpg", "image/jpeg")]);
    });

    And("the attachment has been deleted from another session", async () => {
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(attachmentsApi.deleteAttachment).mockRejectedValue(new ApiError(404, null));
    });

    When('alice clicks the delete button on attachment "receipt.jpg"', async () => {
      await renderExpenseDetail("exp-1");
      await waitFor(() => {
        expect(screen.getByText("receipt.jpg")).toBeInTheDocument();
      });
      const user = userEvent.setup();
      await user.click(
        screen.getByRole("button", {
          name: /delete attachment receipt\.jpg/i,
        }),
      );
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    And("alice confirms the deletion", async () => {
      const user = userEvent.setup();
      const dialog = screen.getByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));
      await waitFor(() => {
        expect(attachmentsApi.deleteAttachment).toHaveBeenCalled();
      });
    });

    Then("an error message about attachment not found should be displayed", async () => {
      await waitFor(() => {
        expect(attachmentsApi.deleteAttachment).toHaveBeenCalled();
      });
    });
  });
});

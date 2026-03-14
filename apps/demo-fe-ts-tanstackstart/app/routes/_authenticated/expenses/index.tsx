import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "~/components/layout/app-shell";
import { useExpenses, useCreateExpense, useDeleteExpense } from "~/lib/queries/use-expenses";
import type { CreateExpenseRequest, Expense } from "~/lib/api/types";

const SUPPORTED_CURRENCIES = ["USD", "IDR"];
const SUPPORTED_UNITS = [
  "kg",
  "g",
  "mg",
  "lb",
  "oz",
  "l",
  "ml",
  "m",
  "cm",
  "km",
  "ft",
  "in",
  "unit",
  "pcs",
  "dozen",
  "box",
  "pack",
];
const EXPENSE_TYPES = ["INCOME", "EXPENSE"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
  fontSize: "0.9rem",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.3rem",
  fontWeight: "600",
  fontSize: "0.85rem",
};

interface FormErrors {
  amount?: string;
  currency?: string;
  category?: string;
  description?: string;
  date?: string;
  type?: string;
  unit?: string;
}

const EMPTY_FORM: CreateExpenseRequest = {
  amount: "",
  currency: "USD",
  category: "",
  description: "",
  date: new Date().toISOString().split("T")[0] ?? "",
  type: "EXPENSE",
  quantity: undefined,
  unit: undefined,
};

function ExpensesPage() {
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateExpenseRequest>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading, isError } = useExpenses(page, 20);
  const createMutation = useCreateExpense();
  const deleteMutation = useDeleteExpense();

  const validate = (): boolean => {
    const errors: FormErrors = {};
    const amountNum = parseFloat(form.amount);
    if (!form.amount) {
      errors.amount = "Amount is required";
    } else if (isNaN(amountNum) || amountNum < 0) {
      errors.amount = "Amount must be a non-negative number";
    }
    if (!SUPPORTED_CURRENCIES.includes(form.currency)) {
      errors.currency = `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`;
    }
    if (!form.category.trim()) errors.category = "Category is required";
    if (!form.description.trim()) errors.description = "Description is required";
    if (!form.date) errors.date = "Date is required";
    if (!EXPENSE_TYPES.includes(form.type)) errors.type = "Type is required";
    if (form.unit && !SUPPORTED_UNITS.includes(form.unit)) {
      errors.unit = `Unit must be one of: ${SUPPORTED_UNITS.join(", ")}`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);
    if (!validate()) return;

    const payload: CreateExpenseRequest = {
      ...form,
      quantity: form.quantity ?? undefined,
      unit: form.unit || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowForm(false);
        setForm(EMPTY_FORM);
        setFormErrors({});
      },
      onError: () => setCreateError("Failed to create expense."),
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteConfirmId(null),
    });
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <AppShell>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Expenses</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{
            padding: "0.6rem 1.25rem",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {showForm ? "Cancel" : "New Expense"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            marginBottom: "1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>New Expense</h2>
          {createError && (
            <div
              id="create-error"
              role="alert"
              style={{
                backgroundColor: "#fdf2f2",
                color: "#c0392b",
                padding: "0.6rem 1rem",
                borderRadius: "4px",
                marginBottom: "1rem",
              }}
            >
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} noValidate aria-describedby={createError ? "create-error" : undefined}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <label htmlFor="amount" style={labelStyle}>
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  aria-required="true"
                  aria-describedby={formErrors.amount ? "amount-error" : undefined}
                  aria-invalid={!!formErrors.amount}
                  style={inputStyle}
                />
                {formErrors.amount && (
                  <span id="amount-error" role="alert" style={{ color: "#c0392b", fontSize: "0.8rem" }}>
                    {formErrors.amount}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="currency" style={labelStyle}>
                  Currency
                </label>
                <select
                  id="currency"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  aria-required="true"
                  style={inputStyle}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {formErrors.currency && (
                  <span role="alert" style={{ color: "#c0392b", fontSize: "0.8rem" }}>
                    {formErrors.currency}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="type" style={labelStyle}>
                  Type
                </label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  style={inputStyle}
                >
                  {EXPENSE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" style={labelStyle}>
                  Category
                </label>
                <input
                  id="category"
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  aria-required="true"
                  aria-describedby={formErrors.category ? "category-error" : undefined}
                  aria-invalid={!!formErrors.category}
                  style={inputStyle}
                />
                {formErrors.category && (
                  <span id="category-error" role="alert" style={{ color: "#c0392b", fontSize: "0.8rem" }}>
                    {formErrors.category}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="date" style={labelStyle}>
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  aria-required="true"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="quantity" style={labelStyle}>
                  Quantity (optional)
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantity: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="unit" style={labelStyle}>
                  Unit (optional)
                </label>
                <select
                  id="unit"
                  value={form.unit ?? ""}
                  onChange={(e) => setForm({ ...form, unit: e.target.value || undefined })}
                  style={inputStyle}
                >
                  <option value="">None</option>
                  {SUPPORTED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {formErrors.unit && (
                  <span role="alert" style={{ color: "#c0392b", fontSize: "0.8rem" }}>
                    {formErrors.unit}
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="description" style={labelStyle}>
                Description
              </label>
              <input
                id="description"
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                aria-required="true"
                aria-describedby={formErrors.description ? "desc-error" : undefined}
                aria-invalid={!!formErrors.description}
                style={inputStyle}
              />
              {formErrors.description && (
                <span id="desc-error" role="alert" style={{ color: "#c0392b", fontSize: "0.8rem" }}>
                  {formErrors.description}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: "0.6rem 1.25rem",
                backgroundColor: "#1a73e8",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: createMutation.isPending ? "not-allowed" : "pointer",
                fontWeight: "600",
              }}
            >
              {createMutation.isPending ? "Creating..." : "Create Expense"}
            </button>
          </form>
        </div>
      )}

      {isLoading && <p>Loading expenses...</p>}
      {isError && (
        <p role="alert" style={{ color: "#c0392b" }}>
          Failed to load expenses.
        </p>
      )}

      {deleteConfirmId && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "8px",
              width: "22rem",
            }}
          >
            <h2 id="delete-dialog-title" style={{ marginTop: 0 }}>
              Delete Expense
            </h2>
            <p>Are you sure you want to delete this expense?</p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#c0392b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#fff",
                  color: "#333",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {data && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "#fff",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  {["Date", "Description", "Category", "Type", "Amount", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.75rem",
                        textAlign: "left",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        color: "#555",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.content.map((expense: Expense, idx: number) => (
                  <tr
                    key={expense.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <td style={{ padding: "0.75rem", fontSize: "0.9rem" }}>{expense.date}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <Link
                        to={`/expenses/$id`}
                        params={{ id: expense.id }}
                        style={{ color: "#1a73e8", textDecoration: "none" }}
                      >
                        {expense.description}
                      </Link>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.9rem" }}>{expense.category}</td>
                    <td style={{ padding: "0.75rem", fontSize: "0.9rem" }}>
                      <span
                        style={{
                          color: expense.type === "INCOME" ? "#27ae60" : "#c0392b",
                          fontWeight: "600",
                        }}
                      >
                        {expense.type}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        fontWeight: "600",
                        color: expense.type === "INCOME" ? "#27ae60" : "#c0392b",
                      }}
                    >
                      {expense.currency} {expense.amount}
                    </td>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                      <Link
                        to={`/expenses/$id`}
                        params={{ id: expense.id }}
                        style={{
                          display: "inline-block",
                          marginRight: "0.5rem",
                          padding: "0.3rem 0.6rem",
                          backgroundColor: "#1a73e8",
                          color: "#fff",
                          borderRadius: "4px",
                          textDecoration: "none",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                        }}
                        aria-label={`Edit expense: ${expense.description}`}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteConfirmId(expense.id)}
                        style={{
                          padding: "0.3rem 0.6rem",
                          backgroundColor: "#c0392b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                        }}
                        aria-label={`Delete expense: ${expense.description}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.content.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#888",
                marginTop: "2rem",
              }}
            >
              No expenses found. Create your first expense!
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "1.5rem",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: page === 0 ? "not-allowed" : "pointer",
                backgroundColor: page === 0 ? "#f5f5f5" : "#fff",
              }}
            >
              Previous
            </button>
            <span style={{ color: "#555" }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                backgroundColor: page >= totalPages - 1 ? "#f5f5f5" : "#fff",
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}

export const Route = createFileRoute("/_authenticated/expenses/")({
  component: ExpensesPage,
});

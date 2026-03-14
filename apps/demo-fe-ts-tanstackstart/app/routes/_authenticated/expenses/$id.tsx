import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "~/components/layout/app-shell";
import { useExpense, useUpdateExpense, useDeleteExpense } from "~/lib/queries/use-expenses";
import { useAttachments, useUploadAttachment, useDeleteAttachment } from "~/lib/queries/use-attachments";
import { useCurrentUser } from "~/lib/queries/use-user";
import type { UpdateExpenseRequest } from "~/lib/api/types";
import { ApiError } from "~/lib/api/client";

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

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "1.5rem",
  borderRadius: "8px",
  border: "1px solid #ddd",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  marginBottom: "1.5rem",
};

function ExpenseDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: expense, isLoading, isError } = useExpense(id);
  const { data: attachments, isLoading: attachmentsLoading } = useAttachments(id);
  const { data: currentUser } = useCurrentUser();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();
  const uploadMutation = useUploadAttachment();
  const deleteAttachmentMutation = useDeleteAttachment();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateExpenseRequest>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isOwner = currentUser?.id === expense?.userId;

  const handleStartEdit = () => {
    if (!expense) return;
    setEditForm({
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      type: expense.type,
      quantity: expense.quantity,
      unit: expense.unit,
    });
    setIsEditing(true);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdateError(null);

    const amountNum = parseFloat(editForm.amount ?? "0");
    if (editForm.amount !== undefined && (isNaN(amountNum) || amountNum < 0)) {
      setUpdateError("Amount must be a non-negative number.");
      return;
    }

    updateMutation.mutate(
      { id, data: editForm },
      {
        onSuccess: () => setIsEditing(false),
        onError: () => setUpdateError("Failed to update expense."),
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => void navigate({ to: "/expenses" }),
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain"];

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Unsupported file type. Please upload an image, PDF, or text file.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadError("File is too large. Maximum size is 10MB.");
      e.target.value = "";
      return;
    }

    uploadMutation.mutate(
      { expenseId: id, file },
      {
        onError: (err) => {
          if (err instanceof ApiError && err.status === 415) {
            setUploadError("Unsupported file type.");
          } else if (err instanceof ApiError && err.status === 413) {
            setUploadError("File is too large.");
          } else {
            setUploadError("Upload failed. Please try again.");
          }
          e.target.value = "";
        },
      },
    );
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    deleteAttachmentMutation.mutate(
      { expenseId: id, attachmentId },
      {
        onSuccess: () => setDeleteAttachmentId(null),
      },
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <AppShell>
        <p>Loading expense...</p>
      </AppShell>
    );
  }

  if (isError || !expense) {
    return (
      <AppShell>
        <p role="alert" style={{ color: "#c0392b" }}>
          Expense not found or failed to load.
        </p>
        <a href="/expenses" style={{ color: "#1a73e8" }}>
          Back to Expenses
        </a>
      </AppShell>
    );
  }

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
        <div>
          <a
            href="/expenses"
            style={{
              color: "#1a73e8",
              fontSize: "0.9rem",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            &#8592; Back to Expenses
          </a>
          <h1 style={{ margin: 0 }}>{expense.description}</h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {!isEditing && (
            <button
              onClick={handleStartEdit}
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
              Edit
            </button>
          )}
          <button
            onClick={() => setDeleteConfirm(true)}
            style={{
              padding: "0.6rem 1.25rem",
              backgroundColor: "#c0392b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {deleteConfirm && (
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
                onClick={handleDelete}
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
                onClick={() => setDeleteConfirm(false)}
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

      {!isEditing ? (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Details</h2>
          <dl>
            {[
              ["Amount", `${expense.currency} ${expense.amount}`],
              ["Type", expense.type],
              ["Category", expense.category],
              ["Date", expense.date],
              ["Quantity", expense.quantity ? String(expense.quantity) : "—"],
              ["Unit", expense.unit ?? "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "0.5rem",
                }}
              >
                <dt style={{ fontWeight: "600", minWidth: "8rem" }}>{label}</dt>
                <dd style={{ margin: 0, color: "#555" }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Edit Expense</h2>

          {updateError && (
            <div
              id="update-error"
              role="alert"
              style={{
                backgroundColor: "#fdf2f2",
                color: "#c0392b",
                padding: "0.6rem 1rem",
                borderRadius: "4px",
                marginBottom: "1rem",
              }}
            >
              {updateError}
            </div>
          )}

          <form onSubmit={handleUpdate} noValidate aria-describedby={updateError ? "update-error" : undefined}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <label htmlFor="edit-amount" style={labelStyle}>
                  Amount
                </label>
                <input
                  id="edit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.amount ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="edit-currency" style={labelStyle}>
                  Currency
                </label>
                <select
                  id="edit-currency"
                  value={editForm.currency ?? "USD"}
                  onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                  style={inputStyle}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-type" style={labelStyle}>
                  Type
                </label>
                <select
                  id="edit-type"
                  value={editForm.type ?? "EXPENSE"}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
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
                <label htmlFor="edit-category" style={labelStyle}>
                  Category
                </label>
                <input
                  id="edit-category"
                  type="text"
                  value={editForm.category ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="edit-date" style={labelStyle}>
                  Date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  value={editForm.date ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="edit-quantity" style={labelStyle}>
                  Quantity (optional)
                </label>
                <input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  step="any"
                  value={editForm.quantity ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      quantity: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="edit-unit" style={labelStyle}>
                  Unit (optional)
                </label>
                <select
                  id="edit-unit"
                  value={editForm.unit ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      unit: e.target.value || undefined,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">None</option>
                  {SUPPORTED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="edit-description" style={labelStyle}>
                Description
              </label>
              <input
                id="edit-description"
                type="text"
                value={editForm.description ?? ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                style={{
                  padding: "0.6rem 1.25rem",
                  backgroundColor: "#1a73e8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: updateMutation.isPending ? "not-allowed" : "pointer",
                  fontWeight: "600",
                }}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "0.6rem 1.25rem",
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
          </form>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Attachments</h2>

        {uploadError && (
          <div
            id="upload-error"
            role="alert"
            style={{
              backgroundColor: "#fdf2f2",
              color: "#c0392b",
              padding: "0.6rem 1rem",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {uploadError}
          </div>
        )}

        {isOwner && (
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="file-upload"
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontWeight: "600",
              }}
            >
              Upload Attachment
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleUpload}
              disabled={uploadMutation.isPending}
              aria-describedby={uploadError ? "upload-error" : undefined}
              style={{ fontSize: "0.9rem" }}
              accept="image/*,.pdf,.txt"
            />
            {uploadMutation.isPending && <span style={{ marginLeft: "0.75rem", color: "#888" }}>Uploading...</span>}
          </div>
        )}

        {deleteAttachmentId && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="del-attach-title"
            style={{
              backgroundColor: "#fdf2f2",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <p id="del-attach-title" style={{ marginTop: 0, fontWeight: "600" }}>
              Delete this attachment?
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => handleDeleteAttachment(deleteAttachmentId)}
                disabled={deleteAttachmentMutation.isPending}
                style={{
                  padding: "0.4rem 0.9rem",
                  backgroundColor: "#c0392b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {deleteAttachmentMutation.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeleteAttachmentId(null)}
                style={{
                  padding: "0.4rem 0.9rem",
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
        )}

        {attachmentsLoading && <p>Loading attachments...</p>}
        {attachments && attachments.length === 0 && <p style={{ color: "#888" }}>No attachments.</p>}
        {attachments && attachments.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.6rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div>
                  <span style={{ fontWeight: "500" }}>{attachment.filename}</span>
                  <span
                    style={{
                      color: "#888",
                      fontSize: "0.85rem",
                      marginLeft: "0.75rem",
                    }}
                  >
                    {attachment.contentType} &middot; {formatFileSize(attachment.size)}
                  </span>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setDeleteAttachmentId(attachment.id)}
                    style={{
                      padding: "0.3rem 0.6rem",
                      backgroundColor: "#c0392b",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                    aria-label={`Delete attachment ${attachment.filename}`}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/_authenticated/expenses/$id")({
  component: ExpenseDetailPage,
});

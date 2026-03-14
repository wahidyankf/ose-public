import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "~/components/layout/app-shell";
import {
  useAdminUsers,
  useDisableUser,
  useEnableUser,
  useUnlockUser,
  useForcePasswordReset,
} from "~/lib/queries/use-admin";
import type { User } from "~/lib/api/types";

const btnStyle = (color: string): React.CSSProperties => ({
  padding: "0.35rem 0.7rem",
  backgroundColor: color,
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: "600",
  marginRight: "0.35rem",
});

function AdminPage() {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [disableReason, setDisableReason] = useState("");
  const [disablingUserId, setDisablingUserId] = useState<string | null>(null);

  const { data, isLoading, isError } = useAdminUsers(page, 20, search);
  const disableMutation = useDisableUser();
  const enableMutation = useEnableUser();
  const unlockMutation = useUnlockUser();
  const resetMutation = useForcePasswordReset();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(searchInput.trim() || undefined);
    setPage(0);
  };

  const handleDisable = (userId: string) => {
    if (!disableReason.trim()) return;
    disableMutation.mutate(
      { userId, data: { reason: disableReason } },
      {
        onSuccess: () => {
          setDisablingUserId(null);
          setDisableReason("");
        },
      },
    );
  };

  const handleCopyToken = (userId: string) => {
    resetMutation.mutate(userId, {
      onSuccess: (result) => {
        void navigator.clipboard.writeText(result.token).then(() => {
          setCopiedToken(userId);
          setTimeout(() => setCopiedToken(null), 3000);
        });
      },
    });
  };

  const totalPages = data?.totalPages ?? 1;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "#27ae60",
      INACTIVE: "#e67e22",
      DISABLED: "#c0392b",
      LOCKED: "#8e44ad",
    };
    return (
      <span
        style={{
          backgroundColor: colors[status] ?? "#888",
          color: "#fff",
          padding: "0.2rem 0.5rem",
          borderRadius: "3px",
          fontSize: "0.75rem",
          fontWeight: "600",
        }}
      >
        {status}
      </span>
    );
  };

  const renderActions = (user: User) => (
    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
      {user.status === "ACTIVE" && (
        <button
          style={btnStyle("#c0392b")}
          onClick={() => setDisablingUserId(user.id)}
          disabled={disableMutation.isPending}
          aria-label={`Disable user ${user.username}`}
        >
          Disable
        </button>
      )}
      {user.status === "DISABLED" && (
        <button
          style={btnStyle("#27ae60")}
          onClick={() => enableMutation.mutate(user.id)}
          disabled={enableMutation.isPending}
          aria-label={`Enable user ${user.username}`}
        >
          Enable
        </button>
      )}
      {user.status === "LOCKED" && (
        <button
          style={btnStyle("#8e44ad")}
          onClick={() => unlockMutation.mutate(user.id)}
          disabled={unlockMutation.isPending}
          aria-label={`Unlock user ${user.username}`}
        >
          Unlock
        </button>
      )}
      <button
        style={btnStyle(copiedToken === user.id ? "#27ae60" : "#1a73e8")}
        onClick={() => handleCopyToken(user.id)}
        disabled={resetMutation.isPending}
        aria-label={`Generate password reset token for ${user.username}`}
      >
        {copiedToken === user.id ? "Copied!" : "Reset Token"}
      </button>
    </td>
  );

  return (
    <AppShell>
      <h1 style={{ marginBottom: "1.5rem" }}>Admin: Users</h1>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <label htmlFor="search-email" style={{ display: "none" }}>
          Search by email
        </label>
        <input
          id="search-email"
          type="email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by email"
          style={{
            flex: 1,
            padding: "0.6rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
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
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch(undefined);
              setSearchInput("");
            }}
            style={{
              padding: "0.6rem 1rem",
              backgroundColor: "#fff",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </form>

      {disablingUserId && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="disable-dialog-title"
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
              width: "24rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <h2 id="disable-dialog-title" style={{ marginTop: 0 }}>
              Disable User
            </h2>
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="disable-reason"
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontWeight: "600",
                }}
              >
                Reason
              </label>
              <textarea
                id="disable-reason"
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => handleDisable(disablingUserId)}
                disabled={disableMutation.isPending || !disableReason.trim()}
                style={btnStyle("#c0392b")}
              >
                {disableMutation.isPending ? "Disabling..." : "Disable"}
              </button>
              <button
                onClick={() => {
                  setDisablingUserId(null);
                  setDisableReason("");
                }}
                style={{
                  padding: "0.35rem 0.7rem",
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

      {isLoading && <p>Loading users...</p>}
      {isError && (
        <p role="alert" style={{ color: "#c0392b" }}>
          Failed to load users.
        </p>
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
                  {["Username", "Email", "Status", "Actions"].map((h) => (
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
                {data.content.map((user, idx) => (
                  <tr
                    key={user.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <td style={{ padding: "0.75rem" }}>{user.username}</td>
                    <td style={{ padding: "0.75rem" }}>{user.email}</td>
                    <td style={{ padding: "0.75rem" }}>{statusBadge(user.status)}</td>
                    {renderActions(user)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

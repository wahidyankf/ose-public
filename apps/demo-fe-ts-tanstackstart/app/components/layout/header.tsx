import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCurrentUser } from "~/lib/queries/use-user";
import { useLogout, useLogoutAll } from "~/lib/queries/use-auth";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const logoutAllMutation = useLogoutAll();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        void navigate({ to: "/login" });
      },
    });
  };

  const handleLogoutAll = () => {
    logoutAllMutation.mutate(undefined, {
      onSettled: () => {
        void navigate({ to: "/login" });
      },
    });
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        height: "3.5rem",
        backgroundColor: "#1a1a2e",
        color: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          aria-label="Toggle navigation menu"
          onClick={onMenuToggle}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "1.5rem",
            padding: "0.25rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          &#9776;
        </button>
        <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>Demo Frontend</span>
      </div>

      <div style={{ position: "relative" }}>
        <button
          aria-label="User menu"
          aria-expanded={userMenuOpen}
          aria-haspopup="true"
          onClick={() => setUserMenuOpen((open) => !open)}
          style={{
            background: "none",
            border: "1px solid #444",
            color: "#ffffff",
            cursor: "pointer",
            padding: "0.4rem 0.8rem",
            borderRadius: "4px",
            fontSize: "0.9rem",
          }}
        >
          {user?.username ?? "Account"} &#9660;
        </button>

        {userMenuOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 0.25rem)",
              backgroundColor: "#ffffff",
              color: "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              minWidth: "12rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 200,
            }}
          >
            <button
              role="menuitem"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem 1rem",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              {logoutMutation.isPending ? "Logging out..." : "Log out"}
            </button>
            <button
              role="menuitem"
              onClick={handleLogoutAll}
              disabled={logoutAllMutation.isPending}
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem 1rem",
                background: "none",
                border: "none",
                borderTop: "1px solid #eee",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              {logoutAllMutation.isPending ? "Logging out..." : "Log out all devices"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

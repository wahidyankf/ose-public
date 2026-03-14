import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "~/components/layout/app-shell";
import { useCurrentUser, useUpdateProfile, useChangePassword, useDeactivateAccount } from "~/lib/queries/use-user";
import { useAuth } from "~/lib/auth/auth-provider";
import { ApiError } from "~/lib/api/client";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.4rem",
  fontWeight: "600",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "1.5rem",
  borderRadius: "8px",
  border: "1px solid #ddd",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  marginBottom: "1.5rem",
};

function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: user, isLoading } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deactivateMutation = useDeactivateAccount();

  const [displayName, setDisplayName] = useState("");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    updateProfileMutation.mutate(
      { displayName },
      {
        onSuccess: () => setProfileSuccess("Profile updated successfully."),
        onError: () => setProfileError("Failed to update profile."),
      },
    );
  };

  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (!oldPassword || !newPassword) {
      setPwError("Both fields are required.");
      return;
    }
    changePasswordMutation.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          setPwSuccess("Password changed successfully.");
          setOldPassword("");
          setNewPassword("");
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 400) {
            setPwError("Current password is incorrect.");
          } else {
            setPwError("Failed to change password.");
          }
        },
      },
    );
  };

  const handleDeactivate = () => {
    deactivateMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        void navigate({ to: "/login" });
      },
      onError: () => {
        setShowDeactivateConfirm(false);
      },
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <p>Loading profile...</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 style={{ marginBottom: "1.5rem" }}>Profile</h1>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Account Information</h2>
        <dl style={{ margin: 0 }}>
          {[
            ["Username", user?.username],
            ["Email", user?.email],
            ["Status", user?.status],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
              <dt style={{ fontWeight: "600", minWidth: "8rem" }}>{label}</dt>
              <dd style={{ margin: 0, color: "#555" }}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Edit Display Name</h2>

        {profileSuccess && (
          <div
            role="status"
            style={{
              backgroundColor: "#eaf7ea",
              color: "#2d7a2d",
              padding: "0.6rem 1rem",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {profileSuccess}
          </div>
        )}
        {profileError && (
          <div
            id="profile-error"
            role="alert"
            style={{
              backgroundColor: "#fdf2f2",
              color: "#c0392b",
              padding: "0.6rem 1rem",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {profileError}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} aria-describedby={profileError ? "profile-error" : undefined}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="displayName" style={labelStyle}>
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            style={{
              padding: "0.6rem 1.25rem",
              backgroundColor: "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: updateProfileMutation.isPending ? "not-allowed" : "pointer",
              fontWeight: "600",
            }}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Change Password</h2>

        {pwSuccess && (
          <div
            role="status"
            style={{
              backgroundColor: "#eaf7ea",
              color: "#2d7a2d",
              padding: "0.6rem 1rem",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {pwSuccess}
          </div>
        )}
        {pwError && (
          <div
            id="pw-error"
            role="alert"
            style={{
              backgroundColor: "#fdf2f2",
              color: "#c0392b",
              padding: "0.6rem 1rem",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {pwError}
          </div>
        )}

        <form onSubmit={handleChangePassword} aria-describedby={pwError ? "pw-error" : undefined}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="oldPassword" style={labelStyle}>
              Current Password
            </label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="newPassword" style={labelStyle}>
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            style={{
              padding: "0.6rem 1.25rem",
              backgroundColor: "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: changePasswordMutation.isPending ? "not-allowed" : "pointer",
              fontWeight: "600",
            }}
          >
            {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#c0392b" }}>Danger Zone</h2>

        {!showDeactivateConfirm ? (
          <button
            onClick={() => setShowDeactivateConfirm(true)}
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
            Deactivate Account
          </button>
        ) : (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deactivate-dialog-title"
            style={{
              backgroundColor: "#fdf2f2",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
              padding: "1rem",
            }}
          >
            <p id="deactivate-dialog-title" style={{ fontWeight: "600", marginTop: 0 }}>
              Are you sure you want to deactivate your account?
            </p>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>
              This action cannot be undone. You will be logged out immediately.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleDeactivate}
                disabled={deactivateMutation.isPending}
                style={{
                  padding: "0.6rem 1.25rem",
                  backgroundColor: "#c0392b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: deactivateMutation.isPending ? "not-allowed" : "pointer",
                  fontWeight: "600",
                }}
              >
                {deactivateMutation.isPending ? "Deactivating..." : "Yes, Deactivate"}
              </button>
              <button
                onClick={() => setShowDeactivateConfirm(false)}
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
          </div>
        )}
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

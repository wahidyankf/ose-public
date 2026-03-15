import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useLogin } from "~/lib/queries/use-auth";
import { useAuth } from "~/lib/auth/auth-provider";
import { ApiError } from "~/lib/api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const loginMutation = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [successMessage] = useState<string | null>(
    searchParams.get("registered") === "true" ? "Registration successful. Please log in." : null,
  );

  useEffect(() => {
    if (isAuthenticated) {
      void navigate("/expenses");
    }
  }, [isAuthenticated, navigate]);

  const validate = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = "Username is required";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    loginMutation.mutate(
      { username, password },
      {
        onSuccess: () => {
          void navigate("/expenses");
        },
      },
    );
  };

  const getErrorMessage = (): string | null => {
    if (!loginMutation.isError) return null;
    const err = loginMutation.error;
    if (err instanceof ApiError) {
      if (err.status === 401) return "Invalid username or password.";
      if (err.status === 403) return "Your account is deactivated or disabled.";
    }
    return "Login failed. Please try again.";
  };

  const errorMessage = getErrorMessage();

  return (
    <main
      style={{
        maxWidth: "28rem",
        margin: "4rem auto",
        padding: "2rem",
      }}
    >
      <h1 style={{ marginBottom: "1.5rem" }}>Log In</h1>

      {successMessage && (
        <div
          role="status"
          style={{
            backgroundColor: "#eaf7ea",
            color: "#2d7a2d",
            padding: "0.75rem 1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
            border: "1px solid #c3e6c3",
          }}
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          id="login-error"
          role="alert"
          style={{
            backgroundColor: "#fdf2f2",
            color: "#c0392b",
            padding: "0.75rem 1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
            border: "1px solid #f5c6cb",
          }}
        >
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={errorMessage ? "login-error" : undefined}
        style={{
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="username"
            style={{
              display: "block",
              marginBottom: "0.4rem",
              fontWeight: "600",
            }}
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            aria-required="true"
            aria-describedby={fieldErrors.username ? "username-error" : undefined}
            aria-invalid={!!fieldErrors.username}
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              border: fieldErrors.username ? "1px solid #c0392b" : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          {fieldErrors.username && (
            <span
              id="username-error"
              role="alert"
              style={{
                color: "#c0392b",
                fontSize: "0.85rem",
                marginTop: "0.25rem",
                display: "block",
              }}
            >
              {fieldErrors.username}
            </span>
          )}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "0.4rem",
              fontWeight: "600",
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-required="true"
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            aria-invalid={!!fieldErrors.password}
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              border: fieldErrors.password ? "1px solid #c0392b" : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          {fieldErrors.password && (
            <span
              id="password-error"
              role="alert"
              style={{
                color: "#c0392b",
                fontSize: "0.85rem",
                marginTop: "0.25rem",
                display: "block",
              }}
            >
              {fieldErrors.password}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#1a73e8",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: loginMutation.isPending ? "not-allowed" : "pointer",
            fontWeight: "600",
          }}
        >
          {loginMutation.isPending ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p style={{ marginTop: "1rem", textAlign: "center", color: "#666" }}>
        Don&apos;t have an account?{" "}
        <Link to="/register" style={{ color: "#1a73e8" }}>
          Register
        </Link>
      </p>
    </main>
  );
}

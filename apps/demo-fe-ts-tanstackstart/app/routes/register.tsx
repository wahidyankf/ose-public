import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRegister } from "~/lib/queries/use-auth";
import { ApiError } from "~/lib/api/client";

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 12) errors.push("At least 12 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push("At least one special character");
  return errors;
}

function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { username?: string; email?: string; password?: string } = {};
    if (!username.trim()) errors.username = "Username is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }
    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      errors.password = "Password must meet the following requirements: " + pwErrors.join(", ");
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    registerMutation.mutate(
      { username, email, password },
      {
        onSuccess: () => {
          void navigate({ to: "/login", search: { registered: "true" } });
        },
      },
    );
  };

  const getErrorMessage = (): string | null => {
    if (!registerMutation.isError) return null;
    const err = registerMutation.error;
    if (err instanceof ApiError) {
      if (err.status === 409) return "Username or email already exists.";
      if (err.status === 400) return "Invalid registration data. Check your inputs.";
    }
    return "Registration failed. Please try again.";
  };

  const errorMessage = getErrorMessage();
  const passwordErrors = password ? validatePassword(password) : [];

  return (
    <main
      style={{
        maxWidth: "28rem",
        margin: "4rem auto",
        padding: "2rem",
      }}
    >
      <h1 style={{ marginBottom: "1.5rem" }}>Create Account</h1>

      {errorMessage && (
        <div
          id="register-error"
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
        aria-describedby={errorMessage ? "register-error" : undefined}
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

        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "0.4rem",
              fontWeight: "600",
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-required="true"
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            aria-invalid={!!fieldErrors.email}
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              border: fieldErrors.email ? "1px solid #c0392b" : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          {fieldErrors.email && (
            <span
              id="email-error"
              role="alert"
              style={{
                color: "#c0392b",
                fontSize: "0.85rem",
                marginTop: "0.25rem",
                display: "block",
              }}
            >
              {fieldErrors.email}
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
            autoComplete="new-password"
            aria-required="true"
            aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
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
          {fieldErrors.password ? (
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
          ) : (
            <span
              id="password-hint"
              style={{
                color: "#666",
                fontSize: "0.85rem",
                marginTop: "0.25rem",
                display: "block",
              }}
            >
              Min 12 chars, 1 uppercase, 1 special character
            </span>
          )}
          {password.length > 0 && passwordErrors.length > 0 && !fieldErrors.password && (
            <ul
              aria-live="polite"
              style={{
                marginTop: "0.5rem",
                paddingLeft: "1.25rem",
                color: "#e67e22",
                fontSize: "0.85rem",
              }}
            >
              {passwordErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#1a73e8",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: registerMutation.isPending ? "not-allowed" : "pointer",
            fontWeight: "600",
          }}
        >
          {registerMutation.isPending ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p style={{ marginTop: "1rem", textAlign: "center", color: "#666" }}>
        Already have an account?{" "}
        <a href="/login" style={{ color: "#1a73e8" }}>
          Log in
        </a>
      </p>
    </main>
  );
}

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

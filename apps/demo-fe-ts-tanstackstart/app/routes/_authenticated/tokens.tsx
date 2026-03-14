import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "~/components/layout/app-shell";
import { useTokenClaims, useJwks } from "~/lib/queries/use-tokens";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "1.5rem",
  borderRadius: "8px",
  border: "1px solid #ddd",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  marginBottom: "1.5rem",
};

function formatTimestamp(ts: unknown): string {
  if (typeof ts !== "number") return "—";
  return new Date(ts * 1000).toLocaleString();
}

function TokensPage() {
  const { data: claims, isLoading: claimsLoading, isError: claimsError } = useTokenClaims();
  const { data: jwks, isLoading: jwksLoading, isError: jwksError } = useJwks();

  return (
    <AppShell>
      <h1 style={{ marginBottom: "1.5rem" }}>Token Inspector</h1>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Access Token Claims</h2>

        {claimsLoading && <p>Decoding token...</p>}
        {claimsError && (
          <p role="alert" style={{ color: "#c0392b" }}>
            Failed to decode token. You may not be logged in.
          </p>
        )}

        {claims && (
          <dl style={{ margin: 0 }}>
            {[
              ["Subject (User ID)", claims["sub"]],
              ["Issuer", claims["iss"]],
              ["Issued At", formatTimestamp(claims["iat"])],
              ["Expires At", formatTimestamp(claims["exp"])],
              ["Roles", Array.isArray(claims["roles"]) ? (claims["roles"] as string[]).join(", ") : "—"],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid #f0f0f0",
                  paddingBottom: "0.75rem",
                }}
              >
                <dt
                  style={{
                    fontWeight: "600",
                    minWidth: "10rem",
                    color: "#555",
                    fontSize: "0.9rem",
                  }}
                >
                  {String(label)}
                </dt>
                <dd
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    fontSize: "0.9rem",
                  }}
                >
                  {String(value ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {claims && (
          <details style={{ marginTop: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: "600", color: "#1a73e8" }}>Raw Claims (JSON)</summary>
            <pre
              style={{
                backgroundColor: "#f8f8f8",
                padding: "1rem",
                borderRadius: "4px",
                fontSize: "0.8rem",
                overflowX: "auto",
                marginTop: "0.75rem",
              }}
            >
              {JSON.stringify(claims, null, 2)}
            </pre>
          </details>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>JWKS Endpoint</h2>

        {jwksLoading && <p>Loading JWKS...</p>}
        {jwksError && (
          <p role="alert" style={{ color: "#c0392b" }}>
            Failed to load JWKS.
          </p>
        )}

        {jwks && (
          <>
            <p style={{ marginTop: 0 }}>
              <strong>Key count:</strong>{" "}
              <span
                style={{
                  backgroundColor: "#1a73e8",
                  color: "#fff",
                  borderRadius: "12px",
                  padding: "0.1rem 0.6rem",
                  fontWeight: "600",
                }}
              >
                {jwks.keys.length}
              </span>
            </p>

            <p style={{ color: "#666", fontSize: "0.9rem" }}>
              JWKS endpoint: <code>/.well-known/jwks.json</code>
            </p>

            <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {jwks.keys.map((key) => (
                <li
                  key={key.kid}
                  style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    padding: "1rem",
                    marginBottom: "0.75rem",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <dl style={{ margin: 0 }}>
                    {[
                      ["Key ID (kid)", key.kid],
                      ["Key Type (kty)", key.kty],
                      ["Use", key.use],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        style={{
                          display: "flex",
                          gap: "1rem",
                          marginBottom: "0.4rem",
                        }}
                      >
                        <dt
                          style={{
                            fontWeight: "600",
                            minWidth: "9rem",
                            color: "#555",
                            fontSize: "0.85rem",
                          }}
                        >
                          {String(label)}
                        </dt>
                        <dd
                          style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: "0.85rem",
                          }}
                        >
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/_authenticated/tokens")({
  component: TokensPage,
});

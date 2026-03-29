"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Card, CardContent, CardHeader } from "@open-sharia-enterprise/ts-ui";
import { Button } from "@open-sharia-enterprise/ts-ui";

const GOOGLE_CLIENT_ID = process.env["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function initializeGoogleSignIn(onSuccess: (credential: string) => void) {
  window.google?.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => onSuccess(response.credential),
  });
  const buttonEl = document.getElementById("google-signin-button");
  if (buttonEl) {
    window.google?.accounts.id.renderButton(buttonEl, {
      type: "standard",
      shape: "rectangular",
      theme: "outline",
      text: "sign_in_with",
      size: "large",
      logo_alignment: "left",
    });
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  useEffect(() => {
    if (!gsiLoaded) return;
    initializeGoogleSignIn(handleGoogleCredential);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gsiLoaded]);

  async function handleGoogleCredential(credential: string) {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Sign in failed. Please try again.");
        return;
      }
      router.push("/profile");
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiLoaded(true)}
      />

      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <h1 className="text-center text-lg leading-none font-semibold tracking-tight">Sign in to OrganicLever</h1>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div role="alert" aria-live="assertive" className="w-full">
              {error && (
                <div className="rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            {isPending ? (
              <Button disabled aria-busy="true" className="w-full">
                Signing in...
              </Button>
            ) : (
              <div id="google-signin-button" aria-label="Sign in with Google" />
            )}

            <p className="text-center text-sm text-muted-foreground">
              Sign in with your Google account to access OrganicLever.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

import { useState, useEffect } from "react";

/**
 * Returns the current URL hash fragment (e.g. "#history").
 * Initial state is '' — window.location.hash is only read inside useEffect
 * so the hook is safe in SSR / Node.js contexts.
 */
export function useHash(): string {
  const [hash, setHash] = useState("");

  useEffect(() => {
    setHash(window.location.hash);
    const handler = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return hash;
}

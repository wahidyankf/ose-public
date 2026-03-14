import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthGuard } from "~/lib/auth/auth-guard";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (width >= 1024) return "desktop";
  if (width >= 640) return "tablet";
  return "mobile";
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const breakpoint = useBreakpoint();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDesktop = breakpoint === "desktop";
  const isTablet = breakpoint === "tablet";

  return (
    <AuthGuard>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Header onMenuToggle={() => setMenuOpen((open) => !open)} />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {(isDesktop || isTablet) && (
            <Sidebar isOpen={true} onClose={() => setMenuOpen(false)} variant={isTablet ? "tablet" : "desktop"} />
          )}
          {!isDesktop && !isTablet && <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} variant="mobile" />}
          <main
            id="main-content"
            style={{
              flex: 1,
              padding: "1.5rem",
              overflowY: "auto",
              backgroundColor: "#f5f7fa",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

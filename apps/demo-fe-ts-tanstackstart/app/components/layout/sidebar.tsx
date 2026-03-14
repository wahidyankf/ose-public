import { Link, useRouterState } from "@tanstack/react-router";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "&#127968;" },
  { href: "/expenses", label: "Expenses", icon: "&#128181;" },
  { href: "/expenses/summary", label: "Summary", icon: "&#128202;" },
  { href: "/admin", label: "Admin", icon: "&#128101;" },
  { href: "/tokens", label: "Tokens", icon: "&#128272;" },
  { href: "/profile", label: "Profile", icon: "&#128100;" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant: "desktop" | "tablet" | "mobile";
}

export function Sidebar({ isOpen, onClose, variant }: SidebarProps) {
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;

  const isTablet = variant === "tablet";
  const isMobile = variant === "mobile";

  if (isMobile && !isOpen) return null;

  return (
    <>
      {isMobile && isOpen && (
        <div
          aria-hidden="true"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 150,
          }}
        />
      )}
      <nav
        aria-label="Main navigation"
        style={{
          position: isMobile ? "fixed" : "relative",
          left: isMobile ? 0 : undefined,
          top: isMobile ? 0 : undefined,
          bottom: isMobile ? 0 : undefined,
          width: isTablet ? "4rem" : "14rem",
          backgroundColor: "#16213e",
          color: "#e0e0e0",
          display: "flex",
          flexDirection: "column",
          paddingTop: isMobile ? "3.5rem" : "1rem",
          zIndex: isMobile ? 160 : undefined,
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: "0.5rem 0",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={isMobile ? onClose : undefined}
                  title={isTablet ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: isTablet ? "0.75rem" : "0.75rem 1rem",
                    justifyContent: isTablet ? "center" : undefined,
                    color: isActive ? "#ffffff" : "#b0b8c8",
                    backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                    textDecoration: "none",
                    borderRadius: "4px",
                    margin: "0 0.25rem",
                    fontWeight: isActive ? "600" : "normal",
                    transition: "background-color 0.15s, color 0.15s",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ fontSize: "1.2rem", flexShrink: 0 }}
                    dangerouslySetInnerHTML={{ __html: item.icon }}
                  />
                  {!isTablet && <span style={{ fontSize: "0.9rem" }}>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

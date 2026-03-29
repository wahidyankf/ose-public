import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@open-sharia-enterprise/ts-ui";
import { TentTree, LayoutDashboard, Users, Settings, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";

export function Navigation({ logout }: { logout: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage if available, otherwise default to false
    /* v8 ignore start -- SSR path: typeof window === "undefined" is unreachable in jsdom */
    if (typeof window !== "undefined") {
      /* v8 ignore stop */
      const saved = localStorage.getItem("sidebarCollapsed");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/members", label: "Team", icon: Users },
    { href: "#", label: "Settings", icon: Settings },
  ];

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  // Update localStorage when isCollapsed changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <>
      {/* Mobile hamburger button */}
      <Button variant="ghost" className="p-2 md:hidden" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Navigation content */}
      <div
        className={`fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col transition duration-200 ease-in-out md:relative md:translate-x-0 ${isCollapsed ? "w-16" : "w-64"} z-10 border-r bg-white`}
      >
        <div className={`flex p-4 ${isCollapsed ? "justify-center" : "justify-between"} items-center`}>
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center">
              <TentTree className="h-6 w-6" />
              <span className="ml-2 text-lg font-bold">Organic Lever</span>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={toggleCollapse}>
            {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </Button>
        </div>
        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mt-2 flex items-center rounded-md p-2 hover:bg-gray-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-4">
          <Button onClick={logout} variant="outline" className={`w-full ${isCollapsed ? "p-2" : ""}`}>
            {isCollapsed ? <Settings className="h-5 w-5" /> : "Logout"}
          </Button>
        </div>
      </div>

      {/* Overlay to close menu on mobile */}
      {isOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-0 bg-black md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}

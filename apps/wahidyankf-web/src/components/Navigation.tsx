import Link from "next/link";
import { File, Folder } from "lucide-react";
import React from "react";
import { usePathname } from "next/navigation";

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/cv", label: "CV" },
    { href: "/personal-projects", label: "Personal Projects" },
  ];

  return (
    <>
      {/* Mobile Navigation */}
      <nav
        data-testid="mobile-nav"
        className="fixed right-0 bottom-0 left-0 z-50 flex justify-around border-t border-green-400 bg-gray-900 p-4 lg:hidden"
      >
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} isActive={pathname === item.href} label={item.label} />
        ))}
      </nav>

      {/* Desktop Navigation */}
      <nav
        data-testid="desktop-nav"
        className="fixed top-0 bottom-0 left-0 z-50 hidden w-80 overflow-y-auto border-r border-green-400 bg-gray-900 p-4 lg:block"
      >
        <Link
          href="/"
          className="light-theme:text-light-primary light-theme:hover:text-light-accent mb-4 block p-4 transition-colors duration-200 hover:text-yellow-400"
        >
          <Folder className="mr-2 inline-block" />
          <span className="font-bold">WahidyanKF</span>
        </Link>
        <hr className="light-theme:border-light-primary mx-4 mb-4 border-t border-green-400" />
        <ul className="pl-4">
          {navItems.map((item) => (
            <NavItem key={item.href} href={item.href} isActive={pathname === item.href} label={item.label} />
          ))}
        </ul>
      </nav>
    </>
  );
};

// Helper components
const NavLink: React.FC<{
  href: string;
  isActive: boolean;
  label: string;
}> = ({ href, isActive, label }) => (
  <Link
    href={href}
    className={`flex flex-col items-center ${
      isActive ? "light-theme:text-light-accent text-yellow-400" : "light-theme:text-light-primary text-green-400"
    } transition-colors duration-200 hover:text-yellow-400`}
  >
    <File className="h-6 w-6" />
    <span className="text-xs">{label}</span>
  </Link>
);

const NavItem: React.FC<{
  href: string;
  isActive: boolean;
  label: string;
}> = ({ href, isActive, label }) => (
  <li className="mb-2">
    <Link
      href={href}
      className={`flex items-center ${
        isActive
          ? "light-theme:text-light-accent active-nav-item text-yellow-400"
          : "light-theme:text-light-primary text-green-400"
      } transition-colors duration-200 hover:text-yellow-400`}
    >
      <File className="mr-2 inline-block" />
      {label}
    </Link>
  </li>
);

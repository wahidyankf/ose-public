"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({
  className = "rounded-full bg-yellow-400 p-2 text-gray-900 transition-colors duration-200 hover:bg-yellow-300",
}: ThemeToggleProps) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    let theme: string | null = null;
    try {
      theme = localStorage.getItem("theme");
    } catch {
      theme = null;
    }
    setIsDark(theme !== "light");
    document.documentElement.classList.toggle("light-theme", theme === "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    try {
      localStorage.setItem("theme", newTheme);
    } catch {
      // Storage can be blocked; the theme still applies for this session.
    }
    document.documentElement.classList.toggle("light-theme");
  };

  return (
    <button
      onClick={toggleTheme}
      className={className}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  );
};

export default ThemeToggle;

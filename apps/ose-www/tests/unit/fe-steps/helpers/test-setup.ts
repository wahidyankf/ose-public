import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn<(...args: unknown[]) => void>(),
    replace: vi.fn<(...args: unknown[]) => void>(),
    prefetch: vi.fn<(...args: unknown[]) => void>(),
  }),
  usePathname: () => "/",
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn<(theme: string) => void>(), resolvedTheme: "light" }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

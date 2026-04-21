import * as React from "react";
import { cn } from "../../utils/cn";

export type IconName =
  | "dumbbell"
  | "check"
  | "check-circle"
  | "clock"
  | "timer"
  | "flame"
  | "trend"
  | "bar-chart"
  | "plus"
  | "plus-circle"
  | "minus"
  | "x"
  | "x-circle"
  | "arrow-left"
  | "arrow-up"
  | "arrow-down"
  | "chevron-right"
  | "chevron-down"
  | "chevron-up"
  | "home"
  | "history"
  | "calendar"
  | "settings"
  | "user"
  | "pencil"
  | "trash"
  | "grip"
  | "play"
  | "zap"
  | "moon"
  | "sun"
  | "rotate-ccw"
  | "more-vertical"
  | "info"
  | "save";

export interface IconProps {
  name: IconName | (string & {});
  size?: number;
  filled?: boolean;
  className?: string;
  "aria-label"?: string;
}

function getIconPaths(name: IconName | (string & {}), filled?: boolean): React.ReactNode {
  switch (name) {
    case "dumbbell":
      return (
        <path d="M6.5 6.5h11M6.5 17.5h11M4 4v16M8 4v16M16 4v16M20 4v16" strokeLinecap="round" strokeLinejoin="round" />
      );
    case "check":
      return <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />;
    case "check-circle":
      return filled ? (
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 14.41-4.7-4.7 1.41-1.42L11 13.59l6.29-6.3 1.42 1.42z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="9 12 11 14 15 10" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "timer":
      return (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 3h6M12 3v2" strokeLinecap="round" />
        </>
      );
    case "flame":
      return filled ? (
        <path d="M12 2C8 6 6 9 8 13c1 2 3 3 4 5 .5-2 1-3 3-5 2-2 2-5 1-7-1 1-2 2-2 4-1-2-2-5-2-8z" />
      ) : (
        <path
          d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072 2.143-.224 4.054 2 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "trend":
      return <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" strokeLinecap="round" strokeLinejoin="round" />;
    case "bar-chart":
      return (
        <>
          <rect x="2" y="14" width="4" height="8" rx="1" />
          <rect x="9" y="9" width="4" height="13" rx="1" />
          <rect x="16" y="4" width="4" height="18" rx="1" />
        </>
      );
    case "plus":
      return (
        <>
          <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
        </>
      );
    case "plus-circle":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" strokeLinecap="round" />
          <line x1="8" y1="12" x2="16" y2="12" strokeLinecap="round" />
        </>
      );
    case "minus":
      return <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />;
    case "x":
      return (
        <>
          <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
          <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
        </>
      );
    case "x-circle":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
          <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
        </>
      );
    case "arrow-left":
      return (
        <>
          <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="12 19 5 12 12 5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "arrow-up":
      return (
        <>
          <line x1="12" y1="19" x2="12" y2="5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="5 12 12 5 19 12" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "arrow-down":
      return (
        <>
          <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="19 12 12 19 5 12" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "chevron-right":
      return <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />;
    case "chevron-down":
      return <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />;
    case "chevron-up":
      return <polyline points="18 15 12 9 6 15" strokeLinecap="round" strokeLinejoin="round" />;
    case "home":
      return (
        <>
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline points="9 21 9 12 15 12 15 21" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "history":
      return (
        <>
          <polyline points="12 8 12 12 14 14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.05 11a9 9 0 1 0 .5-4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="3 3 3 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "calendar":
      return (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
        </>
      );
    case "settings":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </>
      );
    case "user":
      return (
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" />
        </>
      );
    case "pencil":
      return (
        <>
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    case "trash":
      return (
        <>
          <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "grip":
      return (
        <>
          <circle cx="9" cy="6" r="1" fill="currentColor" />
          <circle cx="15" cy="6" r="1" fill="currentColor" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
          <circle cx="9" cy="18" r="1" fill="currentColor" />
          <circle cx="15" cy="18" r="1" fill="currentColor" />
        </>
      );
    case "play":
      return <polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round" />;
    case "zap":
      return <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinecap="round" strokeLinejoin="round" />;
    case "moon":
      return <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />;
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" />
          <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
          <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" />
          <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
        </>
      );
    case "rotate-ccw":
      return (
        <>
          <polyline points="1 4 1 10 7 10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.51 15a9 9 0 1 0 .49-5.66" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "more-vertical":
      return (
        <>
          <circle cx="12" cy="5" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="19" r="1" fill="currentColor" />
        </>
      );
    case "info":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
          <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" />
        </>
      );
    case "save":
      return (
        <>
          <path
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline points="17 21 17 13 7 13 7 21" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="7 3 7 8 15 8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="8" />;
  }
}

export function Icon({ name, size = 24, filled = false, className, "aria-label": ariaLabel }: IconProps) {
  const accessibilityProps = ariaLabel
    ? { role: "img" as const, "aria-label": ariaLabel }
    : { "aria-hidden": true as const };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      className={cn(className)}
      {...accessibilityProps}
    >
      {getIconPaths(name, filled)}
    </svg>
  );
}

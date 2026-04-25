interface LandingNavProps {
  onGoApp: () => void;
}

function LeverIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M7.5 7.5 16.5 16.5" />
      <path d="M4 14h4M16 6h4M14 20h4M6 4h4" />
    </svg>
  );
}

export function LandingNav({ onGoApp }: LandingNavProps) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 40px",
        borderBottom: "1px solid oklch(18% 0.018 60 / 0.08)",
      }}
      className="max-sm:px-6 max-sm:py-5"
    >
      <button
        onClick={onGoApp}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "var(--color-foreground)",
          padding: 0,
        }}
      >
        <div
          className="animate-ol-float"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--hue-teal)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LeverIcon />
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          OrganicLever
        </span>
      </button>

      <span
        className="animate-ol-pulse"
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          padding: "5px 12px",
          borderRadius: 20,
          border: "1px solid oklch(52% 0.13 80 / 0.4)",
          color: "#6b4a00",
          background: "oklch(97% 0.04 80)",
        }}
      >
        ⚗️ Pre-Alpha
      </span>
    </nav>
  );
}

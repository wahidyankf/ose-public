interface LandingFooterProps {
  onGoApp: () => void;
}

export function LandingFooter({ onGoApp }: LandingFooterProps) {
  return (
    <footer
      style={{
        borderTop: "1px solid oklch(18% 0.018 60 / 0.08)",
        padding: "28px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 1200,
        margin: "0 auto",
      }}
      className="max-sm:flex-col max-sm:gap-3 max-sm:px-6 max-sm:py-6 max-sm:text-center"
    >
      <span
        style={{
          fontSize: 13,
          color: "oklch(42% 0.015 70)",
        }}
      >
        © 2026 OrganicLever · Pre-Alpha
      </span>
      <button
        onClick={onGoApp}
        style={{
          color: "var(--hue-teal-ink)",
          textDecoration: "none",
          fontWeight: 600,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
        }}
      >
        Open app →
      </button>
    </footer>
  );
}

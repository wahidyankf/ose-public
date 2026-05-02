interface AddEntryButtonProps {
  onClick: () => void;
}

export function AddEntryButton({ onClick }: AddEntryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add entry"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 24px",
        borderRadius: 12,
        backgroundColor: "#1a7474",
        color: "#ffffff",
        fontFamily: "inherit",
        fontSize: 15,
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
        letterSpacing: "-0.01em",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
        +
      </span>
      Add entry
    </button>
  );
}

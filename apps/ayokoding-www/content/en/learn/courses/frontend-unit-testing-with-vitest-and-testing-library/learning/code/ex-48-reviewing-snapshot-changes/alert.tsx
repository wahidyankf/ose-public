import React from "react";
// => Subject file: the alert box whose variant prop changed this sprint.

type AlertProps = { tone: "info" | "warning"; message: string };
// => Tone union grew from info-only to info-plus-warning: the intentional change.
// => The snapshot below freezes the NEW warning markup after human review.

// => Named export: the reviewed snapshot names this symbol in its header.
export function Alert({ tone, message }: AlertProps): React.JSX.Element {
  // => Named export: the reviewed snapshot names this symbol in its header.
  return (
    // => Alert paragraph: role for announcement, tone for styling, message inside.
    <p role="alert" data-tone={tone}>
      {/* => data-tone exposes the variant for styling: the reviewed addition. */}
      {/* => role alert keeps screen-reader announcement across the redesign. */}
      {/* => Message text: the user-facing copy the snapshot freezes. */}
      {message}
    </p>
  );
}

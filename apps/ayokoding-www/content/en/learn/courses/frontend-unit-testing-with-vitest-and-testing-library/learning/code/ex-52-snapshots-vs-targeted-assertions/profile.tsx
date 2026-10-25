import React from "react";
// => Subject: a profile card with a name, a role, and a decorative wrapper.

type ProfileProps = { name: string; role: string };
// => Two string props: the targeted assertions below pin each one separately.

// => Named export: both test styles below import this same symbol.
export function Profile({ name, role }: ProfileProps): React.JSX.Element {
  // => Named export: both test styles below import this same symbol.
  return (
    // => Article landmark: three styling classes the snapshot freezes.
    <article className="card rounded shadow">
      {/* => Three styling classes: snapshot-fragile, assertion-invisible. */}
      {/* => Name heading: the primary content both styles assert. */}
      <h2>{name}</h2>
      {/* => Name heading: the primary content both styles below assert. */}
      {/* => Role paragraph: secondary content, equally pinned by assertions. */}
      <p className="muted">{role}</p>
      {/* => Role paragraph: secondary content, equally pinned by assertions. */}
    </article>
  );
}

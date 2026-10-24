// => KATA 03 starting point: the snapshot knows everything, asserts nothing.
// => Rename a class, change nothing: the suite goes red with zero signal.
import React from "react";
// => Subject: a user card with a name, a role, and styling hooks.

// => UserCard: avatar initial, name heading, role paragraph, card class.
export function UserCard({ name, role }: { name: string; role: string }): React.JSX.Element {
  // => Props: the two facts the targeted suite will assert directly.
  return (
    <div className="card card--user">
      {/* => Styling hooks: snapshot-fragile, behavior-irrelevant. */}
      <h2>{name}</h2>
      {/* => Name heading: the role query target in the rewrite. */}
      <p>{role}</p>
      {/* => Role paragraph: the text assertion target. */}
    </div>
  );
}

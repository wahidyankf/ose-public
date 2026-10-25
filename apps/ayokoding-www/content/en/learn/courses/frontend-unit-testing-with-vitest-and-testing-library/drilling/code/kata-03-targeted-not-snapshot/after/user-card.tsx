// => KATA 03 target: identical component, behavior-asserted.
// => The component did not change: only what the suite promises changed.
import React from "react";
// => Subject: byte-identical to before, the diff is purely in the test.

// => UserCard: same classes, same nodes, now covered by intent.
export function UserCard({ name, role }: { name: string; role: string }): React.JSX.Element {
  // => Props: name and role, the two user-visible facts.
  return (
    <div className="card card--user">
      {/* => Classes stay: styling is free to evolve without failing tests. */}
      <h2>{name}</h2>
      {/* => Heading: level plus text, the contract this suite pins. */}
      <p>{role}</p>
      {/* => Paragraph: role text, asserted verbatim. */}
    </div>
  );
}

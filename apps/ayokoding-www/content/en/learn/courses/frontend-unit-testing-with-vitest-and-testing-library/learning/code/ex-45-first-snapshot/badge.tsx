import React from "react";
// => Subject file holds only the component: snapshot tests live separately.

type BadgeProps = { count: number };
// => Single numeric prop: the snapshot below pins one rendered instance.

export function Badge({ count }: BadgeProps): React.JSX.Element {
  // => Named export: the test imports this exact symbol, nothing ambient.
  return <span className="badge">{count} new</span>;
  // => One element, one class, interpolated count: small surface, stable snap.
  // => Stable markup snapshots well: no timestamps, no ids, no randomness.
}

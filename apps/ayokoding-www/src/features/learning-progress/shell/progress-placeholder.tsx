/**
 * A neutral block shown inside a fixed-size slot while the progress snapshot is `unknown`
 * (plan 04, tech-docs/004 Shared Rules). It does not pulse, so nothing animates beside a
 * reduced-motion reader. Pure — no IO.
 */
export function ProgressPlaceholder({ className }: { className: string }) {
  return <span aria-hidden="true" className={`inline-block rounded bg-muted ${className}`} />;
}

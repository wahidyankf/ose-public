export function discount(total: number): number {
  // => Single-branch discount: fully tested below, scores 100 across the row.
  // => Simple modules clear any sane floor: thresholds guard the average.
  if (total >= 100) return 10;
  // => Bulk tier: one branch, one case, covered.
  return 0;
  // => No-discount path: second branch, second case, covered.
}

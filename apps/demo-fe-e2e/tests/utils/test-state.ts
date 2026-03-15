/**
 * Shared mutable state for cross-step communication within a test run.
 * Safe because tests run sequentially (workers: 1).
 */
export const testState = {
  bobExpenseId: undefined as string | undefined,
};

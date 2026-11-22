import { vi } from "vitest";

// Hermetic doubles for unit tests (Test and Gate Contract C21). The clock and the
// id sequence are fixed here, so no unit test reads the real clock or randomness.

/** The instant every unit test reads as "now". */
export const FIXED_INSTANT = "2026-05-01T12:00:00.000Z";
export const FIXED_MS = Date.parse(FIXED_INSTANT);

/** Freezes the `Date` clock at `atMs`. Only `Date` is faked; timers keep running for real. */
export function freezeClock(atMs: number = FIXED_MS): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(atMs);
}

/** Moves the frozen clock to `atMs`. */
export function setClock(atMs: number): void {
  vi.setSystemTime(atMs);
}

/** Restores the real clock after `freezeClock`. */
export function restoreClock(): void {
  vi.useRealTimers();
}

let idSequence = 0;

/** Deterministic UUID-shaped ids, unique across calls in one test file. */
export function nextFixtureId(): string {
  idSequence += 1;
  return `00000000-0000-4000-8000-${String(idSequence).padStart(12, "0")}`;
}

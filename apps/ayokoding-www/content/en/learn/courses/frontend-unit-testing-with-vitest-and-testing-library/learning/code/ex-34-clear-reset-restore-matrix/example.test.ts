import { expect, test, vi } from "vitest";
// => vi namespace for the whole matrix: three depths, one recorder.

test("clear, reset, and restore erase progressively more", async () => {
  // => One case walks all three depths in order: each builds on the last.
  const double = vi.fn((x: number) => x * 2);
  // => Recorder WITH implementation: doubling answers from the start.
  double(21);
  // => One call recorded: 42 answered, log holds a single entry.
  expect(double).toHaveBeenCalledTimes(1);
  // => Baseline count pinned before any erasing begins.
  double.mockClear();
  // => mockClear empties the call log ONLY: implementation survives.
  // => Cheapest reset: use between cases that share one scripted double.
  expect(double).not.toHaveBeenCalled();
  // => Log empty: the next assertion would fail if any call survived.
  expect(double(21)).toBe(42);
  // => Implementation intact: clear never touches scripted answers.
  double.mockImplementation((x) => x + 100);
  // => Override installed: the next call answers 101, not 2, by script.
  expect(double(1)).toBe(101);
  // => Override proved active: reset below has something to remove.
  double.mockReset();
  // => mockReset clears calls AND drops scripted overrides entirely.
  // => Deeper reset: the constructor implementation survives, overrides do not.
  expect(double).not.toHaveBeenCalled();
  // => Log empty again: reset clears the record like clear does.
  expect(double(1)).toBe(2);
  // => Override gone, constructor back: reset removed exactly the script.
  // => This line is the matrix in miniature: clear kept it, reset dropped it.
  double.mockRestore();
  // => mockRestore on a bare fn keeps the mock: originals return for spies only.
  // => For spyOn doubles restore resurrects the wrapped method (Example 29).
  expect(double).not.toHaveBeenCalled();
  // => Log empty once more: the matrix ends where clear began, provably.
});

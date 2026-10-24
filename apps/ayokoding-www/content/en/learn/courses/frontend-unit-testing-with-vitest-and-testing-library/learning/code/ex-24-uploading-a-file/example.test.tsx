// @vitest-environment jsdom
// => DOM pragma: file inputs live in the document like any other control.

import { afterEach, expect, test } from "vitest";
// => Runner trio steady: uploads are events plus assertions, nothing exotic.

import { cleanup, render, screen } from "@testing-library/react";
// => The file input has no role query; label query reaches it accessibly.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent asserts the file summary the component renders.

import React, { useState } from "react";
// => useState holds the chosen file: upload is state like typing is state.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.
// => upload() sets files and fires change: the full selection pipeline.

// => Isolation hook: unmount plus restores guard every upload case.
afterEach(() => {
  cleanup();
  // => Isolation hook: chosen files must not survive into the next case.
  // => Hook closes: chosen files and stubs reset between cases.
});

// => Subject: picks a CSV and reports its name and byte size.
function CsvPicker(): React.JSX.Element {
  // => Local subject: picks a CSV and reports its name and byte size.
  // => Placeholder text: the test asserts this changes after upload.
  const [summary, setSummary] = useState("No file chosen");
  // => Placeholder text: the test asserts this changes after upload.
  return (
    <div>
      <label>
        Upload CSV
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            // => onChange reads e.target.files: the browser's selection list.
            // => First selected file: the handler reads the browser's selection list.
            const file = e.target.files?.[0];
            // => Optional chaining: no selection means no file, handled below.
            // => Empty selection guard: no file means nothing to report, exit early.
            if (file === undefined) return;
            // => Early return keeps the empty-selection path explicit and safe.
            setSummary(`${file.name} (${file.size} bytes)`);
            // => Name plus size: the observable contract the test will assert.
          }}
        />
      </label>
      <p>{summary}</p>
      {/* => Summary paragraph mirrors state: upload proof users can read. */}
    </div>
  );
}

test("uploading a CSV shows its name and size", async () => {
  // => Case name states the observable outcome: name and size rendered.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => delay null removes inter-keystroke pauses: fast and deterministic.
  // => Real timers stay on here: no waiting happens, only event dispatch.
  // => Mount the picker: placeholder text is the starting assertion.
  render(<CsvPicker />);
  // => Mount the picker: placeholder text is the starting assertion.
  const input = screen.getByLabelText("Upload CSV");
  // => Label query reaches the file input: file inputs deserve labels too.
  const file = new File(["a,b\n1,2\n"], "orders.csv", { type: "text/csv" });
  // => In-memory File: real name, real bytes, zero disk, zero network.
  // => Content array plus name plus MIME type: a faithful fixture upload.
  await user.upload(input, file);
  // => upload() selects the file and fires change: the handler reads it.
  // => Arrays upload several files at once; one file suffices for the proof.
  expect(screen.getByText("orders.csv (8 bytes)")).toBeInTheDocument();
  // => Name and byte size rendered: the handler read the File object fully.
  // => Byte count pins the fixture: editing content must update this line.
  // => Case closes: name and size rendered, handler proved with real bytes.
});

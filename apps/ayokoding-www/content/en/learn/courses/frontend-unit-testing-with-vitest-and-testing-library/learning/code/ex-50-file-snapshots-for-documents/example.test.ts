import { expect, test } from "vitest";
// => Runner imports only: document generation is pure string building.

type Receipt = { items: string[]; total: number };
// => Receipt shape: item lines plus a total, the document's whole content.

function renderReceipt(receipt: Receipt): string {
  // => Pure renderer: data in, multi-line document out, no IO anywhere.
  // => Email and receipt bodies deserve freezing: users read every line.
  const lines = receipt.items.map((item, index) => `${index + 1}. ${item}`);
  // => Numbered lines: index plus one, human counting starts at one.
  return [...lines, `Total: $${receipt.total}`, "Thank you for shopping!"].join("\n");
  // => Lines plus total plus sign-off joined: the complete document text.
  // => Join with real newlines: the file snapshot below preserves them.
}

test("receipt document matches the committed file", async () => {
  // => Document claim: all three lines frozen byte for byte in a file.
  const document = renderReceipt({ items: ["Rice", "Oil"], total: 30 });
  // => Fixed fixture: the snapshot pins THIS receipt's exact rendering.
  await expect(document).toMatchFileSnapshot("./receipt.txt");
  // => File snapshot writes receipt.txt beside the test on first run.
  // => Committed thereafter: CI compares, never regenerates, deterministically.
  // => Async matcher: file IO is promised, so the expectation awaits.
  expect(document).toContain("Total: $30");
  // => Targeted twin: the total is important enough to assert twice.
});

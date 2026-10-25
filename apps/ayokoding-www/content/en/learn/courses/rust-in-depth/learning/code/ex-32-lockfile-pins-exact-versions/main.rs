// Example 32: Lockfile Pins Exact Versions.
// => `Cargo.lock` is the resolved answer: one exact version per package.
// => Committed locks make every checkout build the same tree, everywhere.
// => The excerpt below is fixed text, so the pin table never changes.
// => Each `[[package]]` block names one package plus its chosen version.
const LOCK: &str = "[[package]]\nname = \"dues-ledger\"\nversion = \"0.2.0\"\n\n[[package]]\nname = \"ledger-kit\"\nversion = \"1.4.0\"\n\n[[package]]\nname = \"audit-trail\"\nversion = \"0.9.1\"\n"; // => three pinned packages
                                                                                                                                                                                                        // => `pins` walks the blocks and collects each name with its version.
fn pins(text: &str) -> Vec<(String, String)> {
    // => sorted by the caller
    let mut out = Vec::new(); // => the collected pins
    let mut name = String::new(); // => the current block's name
    for line in text.lines() {
        // => one pass over the lock lines
        if let Some((key, raw)) = line.split_once('=') {
            // => only key lines matter
            let value = raw.trim().trim_matches('"').to_string(); // => bare value
            if key.trim() == "name" {
                // => a new block starts here
                name = value; // => remember it for the version line
            } else if key.trim() == "version" && !name.is_empty() {
                // => the block's pin
                out.push((name.clone(), value)); // => one pin recorded
            }
        }
    }
    out.sort(); // => alphabetical: audit-trail, dues-ledger, ledger-kit
    out // => the sorted pin table
}
fn main() {
    // => the three pins print in sorted order, identical on every run.
    // => Sorting pins the transcript: hash maps never promise an order.
    for (name, version) in pins(LOCK) {
        // => the sorted table drives the print
        println!("{} {}", name, version); // => audit-trail 0.9.1, then the rest
    }
}

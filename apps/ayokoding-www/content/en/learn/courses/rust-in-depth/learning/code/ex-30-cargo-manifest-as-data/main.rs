// Example 30: Cargo Manifest as Data.
// => `Cargo.toml` is the package identity: name, version, edition.
// => Reading it as data teaches the fields without running a build.
// => The manifest below is fixed text, so every extraction is fixed too.
// => Real manifests carry dependencies; this identity-only one has none.
const MANIFEST: &str =
    "[package]\nname = \"dues-ledger\"\nversion = \"0.2.0\"\nedition = \"2021\"\n"; // => the whole manifest as text
                                                                                    // => `value_of` finds `key = "value"` lines and returns the bare value.
fn value_of(text: &str, key: &str) -> Option<String> {
    // => `None` when absent
    for line in text.lines() {
        // => one pass over the manifest lines
        // => header lines like `[package]` carry no `=`: skip, do not bail.
        let Some((name, raw)) = line.split_once('=') else {
            continue;
        }; // => split on the first equals
        if name.trim() == key {
            // => the wanted key, whitespace-tolerant
            return Some(raw.trim().trim_matches('"').to_string()); // => strip quotes
        }
    }
    None // => the key never appeared: callers decide what that means
}
fn main() {
    // => the three identity fields every manifest carries, extracted in order.
    println!("name: {}", value_of(MANIFEST, "name").unwrap()); // => Output: name: dues-ledger
    println!("version: {}", value_of(MANIFEST, "version").unwrap()); // => Output: version: 0.2.0
    println!("edition: {}", value_of(MANIFEST, "edition").unwrap()); // => Output: edition: 2021
    println!("missing: {:?}", value_of(MANIFEST, "license")); // => Output: missing: None
}

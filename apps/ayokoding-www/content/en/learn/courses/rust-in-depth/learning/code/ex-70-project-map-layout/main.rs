// Example 70: Project Map, Where Everything Lives.
// => `Cargo.toml` at the root: identity, dependencies, and pins.
// => `src/main.rs` the binary: the thin wiring around the library.
// => `src/lib.rs` the library: the testable logic cargo tests own.
// => `tests/` the edge checks: integration tests use only the public API.
// => The map below is fixed text: it teaches the shape without touching disk.
// => Every path below is canonical: cargo creates exactly this layout.
const LAYOUT: &[&str] = &[
    // => the five load-bearing paths, in build order
    "Cargo.toml",      // => first: the manifest the build reads before anything
    "Cargo.lock",      // => second: the pins every checkout resolves identically
    "src/main.rs",     // => third: thin wiring, reads input, prints the report
    "src/lib.rs",      // => fourth: the logic `cargo test` owns and pins
    "tests/settle.rs", // => fifth: edge checks through the public API only
];
fn main() {
    // => the map prints in build order: manifest first, edge tests last.
    for (i, path) in LAYOUT.iter().enumerate() {
        // => numbered for reference
        println!("{}: {}", i + 1, path); // => five fixed lines, always
    }
}

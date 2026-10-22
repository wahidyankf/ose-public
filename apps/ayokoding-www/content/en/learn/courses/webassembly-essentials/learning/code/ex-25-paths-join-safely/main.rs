// Example 25: Paths Join Without Strings.
//
// Joining paths with format! invites separator bugs; PathBuf::push and
// Path::join own the separators, and components(), extension(), and
// file_stem() read paths back apart without a single manual split.
// => push/join own the separators: no hand-written '/' ever appears
// => extension and file_stem parse names: split('.') misreads dotfiles

use std::path::{Path, PathBuf};

fn main() {
    // => start from the unit folder: every path below stays relative
    let mut report: PathBuf = Path::new("learning").join("code");
    // => push appends one segment: the separator is the platform's own
    report.push("ex-25-paths-join-safely");
    report.push("main.rs");
    // => Debug shows the assembled guest path with its real separators
    println!("joined: {report:?}");
    // => extension reads the type: "rs" without the dot, Some-wrapped
    println!("extension: {:?}", report.extension());
    // => file_stem reads the name: "main" without the extension
    println!("stem: {:?}", report.file_stem());
    // => components walk the segments: each prints quoted, in order
    for part in report.components() {
        println!("part: {part:?}");
    }
    // => with_extension swaps the type: the sibling golden-layout path
    let golden = report.with_extension("wasm");
    // => the stem survives the swap: only the extension changed hands
    println!("sibling: {golden:?}");
}

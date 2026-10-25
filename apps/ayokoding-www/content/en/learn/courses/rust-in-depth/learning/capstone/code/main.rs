// Capstone: zakat-ledger CLI, thin wiring over the tested ledger logic.
// => Reads `input.txt`, settles every valid due, skips the rest honestly.
// => Reads `Cargo.toml` for the pin line: zero dependencies, declared.
// => Prints the fixed eight-line transcript the harness asserts byte for byte.
// => Missing input exits nonzero with stderr: silence never means success.
// => The harness runs with cwd here: both fixtures sit beside the binary.
mod ledger; // => the tested logic: parse, summarize, manifest
use std::fs; // => whole-file reads for both fixtures
             // => `read_pair` loads one fixture file or reports the loud boundary failure.
fn read_pair(name: &str) -> String {
    // => fixture text or a nonzero exit
    fs::read_to_string(name).unwrap_or_else(|_| {
        // => missing fixture is fatal
        eprintln!("missing fixture: {}", name); // => stderr: operators read this
        std::process::exit(1); // => nonzero: silence never means success
    })
}
fn main() {
    // => both fixtures load first: the ledger lines and the manifest identity.
    let body = read_pair("input.txt"); // => eight fixed lines, three malformed
    let manifest = read_pair("Cargo.toml"); // => identity-only: zero dependencies
                                            // => the pin line proves the manifest read ran: name plus version.
    let name = ledger::manifest_value(&manifest, "name").unwrap_or_else(|| "unknown".to_string()); // => zakat-ledger
    let version =
        ledger::manifest_value(&manifest, "version").unwrap_or_else(|| "0.0.0".to_string()); // => 0.2.0
    println!("package: {} {}", name, version); // => Output: package: zakat-ledger 0.2.0
                                               // => parse every line: valid pairs settle, malformed lines count as skipped.
    let mut pairs = Vec::new(); // => the valid dues in file order
    let mut skipped = 0; // => the honest count of rejected lines
    let mut lines = 0; // => every line counts, valid or not
    for line in body.lines() {
        // => one pass over the eight fixture lines
        if line.trim().is_empty() {
            // => trailing newline is not a ninth due
            continue; // => skip the ghost line the final newline implies
        }
        lines += 1; // => a real line: counted before the verdict
        match ledger::parse_line(line) {
            // => the tested parser decides
            Ok(pair) => pairs.push(pair), // => valid dues accumulate
            Err(_) => skipped += 1,       // => malformed lines count, never crash
        }
    }
    // => the summary folds the valid pairs: sorted lines plus the grand total.
    let (settled, grand) = ledger::summarize(&pairs); // => tested grouping
    println!(
        "lines: {} kept: {} skipped: {}",
        lines,
        pairs.len(),
        skipped
    ); // => Output: lines: 8 kept: 5 skipped: 3
    for (member, total) in settled {
        // => alphabetical: budi, citra, sari
        println!("{}: {}", member, total); // => budi: 100, citra: 25, sari: 60
    }
    println!("grand: {}", grand); // => Output: grand: 185
}

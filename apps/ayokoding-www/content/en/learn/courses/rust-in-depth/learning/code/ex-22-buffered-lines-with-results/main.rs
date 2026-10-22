// Example 22: Buffered Lines with Results.
// => `BufReader` streams lines without loading the whole file at once.
// => `lines()` yields one `Result` per line: I/O failure stays per-line.
// => Temp fixture, fixed content, content-only output: deterministic again.
use std::fs::File; // => opens the fixture for streaming
use std::io::{BufRead, BufReader, Write}; // => lines, buffering, and writing
use std::path::PathBuf; // => portable temp path join
fn main() {
    // => fixed fixture: two dues and one broken line, same bytes every run.
    let mut path = PathBuf::from(std::env::temp_dir()); // => OS temp directory
    path.push("rust-in-depth-ex22.txt"); // => fixed scratch name
                                         // => write the three lines now so the stream below has something to read.
    let mut out = File::create(&path).expect("temp dir is writable"); // => fresh fixture
    writeln!(out, "sari:50").expect("fixture line writes"); // => valid due one
    writeln!(out, "oops").expect("fixture line writes"); // => broken line
    writeln!(out, "budi:75").expect("fixture line writes"); // => valid due two
    drop(out); // => close the writer before the reader opens the path
               // => stream the fixture: each line parses on arrival, nothing held whole.
    let file = File::open(&path).expect("just-written fixture opens"); // => read it back
    let mut total = 0; // => sums only the valid dues
    let mut broken = 0; // => counts lines the grammar rejects
    for line in BufReader::new(file).lines() {
        // => one `Result` per line
        let text = line.expect("fixture lines read cleanly"); // => I/O is trusted here
        match text.split_once(':') {
            // => the same line grammar as before
            Some((_, raw)) => match raw.trim().parse::<i32>() {
                // => value stage
                Ok(amount) => total += amount, // => valid dues join the total
                Err(_) => broken += 1,         // => bad amount: counted, not fatal
            },
            None => broken += 1, // => no colon: counted, not fatal
        }
    }
    // => fixed figures: 50 + 75 totals 125 with exactly one broken line.
    println!("total: {}", total); // => Output: total: 125
    println!("broken: {}", broken); // => Output: broken: 1
                                    // => remove the fixture: the run leaves nothing behind.
    std::fs::remove_file(&path).expect("scratch file removes cleanly"); // => tidy temp dir
}

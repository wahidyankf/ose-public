// Example 6: HashMap Counts with Entry.
//
// Counting with a map has one hazard: the first sighting has no entry
// yet. The entry API turns "insert or update" into one lookup, so the
// miss path and the hit path share a single line instead of two.
// => entry() finds the slot once: no double lookup, no clone of the key
// => or_insert hands back a mutable count the caller bumps in place

// A HashMap iterates in hash order, which varies run to run, so this
// example always sorts its keys before printing: sorted output is the
// price of deterministic transcripts. See learning/code/README.md.
// => sorting before printing keeps every golden file byte-identical
// => the rule applies to every map in this course, without exception
use std::collections::HashMap;

fn main() {
    // => fixed words: the counts below are hand-checkable constants
    let words = ["wasm", "fast", "wasm", "sandboxed", "fast", "wasm"];
    // => the counter starts empty: every word is first seen as a miss
    let mut counts: HashMap<&str, u32> = HashMap::new();
    for word in words {
        // => entry finds-or-creates the slot, then bumps it in place
        *counts.entry(word).or_insert(0) += 1;
    }
    // => collect and sort: iteration order is never printed raw
    let mut ranked: Vec<(&str, u32)> = counts.into_iter().collect();
    ranked.sort();
    // => one line per word: the counts are fixed by the input above
    for (word, count) in ranked {
        println!("{word}: {count}");
    }
}

// Example 72: Word Frequency Counter.
//
// Read this like a reviewer: the pipeline has three stages (split, count,
// rank), each a pure function of the last, and main wires them in order.
// The counter borrows the text, the ranker owns the sorted table, and the
// only HashMap in the file is sorted before anything prints (see Ex.6).
// => stages are pure: tokenize borrows, count consumes words, rank sorts
// => ties break alphabetically: the ranking is total, never arbitrary

use std::collections::HashMap;

// => HashMap tallies: each word maps to its sighting count

// tokenize splits text into lowercase words, dropping empty runs.
// => to_lowercase first: "Wasm" and "wasm" count as one word below
// => split on non-letters: punctuation never becomes a word of its own
fn tokenize(text: &str) -> Vec<String> {
    // => owned words leave: lowercase copies outlive the borrowed text
    text.to_lowercase()
        // => lowercase owns: the chain works on a fresh String from here
        .split(|c: char| !c.is_alphabetic())
        // => letters keep, rest splits: digits never form words here
        .filter(|word| !word.is_empty())
        // => empties drop: consecutive separators leave no ghost words
        .map(String::from)
        // => from borrows to owned: each surviving word becomes a String
        .collect()
}

// count tallies each word once per sighting through the entry API.
// => &str keys borrow the owned words: the table outlives the count call
// => entry().or_insert(0) plus one: the counting idiom, exactly as taught
fn count(words: &[String]) -> HashMap<&str, u32> {
    // => keys borrow the words: the table lives only as long as they do
    let mut tallies: HashMap<&str, u32> = HashMap::new();
    // => empty to start: the first sighting inserts, the rest increment
    for word in words {
        *tallies.entry(word.as_str()).or_insert(0) += 1;
    }
    // => the full table returns: main ranks a sorted copy below
    tallies
}

// rank sorts by count descending, breaking ties alphabetically ascending.
// => sort_by with a two-key comparison: count first, word second, total
// => take(limit) caps the table: the transcript shows the head, never all
fn rank<'a>(tallies: &'a HashMap<&'a str, u32>, limit: usize) -> Vec<(&'a str, u32)> {
    let mut table: Vec<(&'a str, u32)> = tallies
        .iter()
        .map(|(word, count)| (*word, *count))
        .collect();
    // => descending count, ascending word: every tie has a fixed winner
    table.sort_by(|left, right| right.1.cmp(&left.1).then(left.0.cmp(right.0)));
    table.into_iter().take(limit).collect()
}

fn main() {
    // => three lines print: wasm 3, fast and sandbox tie at 2, alphabetized
    // => the fixed paragraph: wasm leads with 3, fast and sandbox tie at 2
    let text = "wasm runs fast and wasm runs anywhere; fast, sandboxed wasm";
    // => the pipeline wires the three stages: tokenize, count, rank top 3
    let words = tokenize(text);
    let tallies = count(&words);
    // => the ranking prints count-first: ties break toward the alphabet
    for (word, tally) in rank(&tallies, 3) {
        println!("{word}: {tally}");
    }
}

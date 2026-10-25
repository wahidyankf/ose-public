// Example 19: Split and Join Text.
//
// Lines, words, and comma fields are all "split on a boundary, handle
// each piece, join with a glue": lines() strips endings for free,
// split_whitespace collapses runs of space, and join rebuilds one string.
// => lines() never keeps the '\n': no trim step follows a line split
// => split_whitespace ignores leading space: hand loops over-split

fn main() {
    // => fixed roster text: two lines, comma fields, ragged spacing
    let roster = "sari, 91, pass\nbudi, 77, pass";
    // => lines() yields each row without its newline: no trim needed
    for line in roster.lines() {
        // => split(',') cuts fields; trim clears the space after each comma
        let fields: Vec<&str> = line.split(',').map(str::trim).collect();
        // => Debug shows the cleaned fields: three per line, no stray space
        println!("fields: {fields:?}");
    }
    // => a ragged sentence: double spaces and tabs hide between words
    let sentence = "wasm  runs\tanywhere fast";
    // => split_whitespace collapses every run: four words, no empties
    let words: Vec<&str> = sentence.split_whitespace().collect();
    println!("words: {words:?}");
    // => join rebuilds one string with a single-space glue between words
    println!("joined: {}", words.join(" "));
    // => replace swaps a token everywhere: one call, no loop, no regex
    println!("renamed: {}", sentence.replace("wasm", "Wasm"));
}

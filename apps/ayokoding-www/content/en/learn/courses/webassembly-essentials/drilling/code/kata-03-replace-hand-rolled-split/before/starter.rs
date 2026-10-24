// Kata 3 starter: a hand-rolled word splitter.
//
// The loop below walks characters, builds words by hand, and almost works:
// it drops the last word when the line does not end with a space. Your
// task: replace the whole loop with split_whitespace, which never forgets
// the tail, collapses runs, and skips leading space without a single index.
// => the missing tail is the bug: "fast" never reaches the words below
// => stdlib split replaces 15 lines: the after half proves it in three
fn words(line: &str) -> Vec<String> {
    // => the hand-rolled buffer: characters accumulate until a space lands
    let mut found: Vec<String> = Vec::new();
    let mut current = String::new();
    for c in line.chars() {
        // => spaces flush the buffer: the word ends, a new one may begin
        if c == ' ' {
            // => non-empty buffers push: runs of spaces push nothing twice
            if !current.is_empty() {
                found.push(current.clone());
                current.clear();
            }
            continue;
        }
        // => tabs slip through unhandled: the splitter only knows spaces
        current.push(c);
    }
    // => the tail is never flushed: the last word dies in the buffer here
    found
}

fn main() {
    // => "fast" vanishes below: the missing flush eats the final word
    println!("{:?}", words("wasm  runs fast"));
}

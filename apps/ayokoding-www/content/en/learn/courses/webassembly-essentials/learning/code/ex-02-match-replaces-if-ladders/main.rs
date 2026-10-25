// Example 2: Match Replaces If Ladders.
//
// A tagless if-else ladder repeats the variable and hides the order;
// match lists each range once, top-down, and the compiler proves every
// case is covered, so a new variant breaks the build instead of the run.
// => exhaustiveness is checked at compile time, not discovered in tests
// => each arm reads as one rule: pattern on the left, outcome on the right

// grade turns a score into its letter, narrowest band first.
// => u8 pins the input to 0..=255: out-of-range scores cannot exist
// => match on ranges keeps the boundary order visible in one place
fn grade(score: u8) -> char {
    // => arms are tried top-down; the first matching range wins
    match score {
        // => 90 and above is the narrowest, most selective band
        90..=100 => 'A',
        // => each band below widens toward the failing tail
        80..=89 => 'B',
        70..=79 => 'C',
        60..=69 => 'D',
        // => the catch-all arm closes the ladder: no score is ungraded
        _ => 'F',
    }
}

fn main() {
    // => a fixed table drives every band, including both edges of each
    let scores = [95u8, 90, 89, 80, 79, 70, 69, 60, 59, 0];
    // => iterate by value: u8 is Copy, so no borrow bookkeeping intrudes
    for score in scores {
        // => one line per score keeps the band table readable as output
        println!("{score} -> {}", grade(score));
    }
}

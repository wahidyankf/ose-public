// Kata 5 solution: each failure gets its own enum variant.
//
// LoadError names the three cases the starter merged into one String:
// NoSeparator carries the row, BadDigits carries the digits, OutOfRange
// carries the value. Display renders each for humans, and callers match
// cases instead of substrings, so new stages add variants, not edits.
// => one variant per cause: the compiler lists what can go wrong, in full
// => Display is the human face: each variant renders its own sentence

use std::fmt;

// => fmt hosts Display: the human face of every refusal

// LoadError names the three ways loading one row can fail, separately.
// => NoSeparator carries the row: the message can quote the shapeless text
// => BadDigits carries the digits: the message can quote the bad number
// => OutOfRange carries the value: the message can quote the outlier
#[derive(Debug)]
enum LoadError {
    // => three variants, three causes: separator, digits, range
    NoSeparator(String),
    // => String carries the row: owned evidence for the message
    BadDigits(String),
    // => String carries the digits: owned evidence again
    OutOfRange(u32),
    // => u32 carries the value: Copy, no allocation needed
}

// Display turns each variant into the sentence its row deserves to show.
// => match every variant: a fourth cause would force a fourth message
impl fmt::Display for LoadError {
    // => Display serves humans: main prints {reason} through it
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // => &self borrows: rendering a refusal must not consume it
        match self {
            // => self is the case: each arm renders one failure story
            // => quotes the row: the author sees which line broke shape
            LoadError::NoSeparator(row) => write!(f, "{row:?} has no '='"),
            // => quotes the digits: the author sees which value misparsed
            LoadError::BadDigits(digits) => write!(f, "{digits:?} is not a score"),
            // => quotes the value: the author sees which score overflowed
            LoadError::OutOfRange(score) => write!(f, "{score} is outside 0..=100"),
        }
    }
}

// load returns the typed error: callers match variants, never substrings.
// => let-else opens the split: the row refuses with its own variant
// => map_err converts the parse: the digits refuse with theirs instead
fn load(row: &str) -> Result<(String, u32), LoadError> {
    // => owned pair leaves: the name copies out, the score parses out
    // => the split carries the row into NoSeparator: the case is named
    let Some((name, digits)) = row.split_once('=') else {
        return Err(LoadError::NoSeparator(row.to_string()));
    };
    // => the parse carries the digits into BadDigits: a different case
    let score = digits
        .parse::<u32>()
        .map_err(|_| LoadError::BadDigits(digits.to_string()))?;
    // => the range carries the value into OutOfRange: the third case
    if score > 100 {
        return Err(LoadError::OutOfRange(score));
    }
    Ok((name.to_string(), score))
    // => to_string owns the name: the pair outlives the borrowed row
}

fn main() {
    // => the same three rows: one loads, two refuse with named cases
    for row in ["sari=91", "budi=many", "citra=104"] {
        // => Debug on Ok shows the pair: Display on Err shows the sentence
        match load(row) {
            Ok(pair) => println!("{row:?} -> {pair:?}"),
            Err(reason) => println!("{row:?} -> error: {reason}"),
        }
    }
}

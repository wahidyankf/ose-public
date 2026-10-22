// Example 17: Error Trait Objects Erase Types.
//
// One helper serving three fallible stages meets three error types; an
// enum would couple every stage to one definition. Box<dyn Error> erases
// the concrete type at the seam, so each stage keeps its own error while
// the helper returns a single shape with ? doing the conversion.
// => dyn Error is one pointer to any error: heterogeneity without enums
// => the 'static bound says the error owns its data: no borrowed causes

use std::error::Error;

// => Error is the trait: boxes of dyn Error erase any failure type

// parse_year and parse_score fail differently on purpose: one misses its
// digits, the other misses its range, and neither knows about the other.
// => parse_year leans on the std ParseIntError through the trait object
// => parse_score refuses outliers with a domain message of its own
fn parse_year(text: &str) -> Result<u32, Box<dyn Error>> {
    // => boxed errors leave: each stage's failure fits the same shape
    // => ? converts ParseIntError into the box automatically via From
    let year = text.parse::<u32>()?;
    // => the range guard is domain policy: years start at 2000 here
    if year < 2000 {
        // => a string converts into Box<dyn Error> just as well
        return Err(format!("year {year} predates the records").into());
    }
    Ok(year)
}

// parse_score refuses out-of-range scores with a plain domain message.
// => a second, unrelated error source behind the same boxed shape
// => callers below cannot tell the two failures apart by type: by text
fn parse_score(text: &str) -> Result<u32, Box<dyn Error>> {
    // => digits first: a non-number exits through the parse error inside
    let score = text.parse::<u32>()?;
    // => range second: an outlier exits through the domain message
    if score > 100 {
        return Err(format!("score {score} is outside 0..=100").into());
    }
    Ok(score)
}

fn main() {
    // => three records: the years fail two ways, the score fails once
    // => tuple iteration keeps both halves together: no index tracks pairs
    for (year_text, score_text) in [("19xx", "91"), ("1999", "91"), ("2024", "104")] {
        // => the year parses first: its refusal reports and skips the score
        let year = match parse_year(year_text) {
            Ok(year) => year,
            // => Display on the box prints the concrete reason it hides
            Err(reason) => {
                println!("{year_text}/{score_text}: refused: {reason}");
                continue;
            }
        };
        // => the score parses second: only years that passed reach this match
        // => staging keeps the transcript ordered: year refusals precede score ones
        match parse_score(score_text) {
            // => reachable only when both stages of the record succeed
            Ok(score) => println!("{year}: score {score}"),
            // => Display on the box prints the concrete reason it hides
            Err(reason) => println!("{year_text}/{score_text}: refused: {reason}"),
        }
    }
}

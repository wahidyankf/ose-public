// Example 12: Map Err Adds Context.
//
// A bare parse error says "invalid digit" but never says which field or
// which line; map_err wraps each fallible step with the context its caller
// needs, so the final message reads as the path the input traveled.
// => convert at the boundary: low-level errors become domain messages
// => each layer adds what it knows: field name here, line number there

// load_scores parses "name=score" lines, naming the line that breaks.
// => enumerate pairs each line with its human (1-based) line number
// => map_err on parse carries the line number into the final message
fn load_scores(text: &str) -> Result<Vec<(&str, u32)>, String> {
    // => the roster starts empty: parsed pairs accumulate in order
    let mut roster = Vec::new();
    // => Vec preserves file order: the transcript reads top-down
    for (index, line) in text.lines().enumerate() {
        // => split_once divides "name=score": None means the '=' is missing
        let Some((name, score_text)) = line.split_once('=') else {
            // => let-else diverges: shapeless rows exit here with their number
            // => the message names the line number and shows the bad line
            return Err(format!("line {}: {line:?} has no '='", index + 1));
        };
        // => parse with context: the message names the line and the field
        // => Turbofish pins u32: inference cannot guess the target type
        let score = score_text
            .parse::<u32>()
            .map_err(|_| format!("line {}: score {score_text:?} is not a number", index + 1))?;
        // => only fully validated pairs reach the roster, in file order
        // => push happens after both checks: no partial row ever lands
        roster.push((name, score));
    }
    // => the full roster returns: main prints it per fixture below
    Ok(roster)
}

fn main() {
    // => three rosters: one clean, two broken at different stages
    // => the fixed array covers the seam, the digits, and the digits shape
    let rosters = [
        "sari=91\nbudi=77",
        "sari=91\nbudi:many",
        "sari=91\nbudi=many",
    ];
    // => one match per roster: Ok prints pairs, Err prints the context
    // => the loop reuses one match: all three rosters share the verdict
    for roster in rosters {
        // => the array iterates by value: &str rosters copy, nothing borrows
        // => Debug shows the parsed pairs: names with their scores
        match load_scores(roster) {
            Ok(pairs) => println!("parsed: {pairs:?}"),
            // => the message always names the failing line and the cause
            Err(reason) => println!("refused: {reason}"),
        }
    }
}

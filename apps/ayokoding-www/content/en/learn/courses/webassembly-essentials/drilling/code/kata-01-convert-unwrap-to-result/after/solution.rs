// Kata 1 solution: every failure is a matched Result.
//
// The unwrap calls are gone: split_once and parse each return their
// failure as data, and main prints refusals for the broken row while the
// clean rows grade exactly as before. Exit stays 0 on every input.
// => let-else opens the split: shapeless rows refuse with their text
// => map_err converts the parse failure: the row rides into the message

// grade renders the letter for a validated score, like Example 2.
// => the grader never sees a bad value: validation happens before it
fn grade(score: u32) -> char {
    // => u32 in, char out: the signature is the whole contract
    // => the band table reads top-down: the first matching arm wins
    match score {
        // => ranges partition the scale: every parsed score lands in one arm
        90..=100 => 'A',
        80..=89 => 'B',
        70..=79 => 'C',
        60..=69 => 'D',
        // => the catch-all closes the ladder: every score grades something
        _ => 'F',
    }
}

// grade_row grades one "name=digits" row or refuses it with its context.
// => Result carries both exits: the letter, or the row's own refusal
// => let-else and ? replace both unwraps: no trap survives in this file
fn grade_row(row: &str) -> Result<String, String> {
    // => &str in, owned out: letters and refusals both outlive the row
    // => the split refuses shapeless rows: the row quotes itself
    let Some((name, digits)) = row.split_once('=') else {
        // => let-else diverges: shapeless rows exit here with their text
        return Err(format!("{row:?} has no '='"));
    };
    // => the parse refuses digit soup: the digits quote themselves too
    let score = digits
        .parse::<u32>()
        .map_err(|_| format!("{digits:?} is not a score"))?;
    // => only validated scores reach the grader: the letter is always honest
    Ok(format!("{name} -> {}", grade(score)))
    // => name plus letter: the graded line reads as cause and effect
}

fn main() {
    // => the same three rows as the starter: two grade, one refuses now
    for row in ["sari=91", "budi=77", "citra=many"] {
        // => one match serves every row: letters print, refusals explain
        match grade_row(row) {
            Ok(line) => println!("{line}"),
            // => the refusal names the row: "many" is data, not a trap
            Err(reason) => println!("refused: {reason}"),
        }
    }
}

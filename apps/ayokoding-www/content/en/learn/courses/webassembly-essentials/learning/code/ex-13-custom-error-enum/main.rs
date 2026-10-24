// Example 13: Custom Error Enums Carry Cases.
//
// String errors describe one failure; an enum names every failure the
// module can produce, so callers match cases instead of parsing text.
// Display renders each variant for humans; the Error trait plugs the enum
// into every ? chain and Box<dyn Error> boundary in the ecosystem.
// => one variant per failure cause: the compiler lists what can go wrong
// => Display is the human face; the enum itself is the machine contract

use std::fmt;

// => fmt is the Display home: the trait and the formatter live here

// GradeError names the two ways grading one score can fail.
// => two variants, two causes: missing input versus a bad value
// => Debug derives for free: Display below is written by hand, on purpose
#[derive(Debug)]
enum GradeError {
    // => the enum never leaves this file: grade returns it, main matches it
    // => no score was supplied at all: the input row was empty
    Missing,
    // => a score arrived but lies outside 0..=100: out of grading range
    OutOfRange(u8),
}

// Display turns each variant into the sentence a user should read.
// => match every variant: adding a case forces a message for it too
// => write! to the formatter: no allocation beyond the final String
impl fmt::Display for GradeError {
    // => Display serves one audience: the human reading the transcript
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // => &self borrows: rendering a refusal must not consume it
        match self {
            // => self is the case: each arm renders one failure story
            // => Missing explains itself: nothing to grade was given
            GradeError::Missing => write!(f, "no score supplied"),
            // => OutOfRange echoes the bad value so the caller can find it
            GradeError::OutOfRange(score) => write!(f, "score {score} is outside 0..=100"),
        }
    }
}

// Error has no required methods here: the impl is the plug itself.
// => this one line admits GradeError into ? chains and boxed errors
// => Debug + Display above already satisfy the trait's only bounds
impl std::error::Error for GradeError {}

// grade refuses missing and out-of-range scores with a typed refusal.
// => Option input models rows where the score column may be absent
// => the error type is GradeError: callers match cases, never substrings
fn grade(score: Option<u8>) -> Result<char, GradeError> {
    // => None maps to the Missing case: absence is a named failure
    let score = score.ok_or(GradeError::Missing)?;
    // => the range guard maps outliers to their carrying variant
    if score > 100 {
        return Err(GradeError::OutOfRange(score));
    }
    // => validated input grades exactly like Example 2's table
    Ok(match score {
        90..=100 => 'A',
        80..=89 => 'B',
        70..=79 => 'C',
        60..=69 => 'D',
        _ => 'F',
    })
}

fn main() {
    // => main exercises every case: one input per variant plus the pass
    // => three inputs: missing, out of range, and a clean pass
    for score in [None, Some(104), Some(85)] {
        // => Debug on the input shows which case each line exercises
        match grade(score) {
            // => the letter prints: grading succeeded for this input
            Ok(letter) => println!("{score:?} -> {letter}"),
            // => Display renders the case: the human message, not the variant
            Err(reason) => println!("{score:?} -> error: {reason}"),
        }
    }
}

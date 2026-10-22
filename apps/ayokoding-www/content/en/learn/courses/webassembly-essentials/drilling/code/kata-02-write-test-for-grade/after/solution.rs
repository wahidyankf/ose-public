// Kata 2 solution: the table test pins every edge, then the rule is fixed.
//
// The suite below failed on 89 before the fix (B expected, C produced)
// and passes after widening the arm to 80..=89. The red transcript is the
// proof the test works; the green transcript below is the committed state.
// => the table covers all five bands: each edge appears twice, like Ex.37
// => the fix widens one arm: 80..=89 restores 89 to B, matching the table

// letter grades scores with the corrected band: 80..=89 is B again.
// => the table below pins the edge: 89 must grade B, 90 must grade A
fn letter(score: u8) -> char {
    // => u8 in, char out: the signature is the whole contract
    // => the corrected arm: 80 through 89, both edges inclusive
    match score {
        // => ranges partition 0..=255: every input lands in exactly one arm
        90..=100 => 'A',
        // => inclusive top: 100 earns A, 89 starts B
        80..=89 => 'B',
        // => the fixed arm: 89 grades B again after the widening
        70..=79 => 'C',
        // => the C band: untouched by the fix, pinned anyway
        60..=69 => 'D',
        // => the D band: the table guards every edge, not just the bug
        // => the catch-all closes the ladder: 59 and below are F
        _ => 'F',
        // => the catch-all closes the ladder: 59 and below are F
    }
}

// => cfg(test) holds the table that caught the bug: ten rows, five bands
#[cfg(test)]
// => cfg(test) compiles the suite only under test: the binary stays lean
mod tests {
    // => the table lives here: rows beside the rule they pin
    // => super::* imports letter: the table tests one function, nothing else
    use super::*;

    // => every band edge appears twice: the top of one band, the next below
    #[test]
    fn grades_every_band_edge() {
        // => one test, ten rows: the loop multiplies coverage, not functions
        // => (input, expected) rows: the 89 row failed before the fix
        let cases = [
            // => u8 suffix once: the first row pins the type for the rest
            (100u8, 'A'),
            // => the ceiling: 100 is the highest gradable score
            (90, 'A'),
            // => the A floor: 90 passes, 89 does not
            (89, 'B'),
            // => the regression row: this one failed before the fix
            (80, 'B'),
            // => the B floor: the widened arm starts here
            (79, 'C'),
            // => the C ceiling: the pattern repeats per band, deliberately
            (70, 'C'),
            // => the C floor: symmetry the reader can verify at a glance
            (69, 'D'),
            // => the D ceiling: one wrong point costs a full band
            (60, 'D'),
            // => the D floor: the last passing score of all
            (59, 'F'),
            // => the F ceiling: just below the lowest pass
            (0, 'F'),
            // => the floor: zero is the lowest input the type allows
        ];
        // => one loop serves all ten rows: the logic never repeats per case
        for (score, expected) in cases {
            // => destructuring binds both: input and verdict per turn
            // => the assertion quotes the row: failures name their own input
            assert_eq!(
                letter(score),
                expected,
                "score {score} should grade {expected}"
            );
        }
    }
}

fn main() {
    // => the demo samples the fix: 89 prints B now
    // => the binary samples the bands: 89 prints B now, the bug is gone
    for score in [95u8, 89, 75, 65, 55] {
        // => 89 rides second: the fixed edge shows in the demo too
        println!("{score} -> {}", letter(score));
    }
}

// Example 37: Table Tests List Cases.
//
// One test per case multiplies boilerplate; a table of (input, expected)
// pairs with a single loop covers a dozen cases in a dozen lines. Adding
// a case means adding a row, and a failing row names its own input in the
// assertion message, so the table is its own regression documentation.
// => rows are data: the test logic is written once, above the table
// => assert with the row inline: failures quote the exact failing input

// letter grades scores exactly like Examples 2, 13, and 31 teach.
// => the table below pins every band edge: each boundary appears twice
// => one definition again: the rule lives once, the table checks it fully
fn letter(score: u8) -> char {
    // => u8 in, char out: the signature is the whole contract
    match score {
        // => ranges partition 0..=255: every input lands in exactly one arm
        90..=100 => 'A',
        // => inclusive ranges: 90 belongs to A, 89 to B, exactly
        80..=89 => 'B',
        70..=79 => 'C',
        60..=69 => 'D',
        _ => 'F',
        // => the catch-all closes the scale: below 60 is F, no exceptions
    }
}

// => cfg(test) holds the table: ten rows pin the five bands and edges
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
        // => (input, expected) rows: adding a case means adding one row
        let cases = [
            // => u8 suffix once: the first row pins the type for the rest
            (100u8, 'A'),
            // => the ceiling: 100 is the highest gradable score
            (90, 'A'),
            // => the A floor: 90 passes, 89 does not
            (89, 'B'),
            // => the B ceiling: one point below the A floor
            (80, 'B'),
            // => the B floor mirrors the A shape, ten points down
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
    // => the demo samples mid-band: 95, 85, 75, 65, 55
    // => the binary samples the same bands the table pins exhaustively
    for score in [95u8, 85, 75, 65, 55] {
        // => mid-band samples: the demo shows centers, the table shows edges
        println!("{score} -> {}", letter(score));
    }
}

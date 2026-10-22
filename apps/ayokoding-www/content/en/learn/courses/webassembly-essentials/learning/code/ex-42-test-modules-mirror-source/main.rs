// Example 42: Test Modules Mirror Source.
//
// Big suites organize like source: one test submodule per behavior group,
// each with focused tests, so failures point at the group before the line.
// The suite below mirrors a tiny catalog crate: parsing tests live with
// parsing, grading tests live with grading, and main stays a thin demo.
// => test submodules group by behavior: parse_tests, grade_tests
// => each group imports only its unit: failures localize to the group

// catalog pairs parsing and grading the way Examples 12 and 2 teach.
// => two public functions: the submodules below test one each
// => main stays thin: the binary demos, the suite verifies, never mixed
mod catalog {
    // => one module, two stages: parsing feeds grading, in order
    // => parse_score parses digits or refuses: Example 20's decimal arm
    pub fn parse_score(text: &str) -> Result<u32, String> {
        // => owned refusal: the message outlives the borrowed text
        text.parse::<u32>()
            .map_err(|_| format!("{text:?} is not a score"))
        // => map_err only touches Err: clean digits pass through untouched
    }

    // => letter grades a validated score: Example 2's band table again
    pub fn letter(score: u32) -> char {
        // => u32 in: callers parse first, grading trusts the digits
        match score {
            // => ranges partition the scale: every score lands in one band
            90..=100 => 'A',
            // => inclusive top: 100 earns A, 89 starts B
            80..=89 => 'B',
            70..=79 => 'C',
            60..=69 => 'D',
            _ => 'F',
            // => the catch-all closes the scale: below 60 is F
        }
    }
}

// => cfg(test) holds two behavior groups: parsing and grading apart
#[cfg(test)]
// => cfg(test) gates the suite: the binary ships without tests
mod tests {
    // => one group per behavior: parse_tests and grade_tests, apart
    // => parse_tests imports only parsing: grading failures cannot land here
    mod parse_tests {
        // => braces nest the group: parsing tests live together here
        // => super::super reaches catalog past the tests module boundary
        use super::super::catalog::parse_score;
        // => two levels up: past tests, into catalog, for one name

        // => the happy path: digits parse to their value, typed u32
        #[test]
        fn parses_digits() {
            // => the happy path first: digits parse to their value
            assert_eq!(parse_score("91"), Ok(91));
            // => Ok(91) pins both: the value and the success shape
        }

        // => the refusal: letters never parse, and the suite pins that
        #[test]
        fn refuses_letters() {
            // => the refusal second: letters never become scores
            assert!(parse_score("9x").is_err());
            // => the verdict is the shape: any refusal message satisfies
        }
    }

    // => grade_tests imports only grading: parsing failures cannot land here
    mod grade_tests {
        // => the sibling group: grading tests cannot see parsing names
        // => the sibling import reaches catalog's letter through tests
        use super::super::catalog::letter;
        // => one import, one unit: letter only, never parse_score

        // => the band edges: each boundary grades its higher band's letter
        #[test]
        fn grades_band_edges() {
            // => two asserts, one edge: 90 and 89 straddle the A/B line
            // => 90 is A, 89 is B: the edge belongs to the band above
            assert_eq!(letter(90), 'A');
            // => 90 belongs above: the edge grades its higher band
            assert_eq!(letter(89), 'B');
            // => 89 belongs below: one point down, one band down
        }

        // => the floor: zero is the lowest gradable score, still an F
        #[test]
        fn zero_is_f() {
            // => the floor case: zero grades, but never passes
            assert_eq!(letter(0), 'F');
        }
    }
}

fn main() {
    // => one input through both stages: parse 91, grade 91, print B
    // => the binary wires both stages: parse, then grade, then print
    match catalog::parse_score("91") {
        // => the full pipeline in main: the demo wires both stages
        Ok(score) => println!("91 -> {}", catalog::letter(score)),
        Err(reason) => println!("refused: {reason}"),
    }
}

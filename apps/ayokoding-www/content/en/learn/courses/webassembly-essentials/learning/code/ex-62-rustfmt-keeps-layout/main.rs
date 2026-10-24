// Example 62: rustfmt Keeps Layout.
//
// rustfmt owns the layout: four spaces, 100-column lines, trailing commas
// in multi-line calls. Code that looks formatted but is not fails the
// --check gate in CI; the checker below encodes the two cheapest layout
// rules over an embedded sample (tabs and overlong lines) and prints each
// violation with its line number, exactly the shape fmt --check reports.
// => the sample is data: the checker never reads its own source file
// => tabs and width are the rules: the rest of rustfmt needs the real tool

// SAMPLE holds two clean lines and two violations, fixed for the transcript.
// => line 3 uses a tab: rustfmt demands four spaces, never a tab stop
// => line 4 runs past 100 columns: rustfmt would wrap the call arguments
const SAMPLE: &str = "fn add(left: i32, right: i32) -> i32 {\n    left + right\n\t// tabbed comment: rustfmt replaces the tab with four spaces\n    call_with_many_arguments(first_argument, second_argument, third_argument, fourth_argument5, fifth_argument6)\n}";

// check_layout reports tab and width violations with 1-based line numbers.
// => lines() plus enumerate: each violation names its own line, precisely
// => chars().count() measures in characters: width is about reading, not bytes
fn check_layout(sample: &str) -> Vec<String> {
    // => findings start empty: clean samples report the all-clear below
    let mut findings: Vec<String> = Vec::new();
    for (index, line) in sample.lines().enumerate() {
        // => rule one: a tab anywhere is a layout violation, column noted
        if line.contains('\t') {
            findings.push(format!(
                "line {}: tab indentation, use four spaces",
                index + 1
            ));
        }
        // => rule two: over 100 characters is a wrap candidate, width noted
        if line.chars().count() > 100 {
            findings.push(format!(
                "line {}: {} chars, wrap past 100",
                index + 1,
                line.chars().count()
            ));
        }
    }
    findings
}

fn main() {
    // => the fixed sample carries exactly two violations: tab and width
    let findings = check_layout(SAMPLE);
    // => each finding prints on its own line: the fmt --check shape, in text
    for finding in &findings {
        println!("{finding}");
    }
    // => two findings is the pinned count: the sample never changes
    println!("{} layout findings", findings.len());
}

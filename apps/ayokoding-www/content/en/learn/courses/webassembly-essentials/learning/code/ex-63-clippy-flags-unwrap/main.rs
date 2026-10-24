// Example 63: Clippy Flags Unwrap.
//
// Clippy reads intent, not just syntax: unwrap on a Result in library code
// means "I decided this cannot fail", which deserves a comment or a match.
// The checker below scans an embedded sample for bare .unwrap() calls and
// prints each with its line number, the shape of the warning the real lint
// would raise over the same lines.
// => the sample is data: three unwraps hide among two handled Results
// => the scan is textual: ends_with on the trimmed line, lint-style

// SAMPLE mixes two handled Results with three bare unwraps, fixed in place.
// => line 1 unwraps a parse: the lint asks "what if the digits are bad?"
// => line 6 unwraps a file read: the lint asks "what if the mount moved?"
// => line 8 unwraps a config port: the lint asks "what if it is missing?"
const SAMPLE: &str = "let score = text.parse::<u32>().unwrap();\nmatch text.parse::<u32>() {\n    Ok(score) => score,\n    Err(_) => 0,\n}\nlet data = std::fs::read_to_string(path).unwrap();\nlet name = maybe_name.unwrap_or(\"anon\");\nlet port = config.port.unwrap();";

// check_unwraps reports every line whose call chain ends in .unwrap().
// => ends_with on the trimmed line: mid-chain unwraps are out of scope
// => unwrap_or and unwrap_or_else pass: defaults are handled, not trapped
fn check_unwraps(sample: &str) -> Vec<String> {
    // => findings start empty: only bare unwraps earn a report below
    let mut findings: Vec<String> = Vec::new();
    for (index, line) in sample.lines().enumerate() {
        // => trim first: indentation must not hide the call under review
        let code = line.trim();
        // => bare unwrap ends the chain: unwrap_or variants end differently
        if code.ends_with(".unwrap();") || code.ends_with(".unwrap()") {
            findings.push(format!(
                "line {}: bare unwrap, handle the Err arm",
                index + 1
            ));
        }
    }
    findings
}

fn main() {
    // => the fixed sample hides three bare unwraps among handled code
    let findings = check_unwraps(SAMPLE);
    // => each finding prints on its own line: the clippy shape, in text
    for finding in &findings {
        println!("{finding}");
    }
    // => three findings is the pinned count: the sample never changes
    println!("{} unwrap findings", findings.len());
}

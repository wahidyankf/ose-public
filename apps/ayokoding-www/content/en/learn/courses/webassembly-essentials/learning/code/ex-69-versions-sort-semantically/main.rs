// Example 69: Versions Sort Semantically.
//
// "1.10.0" sorts after "1.9.0" semantically but before it lexically, so
// version code parses into (major, minor, patch) numbers and compares
// numerically. The sorter below parses a fixed registry list, drops the
// shapeless entries with their line numbers, and prints the rest newest
// first: the shape of every "which version is latest" answer in tooling.
// => parse-then-compare: strings never meet the ordering directly
// => shapeless entries report and drop: one bad row never poisons the list

// parse_version splits "1.2.3" into its three numeric parts or refuses.
// => exactly three dot-separated parts: anything else is shapeless here
// => each part parses as u32: letters and blanks fail before comparing
fn parse_version(text: &str) -> Option<(u32, u32, u32)> {
    // => tuple, not struct: Example 34's Version would work too
    // => split on dots: more or fewer than three parts means malformed
    let parts: Vec<&str> = text.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    // => parse each part in order: the first failure rejects the version
    let major = parts[0].parse::<u32>().ok()?;
    // => .ok()? converts: parse failure becomes suite-wide None
    let minor = parts[1].parse::<u32>().ok()?;
    let patch = parts[2].parse::<u32>().ok()?;
    Some((major, minor, patch))
    // => the triple is the sort key: text rides along for printing
}

fn main() {
    // => the fixed registry mixes clean versions with two shapeless rows
    let registry = [
        "1.9.0", "1.10.0", "2.0.0", "latest", "1.2.3", "1.2", "0.9.9",
    ];
    // => parsed pairs the version with its numbers: sort keys ride along
    let mut parsed: Vec<((u32, u32, u32), &str)> = Vec::new();
    // => numbers first: the sort below compares .0, never the text
    for text in registry {
        // => the array iterates by value: &str is Copy, nothing borrows
        // => shapeless rows report with their text: the list keeps going
        match parse_version(text) {
            Some(numbers) => parsed.push((numbers, text)),
            None => println!("skipped shapeless row: {text:?}"),
        }
    }
    // => sort by numbers, newest first: lexical order would wrongly rank 1.9
    parsed.sort_by(|left, right| right.0.cmp(&left.0));
    // => right-before-left compares: descending order, newest first
    // => the ranked list prints: 2.0.0 leads, 0.9.9 anchors, both numeric
    for (_, text) in parsed {
        println!("version: {text}");
    }
}

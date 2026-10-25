// Capstone: zakat-ledger domain logic, tested before it ever prints.
// => `parse_line` validates one line: colon splits, trim cleans, parse decides.
// => Empty members and non-positive amounts are data errors, counted not kept.
// => `summarize` folds valid pairs into per-member totals plus a grand total.
// => Sorting by member name pins the report order: maps never promise order.
// => `manifest_value` reads Cargo.toml identity: name and version for the pin line.
// => Every fact below is fixed: the eight-line fixture decides all verdicts.
use std::collections::HashMap; // => member-to-total accumulation
                               // => `parse_line` returns the member and amount or the reason it cannot.
pub fn parse_line(line: &str) -> Result<(String, i32), String> {
    // => owned pair out
    let (member, raw) = line // => borrow the line; halves borrow it too
        .split_once(':') // => `None` when the colon is missing entirely
        .ok_or_else(|| format!("no colon: {}", line))?; // => first malformed shape
    let member = member.trim(); // => padding never names a member
    if member.is_empty() {
        // => the second malformed shape: no name at all
        return Err(format!("empty member: {}", line)); // => counted, not kept
    }
    let amount = raw // => the text after the colon
        .trim() // => noise off before the value decision
        .parse::<i32>() // => the stdlib parse underneath
        .map_err(|_| format!("bad amount: {}", line))?; // => third malformed shape
    if amount <= 0 {
        // => the domain rule: dues stay strictly positive
        return Err(format!("refused non-positive: {}", line)); // => counted, not kept
    }
    Ok((member.to_string(), amount)) // => a validated, owned pair
}
// => `summarize` folds parsed pairs into sorted per-member lines plus totals.
pub fn summarize(pairs: &[(String, i32)]) -> (Vec<(String, i32)>, i32) {
    // => lines plus grand
    let mut totals: HashMap<&str, i32> = HashMap::new(); // => member to sum
    for (member, amount) in pairs {
        // => each valid pair updates one slot
        *totals.entry(member.as_str()).or_insert(0) += amount; // => one lookup per pair
    }
    let mut lines: Vec<(String, i32)> = totals // => owned lines for the report
        .into_iter() // => consume the map: no second pass needed
        .map(|(member, total)| (member.to_string(), total)) // => own every name
        .collect(); // => one line per member
    lines.sort(); // => alphabetical: budi, citra, sari, every run
    let grand: i32 = lines.iter().map(|(_, total)| total).sum(); // => the grand total
    (lines, grand) // => both answers travel together
}
// => `manifest_value` extracts one `key = "value"` line from manifest text.
pub fn manifest_value(text: &str, key: &str) -> Option<String> {
    // => `None` when absent
    for line in text.lines() {
        // => one pass over the manifest lines
        // => header lines like `[package]` carry no `=`: skip, do not bail.
        let Some((name, raw)) = line.split_once('=') else {
            continue;
        }; // => key lines only
        if name.trim() == key {
            // => the wanted key, whitespace-tolerant
            return Some(raw.trim().trim_matches('"').to_string()); // => bare value
        }
    }
    None // => the key never appeared: callers decide what that means
}
#[cfg(test)] // => test-only from here down: ships no test code
mod tests {
    // => the suite: parsing, summarizing, and manifest facts
    use super::*; // => the three functions are all in scope
    #[test] // => the valid line parses to its member and amount
            // => "sari:50" is the canonical good line: member sari, amount 50.
    fn parses_valid_line() {
        // => the happy-path fact
        assert_eq!(parse_line("sari:50"), Ok(("sari".to_string(), 50))); // => hand-checked
    }
    #[test] // => all three malformed shapes fail with their own messages
    fn rejects_malformed_shapes() {
        // => the three skip facts
        assert!(parse_line("oops-no-colon").is_err()); // => missing colon
        assert!(parse_line(":40").is_err()); // => empty member
        assert!(parse_line("sari:xyz").is_err()); // => bad amount
    }
    #[test] // => the summary groups, sorts, and totals the fixed pairs
            // => Sari pays twice: grouping folds both dues into one 60 line.
    fn summarizes_fixed_pairs() {
        // => the arithmetic fact
        let pairs = vec![
            ("sari".to_string(), 50),
            ("budi".to_string(), 75),
            ("sari".to_string(), 10),
        ]; // => sari twice
        let (lines, grand) = summarize(&pairs); // => the function under test
                                                // => Alphabetical: budi's 75 precedes sari's grouped 60.
        assert_eq!(
            lines,
            vec![("budi".to_string(), 75), ("sari".to_string(), 60)]
        ); // => sorted, grouped
        assert_eq!(grand, 135); // => 75 + 60 by hand
    }
    #[test] // => the manifest reader finds name and version in fixed text
    fn reads_manifest_identity() {
        // => the pin-line fact
        let text = "[package]\nname = \"zakat-ledger\"\nversion = \"0.2.0\"\n"; // => tiny manifest
        assert_eq!(
            manifest_value(text, "name"),
            Some("zakat-ledger".to_string())
        ); // => the package name
        assert_eq!(manifest_value(text, "version"), Some("0.2.0".to_string())); // => the pinned version
    }
}

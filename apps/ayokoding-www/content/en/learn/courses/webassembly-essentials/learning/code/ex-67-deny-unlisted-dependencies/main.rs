// Example 67: Deny Unlisted Dependencies.
//
// An allow-list names the crates a project trusts; anything locked but
// unlisted fails the audit gate, the cargo-deny shape. The checker below
// reads an embedded lock fragment and an embedded allow-list, then prints
// every locked crate the list does not name, with the version that would
// need a review before it ships.
// => the lists are data: two small tables the lesson fixes in place
// => unlisted means unreviewed: the finding names crate and version

// LOCK names three locked crates at their pinned versions, fixed in place.
// => itoa and ryu are the project's text workhorses: listed below
// => smallvec is transitive ballast here: nobody listed it, see the finding
const LOCK: &str = "itoa 1.0.15\nryu 1.0.20\nsmallvec 1.11.0\n";

// ALLOW names the two crates the project reviewed and trusts, fixed too.
// => allow-lists name crates, never versions: versions float, trust does not
// => the missing smallvec is the lesson: transitive is still shipped code
const ALLOW: &str = "itoa\nryu\n";

// check_allowlist reports locked crates the allow-list never names.
// => split_whitespace reads both tables: names first, versions ride along
// => the finding quotes name and version: review starts from the exact pin
fn check_allowlist(lock: &str, allow: &str) -> Vec<String> {
    // => the allowed set collects first: membership checks stay O(1)
    let allowed: Vec<&str> = allow.split_whitespace().collect();
    // => findings start empty: fully listed graphs report the all-clear
    let mut findings: Vec<String> = Vec::new();
    for line in lock.lines() {
        // => each lock line pairs a name with its version: two fields exactly
        let mut parts = line.split_whitespace();
        match (parts.next(), parts.next()) {
            // => listed crates pass silently: trust was recorded already
            (Some(name), Some(_)) if allowed.contains(&name) => {}
            // => unlisted crates report: name plus version, ready for review
            (Some(name), Some(version)) => {
                findings.push(format!("{name} {version} is locked but not allow-listed"));
            }
            // => shapeless lines report as data errors: the lock is corrupt
            _ => findings.push(format!("bad lock line: {line:?}")),
        }
    }
    findings
}

fn main() {
    // => the fixed tables hide exactly one unlisted crate: smallvec 1.11.0
    let findings = check_allowlist(LOCK, ALLOW);
    // => each finding prints: the crate and version awaiting review
    for finding in &findings {
        println!("{finding}");
    }
    // => one finding is the pinned count: the tables never change
    println!("{} audit findings", findings.len());
}

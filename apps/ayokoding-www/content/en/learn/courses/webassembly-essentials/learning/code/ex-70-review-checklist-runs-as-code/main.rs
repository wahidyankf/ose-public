// Example 70: Review Checklist Runs as Code.
//
// The course's review rules (no tabs, no bare unwrap, snake_case names,
// docs with verbs, no traps) compress into one checker: the before sample
// below breaks four of the five, the after sample breaks none, and the
// transcript proves the delta. Run the checklist on every unit before it
// ships; the lesson for this cluster is that the list itself is a program.
// => five rules, two samples: before earns four findings, after earns none
// => one function per rule: each rule stays as small as its lesson example

// BEFORE breaks four rules on purpose: tab, unwrap, CamelCase, trap.
// => the tab opens line 2: rustfmt would demand four spaces (see Ex.62)
// => the unwrap ends line 3: clippy would ask for the Err arm (see Ex.63)
// => GradeScore breaks snake_case: the lint wants grade_score (see Ex.64)
// => panic! ends line 5: shipped traps fail the audit (see Ex.65)
const BEFORE: &str = "fn GradeScore(text: &str) -> u32 {\n\tlet score = text.parse::<u32>().unwrap();\n    score\n}\nfn unreachable_arm() {\n    panic!(\"all scores grade A to F\");\n}";

// AFTER keeps the behavior and breaks no rule: doc, spaces, match, snake, Result.
// => the /// line documents: the doc rule passes silently here
// => four spaces open line 3: the layout rule passes silently
// => match handles both arms: the clippy rule passes silently
// => grade_score is snake_case: the naming rule passes silently
// => Err replaces panic: the trap rule passes silently, exit stays 0
const AFTER: &str = "/// Grades a score or refuses it with a readable message.\nfn grade_score(text: &str) -> Result<u32, String> {\n    match text.parse::<u32>() {\n        Ok(score) => Ok(score),\n        Err(_) => Err(\"not a score\".to_string()),\n    }\n}";

// check_sample runs all five rules and counts the violations found.
// => each rule is one contains/pattern test: small, named, and honest
// => the count is the verdict: zero means the sample may ship
fn check_sample(sample: &str) -> Vec<String> {
    // => &str in, owned out: findings survive the sampled text
    // => findings start empty: clean samples report the all-clear below
    let mut findings: Vec<String> = Vec::new();
    for (index, line) in sample.lines().enumerate() {
        // => enumerate counts from zero: messages add one for humans
        // => rule one (layout): tabs never survive rustfmt, see Ex.62
        if line.contains('\t') {
            // => contains checks the raw line: trimming would hide the tab
            findings.push(format!("line {}: tab indentation", index + 1));
            // => index + 1 prints: humans count lines from one, not zero
        }
        // => rule two (clippy): bare unwrap deserves the Err arm, see Ex.63
        let code = line.trim();
        // => trim first: indented code matches the same rule shapes
        if code.ends_with(".unwrap();") || code.ends_with(".unwrap()") {
            // => two shapes: with and without the trailing semicolon
            findings.push(format!("line {}: bare unwrap", index + 1));
        }
        // => rule three (naming): CamelCase functions break snake_case, see Ex.64
        if code.starts_with("fn ") && code.contains("GradeScore") {
            // => fn plus CamelCase: the name test needs both halves
            findings.push(format!("line {}: CamelCase fn name", index + 1));
        }
        // => rule four (traps): panic in shipped code fails review, see Ex.65
        if code.contains("panic!(") {
            // => the macro name matches: panic with its bang, not panics
            findings.push(format!("line {}: panic in shipped code", index + 1));
        }
    }
    // => rule five (docs): a sample with no /// line earns one finding
    if !sample
        .lines()
        .any(|line| line.trim_start().starts_with("///"))
    {
        // => trim_start only: indented docs still count as documented
        findings.push("no doc comment".to_string());
    }
    findings
}

fn main() {
    // => two verdicts: the before count and the after count, five and zero
    // => before earns five: tab, unwrap, name, panic, plus the missing docs
    let before = check_sample(BEFORE);
    for finding in &before {
        println!("before: {finding}");
    }
    println!("before: {} findings", before.len());
    // => after earns zero: doc, layout, clippy, naming, and trap rules pass
    let after = check_sample(AFTER);
    for finding in &after {
        println!("after: {finding}");
    }
    println!("after: {} findings", after.len());
}

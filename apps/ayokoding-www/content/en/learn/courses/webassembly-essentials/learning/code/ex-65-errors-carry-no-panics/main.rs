// Example 65: Errors Carry No Panics.
//
// Library code returns Result; panic! and unreachable! belong in tests and
// examples, never in shipped paths. The checker below scans an embedded
// sample for the panic family (panic, unreachable, unimplemented, todo)
// and prints each with its line number, the shape of the audit this course
// runs on every unit before it ships (see learning/code/README.md).
// => the sample is data: two traps hide among one assert and one Result
// => assert! passes the scan: contracts are allowed, traps are not

// SAMPLE mixes one honest assert with two shipped traps, fixed in place.
// => line 2 asserts the contract: allowed, because tests check contracts
// => line 4 panics on bad input: the audit flags it, Result was available
// => line 8 is unreachable by wishful thinking: the audit flags it too
const SAMPLE: &str = "fn parse_score(text: &str) -> u32 {\n    assert!(!text.is_empty(), \"scores are never blank\");\n    let digits = text.strip_prefix(\"score:\");\n    panic!(\"bad score line\");\n}\nfn unreachable_arm() {\n    let _ = digits;\n    unreachable!(\"all scores grade A to F\");\n}";

// check_traps reports the panic family by macro name, line by line.
// => the family lists four macros: panic, unreachable, unimplemented, todo
// => contains() on the trimmed line: indentation never hides a trap
fn check_traps(sample: &str) -> Vec<String> {
    // => the family under review: each macro below earns its own report
    let family = ["panic!(", "unreachable!(", "unimplemented!(", "todo!("];
    // => findings start empty: asserts and Results earn no report at all
    let mut findings: Vec<String> = Vec::new();
    for (index, line) in sample.lines().enumerate() {
        // => trim first: the macro may hide behind any indentation depth
        let code = line.trim();
        // => any family member on the line earns a report with its name
        for macro_name in family {
            if code.contains(macro_name) {
                findings.push(format!("line {}: {macro_name} in shipped code", index + 1));
                // => one report per line: a line with two traps is still one
                break;
            }
        }
    }
    findings
}

fn main() {
    // => the fixed sample hides two traps: panic on line 4, unreachable on 8
    let findings = check_traps(SAMPLE);
    // => each finding prints: macro name and line, the audit shape in text
    for finding in &findings {
        println!("{finding}");
    }
    // => two findings is the pinned count: the sample never changes
    println!("{} trap findings", findings.len());
}

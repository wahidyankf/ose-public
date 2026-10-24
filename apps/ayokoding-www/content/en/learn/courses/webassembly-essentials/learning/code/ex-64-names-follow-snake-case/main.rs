// Example 64: Names Follow Snake Case.
//
// The compiler warns on a CamelCase function and a shouting local, but
// the rule lives in the style guide, not the grammar: functions and
// locals are snake_case, types are UpperCamelCase, constants are
// SCREAMING_SNAKE_CASE. The checker below classifies each name in a fixed
// table and prints the ones that break their kind's convention, like the
// non_snake_case lint the compiler raises over the same names.
// => the table is data: (kind, name) rows, each checked by rule
// => classification is textual: case patterns, not compiler internals

// check_names classifies each (kind, name) row against its convention.
// => fn and let want snake_case: lowercase with underscores between words
// => type wants UpperCamelCase: capitalized words, no underscores at all
// => const wants SCREAMING_SNAKE_CASE: capitals with underscores between
fn check_names(rows: &[(&str, &str)]) -> Vec<String> {
    // => rows borrow: the table outlives the check, findings own
    // => findings start empty: conforming rows earn no report below
    let mut findings: Vec<String> = Vec::new();
    // => owned Strings leave: the transcript prints after the loop
    for (kind, name) in rows {
        // => iteration yields &(&str, &str): patterns destructure the pair
        // => each kind checks its own rule in turn: case first, shape second
        let ok = match *kind {
            // => *kind copies the &str: matching needs the value, not the borrow
            "fn" | "let" => {
                // => two kinds share the rule: functions and locals alike
                name.chars()
                    .all(|c| c.is_lowercase() || c == '_' || c.is_numeric())
                // => all() short-circuits: the first bad character fails the row
            }
            // => types capitalize every word and carry no underscores
            "type" => {
                !name.contains('_')
                    && name
                        .chars()
                        .next()
                        .map(|c| c.is_uppercase())
                        .unwrap_or(false)
            }
            // => starts uppercase, no underscores: the UpperCamelCase test
            // => constants shout: capitals, digits, and underscores only
            "const" => name
                .chars()
                .all(|c| c.is_uppercase() || c == '_' || c.is_numeric()),
            // => all caps or digits or _: the SCREAMING_SNAKE_CASE test
            // => unknown kinds pass silently: the table only teaches three
            _ => true,
        };
        // => violations print with kind and name: the lint's shape, in text
        if !ok {
            // => only violators append: conforming rows stay silent
            findings.push(format!("{kind} {name:?} breaks convention"));
            // => {name:?} quotes: the finding shows the exact spelling
        }
    }
    findings
}

fn main() {
    // => nine rows, four findings: the suite of names never changes
    // => the fixed table mixes five conforming names with four violations
    let rows = [
        // => the fixed table: five conforming names, four violations
        ("fn", "grade_score"),
        ("fn", "GradeScore"),
        ("let", "total_count"),
        ("let", "TotalCount"),
        ("type", "Roster"),
        ("type", "roster_entry"),
        ("const", "MAX_SCORE"),
        ("const", "maxScore"),
        ("fn", "parse_line"),
    ];
    // => each violation prints: GradeScore, TotalCount, roster_entry, maxScore
    let findings = check_names(&rows);
    // => &rows borrows: the table stays put while findings own
    for finding in &findings {
        // => borrow per finding: printing never consumes the list
        println!("{finding}");
    }
    // => four violations is the pinned count: the table never changes
    println!("{} naming findings", findings.len());
}

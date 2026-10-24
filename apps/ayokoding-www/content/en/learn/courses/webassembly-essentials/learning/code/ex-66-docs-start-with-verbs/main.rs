// Example 66: Docs Start with Verbs.
//
// Doc comments are the API's user interface: the first line summarizes in
// one imperative sentence ("Grades a score"), and rustdoc lifts it into
// the index. The checker below reads an embedded doc sample and enforces
// the two cheapest doc rules over it: every /// line starts with ///, and
// the summary line starts with a verb in its base form.
// => the sample is data: three verbs lead, two lines break the rules
// => starts_with checks the shape: content review stays a human job

// SAMPLE holds five doc lines: three summaries and two violations.
// => line 1 leads with a verb: "Grades" states the action in one word
// => line 4 is prose without markers: rustdoc would render it as code
const SAMPLE: &str = "/// Grades a score into its letter.\n/// Returns F for anything below 60.\n/// Refuses missing input with the Missing case.\nThis line documents without markers.\n/// 123 starts with a number, not a verb.";

// check_docs reports doc lines that break the two shape rules, by number.
// => rule one: every line starts with ///, the doc comment marker itself
// => rule two: the first word after /// starts with an uppercase letter
fn check_docs(sample: &str) -> Vec<String> {
    // => findings start empty: well-shaped lines earn no report below
    let mut findings: Vec<String> = Vec::new();
    for (index, line) in sample.lines().enumerate() {
        // => rule one fires on marker-less lines: prose among the docs
        if !line.starts_with("///") {
            findings.push(format!("line {}: doc line without /// marker", index + 1));
            continue;
        }
        // => strip the marker: the first word of the summary is the verb
        let summary = line.trim_start_matches('/').trim();
        // => rule two fires when the summary leads with a non-uppercase word
        if !summary
            .chars()
            .next()
            .map(|c| c.is_uppercase())
            .unwrap_or(false)
        {
            findings.push(format!(
                "line {}: summary does not start with a verb",
                index + 1
            ));
        }
    }
    findings
}

fn main() {
    // => the fixed sample breaks two rules: line 4 misses ///, line 5 the verb
    let findings = check_docs(SAMPLE);
    // => each finding prints: the line number and the broken shape rule
    for finding in &findings {
        println!("{finding}");
    }
    // => two findings is the pinned count: the sample never changes
    println!("{} doc findings", findings.len());
}

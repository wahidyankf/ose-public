// Kata 4 solution: guard clauses flatten the pyramid to the margin.
//
// Each nested condition becomes a top-level refusal that returns early:
// age, then score, then seat, each named at its own level with no else.
// The happy path prints at the left margin, and the three refusals read
// as a checklist instead of a staircase.
// => invert each condition: the refusal returns, the pass falls through
// => the happy path is the last line: everything above it is a guard

// admit checks age, score, and seat as three guard clauses in order.
// => the first failing guard returns: later guards never run past a refusal
// => the happy path needs no branch: reaching it means all guards passed
fn admit(age: u8, score: u8, seat: bool) -> &'static str {
    // => three params, one verdict: age, score, and seat decide together
    // => guard one: juniors wait, everyone else falls through to scoring
    if age < 17 {
        return "waitlisted: age below 17";
    }
    // => guard two: low scores wait, qualifying scores fall through to seats
    if score < 60 {
        return "waitlisted: score below 60";
    }
    // => guard three: full rooms wait, seated applicants fall through to admit
    if !seat {
        return "waitlisted: no seat";
    }
    // => past all three guards: admitted, at the left margin, no nesting
    "admitted"
}

fn main() {
    // => four applicants: the admit plus one refusal per guard
    // => the same four applicants: one admits, three wait with reasons
    println!("{}", admit(18, 91, true));
    println!("{}", admit(16, 91, true));
    println!("{}", admit(18, 55, true));
    println!("{}", admit(18, 91, false));
}

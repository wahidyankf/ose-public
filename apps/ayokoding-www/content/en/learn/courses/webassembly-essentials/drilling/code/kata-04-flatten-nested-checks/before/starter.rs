// Kata 4 starter: nested checks pyramid rightward.
//
// Three validations nest three deep, and the happy path hides at the
// bottom of the staircase. Your task: invert every check into a guard
// clause that returns early, so the happy path climbs back to the margin
// and each refusal names its own condition at its own level.
// => the happy path sits three levels deep: guards will lift it to zero
// => each nested else becomes a top-level return: failures exit in order
fn admit(age: u8, score: u8, seat: bool) -> &'static str {
    // => level one: age gates the whole admission, junior applicants wait
    if age >= 17 {
        // => level two: the score gates the qualified, low scores wait too
        if score >= 60 {
            // => level three: the seat gates the ready, full rooms wait
            if seat {
                "admitted"
            } else {
                "waitlisted: no seat"
            }
        } else {
            "waitlisted: score below 60"
        }
    } else {
        "waitlisted: age below 17"
    }
}

fn main() {
    // => four applicants: one admits, three wait for three different reasons
    println!("{}", admit(18, 91, true));
    println!("{}", admit(16, 91, true));
    println!("{}", admit(18, 55, true));
    println!("{}", admit(18, 91, false));
}

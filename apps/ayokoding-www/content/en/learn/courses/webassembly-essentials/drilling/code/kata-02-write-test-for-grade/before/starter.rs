// Kata 2 starter: a grader with no tests.
//
// The rule below is correct on the rows its author tried and wrong on the
// one they did not: 89 grades B here, but the band table says C starts at
// 70 and B at 80, so 89 is... check the boundary yourself. Your task: add
// the #[cfg(test)] suite that pins every band edge, then fix the rule the
// failing test names.
// => the boundary bug hides in the second arm: 80..=88 excludes 89
// => the table test from Example 37 catches it: one row per band edge
fn letter(score: u8) -> char {
    match score {
        90..=100 => 'A',
        // => the upper edge stops at 88: 89 falls through to C below
        80..=88 => 'B',
        70..=79 => 'C',
        60..=69 => 'D',
        _ => 'F',
    }
}

fn main() {
    // => the binary samples the bands: 89 prints the wrong letter today
    for score in [95u8, 89, 75, 65, 55] {
        println!("{score} -> {}", letter(score));
    }
}

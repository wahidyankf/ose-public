// Kata 1 starter: exception-style parsing with unwrap.
//
// This is the before half: it works on clean input and traps on the first
// bad row. Your task: convert it to the after half, where every failure
// is a matched Result and the transcript ends with refusals, not a trap.
// => the unwrap on parse is the smell: row 3 ("many") traps the module
// => match the parse: Ok grades, Err names the row and moves on
fn grade(score: u32) -> char {
    match score {
        90..=100 => 'A',
        80..=89 => 'B',
        70..=79 => 'C',
        60..=69 => 'D',
        _ => 'F',
    }
}

fn main() {
    // => three rows: two grade, the third traps on unwrap, by design
    for row in ["sari=91", "budi=77", "citra=many"] {
        // => split_once divides the row: the shape is fine, the digits are not
        let (_, digits) = row.split_once('=').unwrap();
        // => the trap: "many" never parses, and unwrap aborts the module
        let score: u32 = digits.parse().unwrap();
        println!("{row} -> {}", grade(score));
    }
}

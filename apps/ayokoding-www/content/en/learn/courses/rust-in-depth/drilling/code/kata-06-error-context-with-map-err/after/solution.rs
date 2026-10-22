// Kata 06 After: `map_err` names the line at the parsing boundary.
// => Context attaches where the input is known: inside `due`, not above it.
// => The good path is untouched: `map_err` transforms failures only.
// => Both verdicts below identify their input: the operator can act on them.
fn amount_named(raw: &str) -> Result<i32, String> {
    // => failures carry context
    raw.trim() // => noise off first, same as the starter
        .parse::<i32>() // => the same stdlib parse underneath
        .map_err(|_| format!("bad amount: {}", raw)) // => names the input line
}
fn main() {
    // => good input parses, junk names itself: both verdicts actionable.
    println!("{:?}", amount_named("50")); // => Output: Ok(50)
    println!("{:?}", amount_named("xyz")); // => Output: Err("bad amount: xyz")
}

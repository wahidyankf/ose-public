// Example 12: Map Err Adds Context.
// => `map_err` transforms only the failure, leaving success untouched.
// => Wrap at the boundary where you know what the program was attempting.
fn parse_line(line: &str) -> Result<(&str, i32), String> {
    // => member and amount
    // => split the line first: a missing colon is a shape failure, not a parse one.
    let (member, raw) = line // => borrow the line; both halves borrow it too
        .split_once(':') // => `None` when the colon is missing entirely
        .ok_or_else(|| format!("no colon: {}", line))?; // => `?` lifts it early
                                                        // => the amount parse below is where the low-level error gets its context.
    let amount = raw // => the text after the colon
        .parse::<i32>() // => `ParseIntError` says little about our ledger
        .map_err(|_| format!("line {:?} has a bad amount", line))?; // => now it names the line
    Ok((member, amount)) // => both halves survived: hand them back
}
fn main() {
    // => one good line and one bad amount: fixed inputs, fixed verdicts.
    println!("{:?}", parse_line("sari:50")); // => Output: Ok(("sari", 50))
    println!("{:?}", parse_line("sari:xyz")); // => Output: Err("line \"sari:xyz\" has a bad amount")
}

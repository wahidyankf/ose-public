// Example 1: If Let Replaces a Nested Match.
// => `if let` handles the one case you care about and skips the rest.
// => A full `match` here would push the greeting one level deeper.
// => `Option<&str>`: the nickname may or may not be there.
// => `'static` says the strings live for the whole program run.
fn nickname(of: &str) -> Option<&'static str> {
    // => static strings, no lifetimes needed
    match of {
        // => the tiny table lives in the match arms
        "Budi" => Some("Bud"),  // => first known nickname
        "Citra" => Some("Cit"), // => second known nickname
        _ => None,              // => Sari and the rest are intentionally absent
    }
}
fn main() {
    // => Two lookups below: one hit and one miss, both fully determined.
    // => `if let` runs the greeting only when the lookup finds something.
    if let Some(nick) = nickname("Budi") {
        // => Budi is present
        println!("halo, {}!", nick); // => Output: halo, Bud!
    }
    // => the missing key falls through to the `else`, flat and readable.
    if let Some(nick) = nickname("Sari") {
        // => Sari is absent
        println!("halo, {}!", nick); // => skipped: the option is `None`
    } else {
        println!("no nickname"); // => Output: no nickname
    }
}

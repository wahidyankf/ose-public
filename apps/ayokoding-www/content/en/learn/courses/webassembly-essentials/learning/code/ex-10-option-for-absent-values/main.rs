// Example 10: Option Combinators Chain.
//
// Nested if-lets pyramid quickly; combinators (map, and_then, unwrap_or)
// keep an optional pipeline flat by threading the Some value through and
// short-circuiting the first None to the default at the very end.
// => map transforms inside Some; and_then chains fallible steps
// => exactly one default appears, at the end, as unwrap_or's argument

// nickname_of looks a name up in a tiny directory of preferred names.
// => Option<&str> keeps absence ordinary: misses are data, not errors
// => callers below compose the steps without a single nested branch
fn nickname_of(name: &str) -> Option<&str> {
    // => match on a fixed table: two names hit, everything else misses
    match name {
        "Sari" => Some("S"),
        "Budi" => Some("B"),
        // => the wildcard arm is the honest miss: no nickname exists
        _ => None,
    }
}

// badge_of maps a nickname to its badge letter, again possibly absent.
// => a second lookup stage: absence stays ordinary data here as well
fn badge_of(nick: &str) -> Option<char> {
    // => only "S" holds a badge in this fixed table
    match nick {
        "S" => Some('*'),
        // => every other nickname simply has no badge to show
        _ => None,
    }
}

fn main() {
    // => map+and_then chain: two lookups collapse into one expression
    let sari_badge = nickname_of("Sari").and_then(badge_of).unwrap_or('-');
    // => S -> *: both lookups hit, so the badge prints
    println!("Sari: {sari_badge}");
    // => the chain short-circuits at the missing badge, not at the lookup
    let budi_badge = nickname_of("Budi").and_then(badge_of).unwrap_or('-');
    // => Budi has a nickname but no badge: the default '-' prints
    println!("Budi: {budi_badge}");
    // => the chain short-circuits at the first miss for an unknown name
    let citra_badge = nickname_of("Citra").and_then(badge_of).unwrap_or('-');
    // => no nickname means no badge lookup runs at all: '-' prints
    println!("Citra: {citra_badge}");
}

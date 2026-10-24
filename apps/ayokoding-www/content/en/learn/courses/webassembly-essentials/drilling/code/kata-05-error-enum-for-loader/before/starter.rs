// Kata 5 starter: string errors for a record loader.
//
// Every stage fails with a String, so callers match text instead of cases:
// adding a stage means editing every match, and two stages can produce the
// same message for different causes. Your task: give each failure its own
// enum variant with Display, and let the loader return the type, not text.
// => string errors merge causes: "bad data" could mean the name or digits
// => the enum names three cases: missing separator, bad digits, bad range
fn load(row: &str) -> Result<(String, u32), String> {
    // => the split fails with text: the separator case has no name of its own
    let (name, digits) = match row.split_once('=') {
        Some(pair) => pair,
        None => return Err(format!("bad row: {row:?}")),
    };
    // => the parse fails with text: digits and range share one message shape
    let score: u32 = match digits.parse() {
        Ok(score) => score,
        Err(_) => return Err(format!("bad score: {digits:?}")),
    };
    // => the range fails with text: three causes, one String, no cases
    if score > 100 {
        return Err(format!("bad score: {score}"));
    }
    Ok((name.to_string(), score))
}

fn main() {
    // => three rows: one loads, two fail with indistinguishable Strings
    for row in ["sari=91", "budi=many", "citra=104"] {
        println!("{row:?} -> {:?}", load(row));
    }
}

// Example 31: Version Requirements Match.
// => `^1.2.3` allows 1.x growth; `~1.2.3` allows 1.2.x; `=1.2.3` pins exact.
// => Versions compare as triples: major, then minor, then patch, in order.
// => The table below is fixed: the same requirements always decide alike.
// => Real resolvers read these from `Cargo.toml`; the logic is identical.
fn triple(text: &str) -> (u32, u32, u32) {
    // => split "M.m.p" into numbers
    let mut parts = text.split('.').map(|p| p.parse::<u32>().unwrap_or(0)); // => bad parts read as zero
    let major = parts.next().unwrap_or(0); // => first number
    let minor = parts.next().unwrap_or(0); // => second number
    let patch = parts.next().unwrap_or(0); // => third number
    (major, minor, patch) // => the comparable triple
}
// => `allows` decides one requirement against one version, operator by operator.
fn allows(req: &str, ver: &str) -> bool {
    // => the resolver's core question
    // => strip the operator first: the remainder is always a plain triple.
    let (op, want) = if let Some(rest) = req.strip_prefix('^') {
        // => caret: minor growth
        ("^", rest) // => keep the operator for the match below
    } else if let Some(rest) = req.strip_prefix('~') {
        // => tilde: patch growth
        ("~", rest) // => keep the operator for the match below
    } else if let Some(rest) = req.strip_prefix('=') {
        // => equals: exact pin
        ("=", rest) // => keep the operator for the match below
    } else {
        ("^", req) // => bare "1.2.3" means caret: the Cargo default
    };
    let (wmaj, wmin, wpatch) = triple(want); // => the wanted triple
    let (vmaj, vmin, vpatch) = triple(ver); // => the candidate triple
    match op {
        // => each operator draws a different acceptance range
        "^" => vmaj == wmaj && (vmaj, vmin, vpatch) >= (wmaj, wmin, wpatch), // => same major, no older
        "~" => (vmaj, vmin) == (wmaj, wmin) && vpatch >= wpatch, // => same minor, no older
        _ => (vmaj, vmin, vpatch) == (wmaj, wmin, wpatch),       // => exact triple only
    }
}
fn main() {
    // => six fixed decisions cover growth, tightening, and the bare default.
    let cases = [
        ("^1.2.3", "1.9.0"),
        ("^1.2.3", "2.0.0"),
        ("~1.2.3", "1.2.9"),
        ("~1.2.3", "1.3.0"),
        ("=1.2.3", "1.2.3"),
        ("1.2.3", "1.4.0"),
    ]; // => requirement, candidate
    for (req, ver) in cases {
        // => each pair takes the same decision function
        // => Six rows: growth allowed, growth refused, tightening, and the default.
        println!("{} vs {}: {}", req, ver, allows(req, ver)); // => true false true false true true
    }
}

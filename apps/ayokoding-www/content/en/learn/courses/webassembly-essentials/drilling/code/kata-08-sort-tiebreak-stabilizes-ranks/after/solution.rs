// Kata 8 solution: ties break by name, so rank is total.
//
// The comparator sorts score descending, then name ascending, so equal
// scores rank alphabetically no matter the input order. sort_by is stable,
// but the tiebreak means stability never decides: the order is explicit.
// => two-key comparator: score first (descending), name second (ascending)
// => then() chains the keys: the second runs only when the first ties

// rank sorts by score descending with ties broken by name ascending.
// => right.1.cmp orders scores high-first: the leaderboard reads top-down
// => then(name) orders ties A-first: budi precedes eka at 77, always
fn rank(names: &mut [(String, u32)]) {
    // => &mut borrows the rows: sorting reorders in place
    // => the chained comparator: score decides, name settles the ties
    names.sort_by(|left, right| right.1.cmp(&left.1).then(left.0.cmp(&right.0)));
    // => chained keys compare: score decides, name settles ties
}

fn main() {
    // => the same four rows: budi now precedes eka regardless of arrival
    let mut rows = vec![
        ("eka".to_string(), 77u32),
        ("sari".to_string(), 91),
        ("budi".to_string(), 77),
        ("citra".to_string(), 88),
    ];
    // => the tie breaks alphabetically: sari, citra, budi, eka, every run
    rank(&mut rows);
    for (name, score) in &rows {
        println!("{name}: {score}");
    }
}

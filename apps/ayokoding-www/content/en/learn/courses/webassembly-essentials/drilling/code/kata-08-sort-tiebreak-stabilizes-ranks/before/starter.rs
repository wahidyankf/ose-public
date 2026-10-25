// Kata 8 starter: sorting by score alone scrambles ties.
//
// sort_by score orders the grades but leaves tied scores in input order,
// so the transcript depends on how the rows arrived instead of what they
// mean. Your task: break ties by name ascending, so equal scores rank
// alphabetically and the table reads the same no matter the input order.
// => input order leaks through ties: budi and eka tie at 77, order accidental
// => the tiebreak sorts (score desc, name asc): rank is total, never partial

// rank sorts by score descending only; ties keep whatever order they arrived in.
// => sort_by with one key: the comparator never looks at the name
// => reverse() flips the whole order: descending scores, accidental ties
fn rank(names: &mut [(String, u32)]) {
    // => descending by score: the highest grade leads the table below
    names.sort_by(|left, right| right.1.cmp(&left.1));
}

fn main() {
    // => four rows: budi and eka tie at 77 in arrival order, eka first
    let mut rows = vec![
        ("eka".to_string(), 77u32),
        ("sari".to_string(), 91),
        ("budi".to_string(), 77),
        ("citra".to_string(), 88),
    ];
    // => the tie survives in arrival order: eka prints before budi today
    rank(&mut rows);
    for (name, score) in &rows {
        println!("{name}: {score}");
    }
}

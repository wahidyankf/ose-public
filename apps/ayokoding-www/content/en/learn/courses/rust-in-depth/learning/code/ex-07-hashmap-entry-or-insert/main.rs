// Example 7: HashMap Entry or Insert.
// => `entry` hashes once and returns a slot: occupied or vacant.
// => `or_insert` fills vacant slots so the update below is unconditional.
use std::collections::HashMap; // => the per-member totals table
fn main() {
    // => fixed dues: the same members and amounts on every run.
    let dues = [("sari", 50), ("budi", 75), ("sari", 25)]; // => sari pays twice
                                                           // => totals start empty; the entry API grows them key by key.
    let mut totals: HashMap<&str, i32> = HashMap::new(); // => member to sum
    for (member, amount) in dues {
        // => each pair updates one slot
        // => vacant members start at zero; occupied ones keep their total.
        *totals.entry(member).or_insert(0) += amount; // => one lookup total
    }
    // => sorted names keep the print order fixed: maps do not promise order.
    let mut names: Vec<&str> = totals.keys().copied().collect(); // => names
    names.sort(); // => alphabetical: budi before sari, every run
    for name in names {
        // => totals[name] is safe: the key came from the map
        println!("{}: {}", name, totals[name]); // => budi: 75, then sari: 75
    }
}

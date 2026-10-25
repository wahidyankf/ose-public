// Example 6: Vec Capacity Doubling.
// => `len` counts elements; `capacity` counts room before reallocating.
// => Pushing past capacity reallocates and copies: doubling keeps it rare.
fn main() {
    // => start empty: the first push must allocate before it can store.
    let mut dues: Vec<i32> = Vec::new(); // => no room yet, capacity zero
    for due in 1..=10 {
        // => ten fixed dues, identical every run
        dues.push(due * 10); // => append; reallocation happens on its own
                             // => only the length prints: exact capacities are allocator detail.
        println!("len {}", dues.len()); // => 1 through 10, one per push
    }
    // => reserve up front when the size is known: no copying at all.
    let mut known: Vec<i32> = Vec::with_capacity(10); // => room for ten now
    for due in 1..=10 {
        // => the same ten dues as above
        known.push(due * 10); // => no reallocation needed on this path
    }
    // => `with_capacity` guarantees at least the requested room, every run.
    println!("reserved: {}", known.capacity() >= 10); // => Output: reserved: true
                                                      // => the total below is fixed: 10 + 20 + ... + 100 always sums to 550.
    println!("sum: {}", dues.iter().sum::<i32>()); // => Output: sum: 550
}

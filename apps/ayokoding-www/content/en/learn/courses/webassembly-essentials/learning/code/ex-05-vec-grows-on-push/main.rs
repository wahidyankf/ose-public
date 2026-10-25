// Example 5: Vec Grows on Push.
//
// Vec owns a growable buffer: push appends at the end, length counts the
// live elements, and capacity counts the reserved slots, so watching both
// numbers teaches the doubling rule without reading allocator source.
// => length is what you filled; capacity is what you reserved ahead
// => growth doubles, so a thousand pushes reallocate only ~ten times

fn main() {
    // => with_capacity reserves 2 slots: the first growth is then visible
    let mut readings: Vec<u32> = Vec::with_capacity(2);
    // => fixed input: the same four pushes run on every execution
    for reading in [21u32, 22, 23, 24] {
        // => push may reallocate: the Vec hides that move from callers
        readings.push(reading);
        // => length and capacity after each push show the doubling rule
        println!(
            "pushed {reading}: len={} cap={}",
            readings.len(),
            readings.capacity()
        );
    }
    // => pop removes from the end: the Vec shrinks logically, not physically
    if let Some(last) = readings.pop() {
        // => pop returns Option: an empty Vec yields None instead of trapping
        println!("popped {last}: len={}", readings.len());
    }
    // => indexing a live position is safe: the length check already passed
    println!("first reading: {}", readings[0]);
}

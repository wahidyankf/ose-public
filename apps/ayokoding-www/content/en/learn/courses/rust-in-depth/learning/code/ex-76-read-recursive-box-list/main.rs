// Example 76: Read a Recursive Box List.
// => LAYER 1, signatures: `sum` borrows the list, `len` counts its links.
// => LAYER 2, types: `Box<List>` breaks the infinite size with one pointer.
// => LAYER 3, control flow: match the node, recurse into the boxed tail.
// => LAYER 4, data flow: values add up while borrows walk down the spine.
// => `&*tail` reborrows through the box: walking never takes ownership.
enum List {
    // => a dues list: empty or one due plus the rest
    Nil,                  // => the end of every list: zero links beyond here
    Cons(i32, Box<List>), // => one due plus the boxed remainder
}
use List::{Cons, Nil}; // => short names for the two shapes below
                       // => `sum` walks by shared borrow: the list outlives every call.
fn sum(list: &List) -> i32 {
    // => borrows the whole spine
    match list {
        // => every node is one of the two shapes
        Nil => 0,                                   // => empty tail contributes nothing
        Cons(amount, tail) => amount + sum(&*tail), // => head plus the rest
    }
}
// => `len` walks the same spine: same borrow, different accumulation.
fn len(list: &List) -> usize {
    // => counts links, not dues
    match list {
        // => the same two shapes as above
        Nil => 0,                         // => empty tail holds no links
        Cons(_, tail) => 1 + len(&*tail), // => one link plus the rest
    }
}
fn main() {
    // => three fixed dues nested as boxes: 50, then 75, then 25, then Nil.
    let dues = Cons(50, Box::new(Cons(75, Box::new(Cons(25, Box::new(Nil)))))); // => the whole list
    println!("len: {}", len(&dues)); // => Output: len: 3
    println!("sum: {}", sum(&dues)); // => Output: sum: 150
}

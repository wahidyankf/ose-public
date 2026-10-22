// Example 52: Rc and RefCell Share Ownership.
// => `Rc` clones the handle, not the value: many owners, one allocation.
// => `RefCell` checks borrows at runtime: mutation through a shared handle.
// => `borrow_mut` panics on conflicting borrows: single-threaded discipline.
// => Both handles below mutate the same total: updates are visible everywhere.
use std::cell::RefCell; // => runtime-checked interior mutability
use std::rc::Rc; // => single-threaded shared ownership
fn main() {
    // => one total shared by two handles: the classic counter shape.
    let shared = Rc::new(RefCell::new(0)); // => zero total, two mechanisms
    let first = Rc::clone(&shared); // => handle one: cheap pointer copy
    let second = Rc::clone(&shared); // => handle two: same value, new handle
    *first.borrow_mut() += 50; // => update through handle one
    *second.borrow_mut() += 75; // => update through handle two
                                // => both updates landed in the same cell: the total is their sum.
    println!("handles: {}", Rc::strong_count(&shared)); // => Output: handles: 3
    println!("total: {}", shared.borrow()); // => Output: total: 125
}

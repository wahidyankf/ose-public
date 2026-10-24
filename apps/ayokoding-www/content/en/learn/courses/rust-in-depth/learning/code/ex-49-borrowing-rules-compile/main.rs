// Example 49: Borrowing Rules That Compile.
// => Many `&` borrows may coexist: shared reads never conflict.
// => One `&mut` needs solitude: exclusive writes see a stable world.
// => Borrows end at their last use: reads finish before the write begins.
// => The compiler rejects mixing them: data races fail to compile, not at runtime.
fn main() {
    // => the ledger lives in one vector owned by `main` throughout.
    let mut dues = vec![50, 75, 25]; // => three dues, owned here
                                     // => two shared borrows coexist: both read, neither writes.
    let first = &dues; // => shared borrow one: reads the whole vector
    let second = &dues; // => shared borrow two: still only reading
    println!("reads: {} {}", first.len(), second.len()); // => Output: reads: 3 3
                                                         // => the reads end above, so the exclusive borrow below is legal.
    let writer = &mut dues; // => the single exclusive borrow starts here
    writer.push(100); // => the write: only possible without active readers
    println!("after push: {}", writer.len()); // => Output: after push: 4
                                              // => the write ends above: shared reading resumes for the final total.
    println!("total: {}", dues.iter().sum::<i32>()); // => Output: total: 250
}

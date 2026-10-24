// Example 72: Read a Trait-Object Dispatcher.
// => LAYER 1, signatures: `settle_all` takes boxed settlers, returns the total.
// => LAYER 2, types: `Box<dyn Settle>` erases the concrete due kinds.
// => LAYER 3, control flow: one loop, one dynamic call per item, no branches.
// => LAYER 4, data flow: behaviors in, one summed total out.
// => `dyn` marks the dynamic call: the method resolves at runtime below.
trait Settle {
    // => the shared behavior every due kind implements
    fn settle(&self) -> i32; // => one method: the whole dispatch contract
}
struct Cash(i32); // => settles at face value
struct Transfer(i32); // => adds the two-unit fee
struct Waived(i32); // => halves above the waiver line
impl Settle for Cash {
    // => face value, the simplest rule
    fn settle(&self) -> i32 {
        // => borrows, never consumes
        self.0 // => the amount straight through
    }
}
impl Settle for Transfer {
    // => the fee rule
    fn settle(&self) -> i32 {
        // => same signature, different arithmetic
        self.0 + 2 // => face plus the two-unit fee
    }
}
impl Settle for Waived {
    // => the waiver rule
    fn settle(&self) -> i32 {
        // => halves unconditionally here
        self.0 / 2 // => the waived settlement
    }
}
// => `settle_all` reads the same for any mix: the loop never names a type.
// => The slice borrows the vector: dispatch needs no ownership of the dues.
fn settle_all(dues: &[Box<dyn Settle>]) -> i32 {
    // => signature: boxed behaviors in
    dues.iter().map(|due| due.settle()).sum() // => dynamic call per item, then sum
}
fn main() {
    // => three kinds in one vector: the mix dynamic dispatch exists to serve.
    // => Each `Box::new` pins its kind behind the shared `Settle` behavior.
    // => The total below is fixed: 50 cash plus 52 transfer plus 75 waived.
    let dues: Vec<Box<dyn Settle>> = vec![
        Box::new(Cash(50)),
        Box::new(Transfer(50)),
        Box::new(Waived(150)),
    ]; // => 50 + 52 + 75
    println!("total: {}", settle_all(&dues)); // => Output: total: 177
}

// Example 46: Trait Defines Shared Behavior.
// => A trait names behavior; each type implements it its own way.
// => `impl Settle for Cash` attaches the behavior to the concrete type.
// => Generic `report` accepts anything implementing `Settle`: static dispatch.
// => New due types join by implementing the trait, never by editing `report`.
trait Settle {
    // => the shared behavior: settle to a final amount
    fn settle(&self) -> i32; // => every implementor answers this
}
struct Cash(i32); // => cash settles at face value, no fee
                  // => Tuple structs keep one-field wrappers free of field-name ceremony.
struct Transfer(i32); // => transfers add a fixed two-unit fee
impl Settle for Cash {
    // => cash behavior: face value, nothing added
    fn settle(&self) -> i32 {
        // => borrows: settling reads, never consumes
        self.0 // => the face value straight through
    }
}
impl Settle for Transfer {
    // => transfer behavior: face plus the fee
    fn settle(&self) -> i32 {
        // => same signature, different arithmetic
        self.0 + 2 // => the two-unit transfer fee applies here
    }
}
// => `report` is generic over the behavior, not over concrete types.
fn report<T: Settle>(label: &str, due: &T) -> String {
    // => any settler works
    format!("{}: {}", label, due.settle()) // => one rendering, every type
}
fn main() {
    // => two fixed dues take the same report function through one trait.
    // => Adding a third due type means a third `impl`, never touching `report`.
    println!("{}", report("cash", &Cash(50))); // => Output: cash: 50
    println!("{}", report("transfer", &Transfer(50))); // => Output: transfer: 52
}

// Example 28: Crate Tree in One File.
// => `crate::` starts at the root: absolute paths never depend on position.
// => `super::` climbs one level: siblings reach each other without the root.
// => `self::` stays put: it names the current module explicitly when needed.
mod ledger {
    // => first level under the crate root
    // => second level: the parser nested inside the ledger module.
    pub mod parse {
        // => `pub` all the way: the root test reaches down here
        // => the deepest item: a constant both paths below will read.
        pub const SEP: char = ':'; // => the ledger separator, defined once
    }
    // => `super` is unused here; the sibling route below shows `self` instead.
    pub fn describe() -> String {
        // => names its own separator explicitly
        format!("sep is {:?}", self::parse::SEP) // => `self` stays in `ledger`
    }
}
fn main() {
    // => the absolute path from the root reaches straight down two levels.
    println!("root path: {:?}", crate::ledger::parse::SEP); // => Output: root path: ':'
                                                            // => the relative read goes through the sibling's own explicit path.
    println!("{}", ledger::describe()); // => Output: sep is ':'
}

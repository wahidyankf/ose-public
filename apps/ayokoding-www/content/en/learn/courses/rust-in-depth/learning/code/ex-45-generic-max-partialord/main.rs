// Example 45: Generic Max over PartialOrd.
// => `<T: PartialOrd>` accepts every type that knows how to compare.
// => `Copy` lets the winner move out without borrowing trouble.
// => One function below serves integers, floats, and string slices alike.
// => Monomorphization stamps a copy per type: generic source, static binaries.
fn max_of<T: PartialOrd + Copy>(pair: (T, T)) -> T {
    // => the bound is the contract
    let (a, b) = pair; // => destructure once, compare once
    if a >= b {
        // => `>=` comes from the `PartialOrd` bound
        a // => the winner moves out: `Copy` allows the move
    } else {
        b // => either arm returns an owned `T`
    }
}
fn main() {
    // => three fixed pairs across three types, each with its known max.
    println!("int: {}", max_of((50, 75))); // => Output: int: 75
    println!("float: {}", max_of((33.5, 33.25))); // => Output: float: 33.5
    println!("name: {}", max_of(("sari", "budi"))); // => Output: name: sari
}

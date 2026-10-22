// Example 34: Cfg Selects the Build Shape.
// => `#[cfg(flag)]` keeps an item only when the flag is passed to rustc.
// => `#[cfg(not(flag))]` keeps the fallback: exactly one arm survives.
// => The run for this unit passes `--cfg lesson`, so the lesson arm wins.
// => Real builds use this for targets and features; the mechanism is the same.
// => Only the surviving arm prints: the choice happens at compile time.
#[cfg(lesson)] // => kept because the run passes `--cfg lesson`
fn shape() -> &'static str {
    // => the lesson build of this function
    "lesson build" // => proves the flag reached the compiler
}
#[cfg(not(lesson))] // => dropped: the flag above is present
fn shape() -> &'static str {
    // => the default build of this function
    "default build" // => would print without the flag
}
fn main() {
    // => the flag decides at compile time, so the output below is fixed.
    println!("shape: {}", shape()); // => Output: shape: lesson build
}

// Example 64: Option Env Proves the Cargo Context.
// => `option_env!` returns `Some` when cargo sets the variable, `None` otherwise.
// => Cargo sets `CARGO_PKG_NAME` and `PROFILE`; bare `rustc` sets neither.
// => The harness compiles with `rustc` directly: this unit always sees `None`.
// => Branching on `None` keeps one source working in both build contexts.
fn main() {
    // => `PROFILE` is "debug" or "release" under cargo, absent under rustc.
    match option_env!("PROFILE") {
        // => compile-time lookup, no runtime cost
        Some(profile) => println!("cargo profile: {}", profile), // => cargo builds land here
        None => println!("direct rustc build"),                  // => Output: direct rustc build
    }
    // => unset variables are ordinary `None`: no panic, no build failure.
    println!("custom: {:?}", option_env!("LESSON_BUILD_TAG")); // => Output: custom: None
}

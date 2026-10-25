// Example 27: File Modules Split Crates (main half).
//
// When one file grows past a screenful of purpose, `mod stats;` moves the
// statistics half into stats.rs: same fences as Example 26, new file.
// rustc finds the sibling automatically, so the build command never changes.
// => one file per purpose: main.rs orchestrates, stats.rs computes
// => the mod line is the whole wiring: no manifest lists the files

// stats lives in stats.rs beside this file: the lesson anchors both.
// => `mod stats;` without a body loads the sibling file by name
// => visibility rules are unchanged: pub still marks the shared face
mod stats;

fn main() {
    // => fixed samples: mean 5.0 and median 5.0 are hand-checkable
    let samples = [4.0f64, 8.0, 6.0, 5.0, 3.0, 7.0, 2.0];
    // => mean reads through the module fence: stats::mean, qualified
    println!("mean: {}", stats::mean(&samples));
    // => median sorts a copy: the caller's order is never disturbed
    println!("median: {}", stats::median(&samples));
    // => variance over the same samples: 4.0 exactly, printed below
    println!("variance: {}", stats::variance(&samples));
}

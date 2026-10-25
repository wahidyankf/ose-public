// Example 74: Read the Process Boundary.
// => LAYER 1, signatures: `Command` builds the argv, `output` runs it.
// => LAYER 2, types: `Output` carries status plus captured stdout and stderr.
// => LAYER 3, control flow: `status.success()` decides pass or fail.
// => LAYER 4, data flow: fixed argument out, echoed bytes back, verdict printed.
// => `echo` ships with every unix base image: the boundary needs no setup.
// => Bytes back are UTF-8 here: `from_utf8` plus `trim_end` recover the line.
use std::process::Command; // => spawning and waiting live here
fn main() {
    // => one fixed argument: the same settlement line every run.
    let spawned = Command::new("echo") // => the program at the boundary
        .arg("sari:50") // => the single fixed argument
        .output() // => run to completion, capture both streams
        .expect("echo ships with the base image"); // => missing echo is environmental
                                                   // => the exit status decides the verdict: success continues, failure reports.
    println!("ok: {}", spawned.status.success()); // => Output: ok: true
                                                  // => stdout returns the echoed bytes: decode and trim the trailing newline.
    let echoed = String::from_utf8(spawned.stdout).expect("echo writes utf8"); // => always utf8 here
    println!("echoed: {}", echoed.trim_end()); // => Output: echoed: sari:50
}

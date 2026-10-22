// Example 60: Threads Need a Feature.
//
// The pinned runtime is single-threaded: WASI threads need the threads
// proposal, which the runtime does not implement, so std::thread::spawn
// has no threads to make. Builder::spawn reports that honestly as an io
// error of kind Unsupported instead of trapping, and this survey prints
// the kind: portable code matches on it and falls back to the queue from
// Example 55, while Wasm code never assumes threads exist.
// => spawn returns Result: the boundary is data, not a trap, by std design
// => match the kind, not the text: kinds are stable, messages are not

// try_spawn attempts one worker thread and reports the platform's answer.
// => Builder::spawn returns io::Result: Err names why no thread started
// => the Ok arm joins immediately: the survey wants the answer, not speed
fn try_spawn() -> Result<String, std::io::ErrorKind> {
    // => Builder names the attempt: the default stack, one named worker
    match std::thread::Builder::new()
        .name("grader".to_string())
        .spawn(|| 41 + 1)
    {
        // => the threaded path: join the handle and report the computed 42
        Ok(handle) => match handle.join() {
            Ok(value) => Ok(format!("thread computed {value}")),
            // => a panicking worker surfaces here: report, never propagate
            Err(_) => Err(std::io::ErrorKind::Other),
        },
        // => the single-threaded path: the kind is the whole lesson
        Err(error) => Err(error.kind()),
    }
}

fn main() {
    // => one match on the platform's answer: kind, never message text
    match try_spawn() {
        // => reachable where threads exist: native targets print this arm
        Ok(report) => println!("threaded: {report}"),
        // => reachable under the pinned runtime: Unsupported is the survey
        Err(kind) => println!("single-threaded runtime: spawn reports {kind:?}"),
    }
}

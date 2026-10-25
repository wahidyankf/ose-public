// Example 68: Explain the Error Code.
//
// rustc --explain turns a code like E0308 into a page; the same habit
// works for io errors if the program maps each ErrorKind to its advice.
// The explainer below matches every kind the course meets (NotFound,
// PermissionDenied, Unsupported, and the rest) to one actionable line,
// the --explain shape: code in, understanding out.
// => match every kind the program can meet: new kinds must earn advice too
// => advice is actionable: each line says what to change, not what broke

use std::io::ErrorKind;

// => ErrorKind is the matchable shape: kinds, not messages

// explain maps an error kind to the one line that unblocks the reader.
// => &'static str advice: the table lives as long as the program does
// => _ covers the long tail: rare kinds share the generic fallback line
fn explain(kind: ErrorKind) -> &'static str {
    // => Copy in: ErrorKind passes by value, cheaply
    match kind {
        // => arms name the course's reality: mounts, sandboxes, runtimes
        // => the mount moved or the name is wrong: check the path first
        ErrorKind::NotFound => "check the path: the file or mount is missing",
        // => the sandbox refused the write: scratch goes to /tmp, see Ex.22
        ErrorKind::PermissionDenied => "write to /tmp: the unit folder is read-only",
        // => the platform lacks the feature: fall back, like threads in Ex.60
        ErrorKind::Unsupported => "fall back: the runtime does not implement this",
        // => the name resolves to nothing: the input, not the code, is wrong
        ErrorKind::InvalidInput => "fix the input: the value itself is shapeless",
        // => the peer is gone: reconnect or degrade, never retry blindly
        ErrorKind::BrokenPipe | ErrorKind::ConnectionReset => {
            "the other end is gone: reconnect or degrade"
        }
        // => or-patterns share advice: two kinds, one unblocking line
        // => the wait ran out: lengthen the timeout or shrink the work
        ErrorKind::TimedOut => "lengthen the timeout or shrink the work",
        // => the write landed nowhere: clean /tmp and retry the write
        ErrorKind::WriteZero => "the write landed nowhere: clean /tmp and retry",
        // => the fallback for rare kinds: name the kind, state the rule
        _ => "unexpected kind: match on it explicitly before shipping",
        // => the wildcard closes the match: exhaustiveness demands it
    }
}

fn main() {
    // => eight kinds in, eight lines out: every arm above runs once
    // => the fixed table exercises every arm above, in match order
    for kind in [
        ErrorKind::NotFound,
        ErrorKind::PermissionDenied,
        ErrorKind::Unsupported,
        ErrorKind::InvalidInput,
        ErrorKind::BrokenPipe,
        ErrorKind::TimedOut,
        ErrorKind::WriteZero,
        ErrorKind::Other,
    ] {
        // => Debug shows the kind: the advice follows after the colon
        println!("{kind:?}: {}", explain(kind));
    }
}

// Example 23: Fixed Instants Beat Wall Clocks.
//
// A golden transcript cannot contain "now": the second execution would
// differ from the first. Deterministic time code starts from fixed
// instants (UNIX_EPOCH plus known offsets) and computes with Duration,
// so scheduling examples print plans, never the clock that ran them.
// => never print SystemTime::now: goldens must repeat byte-for-byte
// => Duration arithmetic (checked_add, as_secs) is total and pure

use std::time::{Duration, UNIX_EPOCH};

fn main() {
    // => a fixed launch instant: 2026-10-21 00:00:00 UTC as epoch seconds
    // => 1792540800 is that midnight: the number below never changes
    let launch = UNIX_EPOCH + Duration::from_secs(1792540800);
    // => three fixed offsets: warmup, main burn, and cooldown windows
    // => from_secs names the unit: seconds, never bare numbers
    let warmup = Duration::from_secs(30);
    let burn = Duration::from_secs(10 * 60);
    // => 10 * 60 reads as minutes: the arithmetic documents the unit
    let cooldown = Duration::from_secs(5 * 60);
    // => 5 * 60 ditto: cooldown is half the burn, visibly
    // => checked_add keeps time math total: overflow becomes a refusal
    // => unwrap_or falls back to epoch: a plan degrades, never traps
    let ignition = launch.checked_add(warmup).unwrap_or(UNIX_EPOCH);
    let cutoff = ignition.checked_add(burn).unwrap_or(UNIX_EPOCH);
    let done = cutoff.checked_add(cooldown).unwrap_or(UNIX_EPOCH);
    // => duration_since on ordered instants cannot fail: later minus earlier
    let elapsed = |later: std::time::SystemTime, earlier: std::time::SystemTime| {
        // => the closure returns 0 on reversal: plans never print negatives
        later.duration_since(earlier).unwrap_or(Duration::ZERO)
    };
    // => epoch seconds print as plain numbers: stable across time zones
    // => as_secs reads the count: formatting never touches the clock
    println!(
        "launch={} ignition={} cutoff={} done={}",
        launch
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::ZERO)
            .as_secs(),
        ignition
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::ZERO)
            .as_secs(),
        cutoff
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::ZERO)
            .as_secs(),
        done.duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::ZERO)
            .as_secs(),
    );
    // => fixed arithmetic reads back: 30s warmup, 600s burn, 300s cool
    println!(
        "warmup={}s burn={}s cooldown={}s",
        warmup.as_secs(),
        burn.as_secs(),
        cooldown.as_secs()
    );
    // => the whole window sums to 930 seconds: 30 + 600 + 300, printed
    println!("window={}s", elapsed(done, launch).as_secs());
}

// Example 24: Durations Schedule Tasks.
//
// Duration is the whole scheduling vocabulary: from_secs builds spans,
// as_secs reads them back, and checked arithmetic keeps sums total, so
// task plans compute start times from one fixed origin with no clock.
// => saturating/checked ops turn overflow from a trap into a decision
// => divide durations by u32 to split a window into even slots

use std::time::Duration;

// => Duration is data, not a clock: spans travel without a time source

// slot divides a window into count even slots, refusing a zero split.
// => Option return: a zero count is a usage error, not a panic site
// => the division is exact for the fixed windows this course schedules
fn slot(window: Duration, count: u32) -> Option<Duration> {
    // => Duration is Copy: the caller keeps its window after the call
    // => count 0 would divide by zero: None names the misuse up front
    if count == 0 {
        return None;
    }
    // => Duration / u32 is std's own split: even slots, remainder dropped
    Some(window / count)
}

fn main() {
    // => two demos plus a sum: split four ways, refuse zero, total the legs
    // => a fixed 15-minute window split four ways: 225 seconds each
    let window = Duration::from_secs(15 * 60);
    match slot(window, 4) {
        // => reachable: 900 / 4 is exactly 225 seconds per slot
        Some(each) => println!(
            "4 slots of {}s in a {}s window",
            each.as_secs(),
            window.as_secs()
        ),
        // => unreachable for count 4: the guard only fires on zero
        None => println!("refused: cannot split into 0 slots"),
    }
    // => the zero split demonstrates the refusal path with exit still 0
    match slot(window, 0) {
        // => unreachable: dividing by zero never produces a slot
        Some(each) => println!("0 slots of {}s?", each.as_secs()),
        // => the honest refusal: misuse prints, it never traps
        None => println!("refused: cannot split into 0 slots"),
    }
    // => checked sums keep multi-leg plans total: 225 + 225 + 450 fits
    let legs = [
        Duration::from_secs(225),
        Duration::from_secs(225),
        Duration::from_secs(450),
    ];
    let mut total = Duration::ZERO;
    for leg in legs {
        // => checked_add per leg: any overflow would stop the sum loudly
        total = total.checked_add(leg).unwrap_or(Duration::ZERO);
    }
    // => 225 + 225 + 450 is 900: the plan fills its window exactly
    println!("three legs total {}s", total.as_secs());
}

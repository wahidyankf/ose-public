// Example 57: Timers Fire in Order.
//
// A timer wheel holds (deadline, task) pairs and fires the earliest
// first; a BinaryHeap keeps the earliest deadline on top in O(log n) per
// insert. All deadlines here are fixed tick counts from a zero origin
// (never the wall clock), so the firing order is hand-checkable and
// byte-identical on every run.
// => BinaryHeap is a max-heap: Reverse wrappers turn it into a min-heap
// => pop fires the earliest: the transcript is the schedule, executed

use std::cmp::Reverse;
// => Reverse flips Ord: the max-heap fires its minimum first
use std::collections::BinaryHeap;
// => BinaryHeap schedules: O(log n) inserts, earliest tick on top

// Timer pairs a tick deadline with the task name that fires at that tick.
// => Copy keeps the heap mechanics free of ownership ceremony below
// => Ord on (tick, name): earlier ticks fire first, names break ties
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Timer {
    tick: u64,
    name: &'static str,
}

fn main() {
    // => the wheel starts empty: every timer below is scheduled by hand
    let mut wheel: BinaryHeap<Reverse<Timer>> = BinaryHeap::new();
    // => four timers at fixed ticks: warmup, two burns, and cooldown
    // => two share tick 30: the name tiebreak decides their order
    for timer in [
        Timer {
            tick: 630,
            name: "cooldown",
        },
        Timer {
            tick: 30,
            name: "warmup done",
        },
        Timer {
            tick: 330,
            name: "first burn done",
        },
        Timer {
            tick: 30,
            name: "sensors armed",
        },
    ] {
        // => Reverse wraps each push: the smallest tick surfaces to the top
        wheel.push(Reverse(timer));
    }
    // => the firing loop pops until empty: earliest deadline always wins
    // => pop removes the top: the heap reorders behind every firing
    while let Some(Reverse(timer)) = wheel.pop() {
        // => tick and name print per firing: the schedule reads top-down
        println!("tick {}: {}", timer.tick, timer.name);
    }
}

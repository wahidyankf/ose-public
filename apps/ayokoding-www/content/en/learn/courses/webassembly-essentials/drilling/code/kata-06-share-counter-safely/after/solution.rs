// Kata 6 solution: the counter shares through a Cell, by reference.
//
// The meter owns a Cell<u32>; every scorer borrows the meter immutably
// and observes through &, so the call sites name only the score. The
// total reads once at the end, and no value ever travels by hand again.
// => Cell<u32> holds the count: Copy inside, set/get outside, no borrows
// => &self observes: shared handles mutate through the cell, legally

use std::cell::Cell;

// => Cell holds Copy counts: get/set need no borrows at all

// Meter counts observations through shared references only.
// => the count starts at zero: the first observation ticks it to one
struct Meter {
    // => one field: the count lives inside the cell
    count: Cell<u32>,
    // => Cell<u32> ticks legally: set replaces through shared borrows
}

impl Meter {
    // => new builds, observe ticks, total reads: one impl, three jobs
    // => new starts empty: zero observations, ready for every scorer
    fn new() -> Meter {
        // => Cell::new(0) starts the count: zero observations, ready
        Meter {
            count: Cell::new(0),
        }
        // => the cell owns zero: the first observe ticks it to one
    }

    // => &self observes: the shared borrow ticks the cell, no &mut needed
    fn observe(&self, score: u32) {
        // => the score grades elsewhere: the meter counts, nothing more
        let _ = score;
        self.count.set(self.count.get() + 1);
    }

    // => &self totals: the count reads out through the same shared path
    fn total(&self) -> u32 {
        // => get copies out: u32 leaves without disturbing the cell
        self.count.get()
        // => tail returns the count: reading never mutates, even here
    }
}

fn main() {
    // => one meter, three scorers by shared borrow: no threading by hand
    let meter = Meter::new();
    // => each scorer names only its score: the meter travels nowhere
    meter.observe(91);
    meter.observe(77);
    meter.observe(88);
    // => the total reads once: three observations, no value juggling
    println!("observations: {}", meter.total());
}

// Example 52: Interior Mutability Counts Shares.
//
// Sometimes the shape demands mutation through a shared reference:
// counters, caches, and memo tables. Cell and RefCell move the borrow
// check to run time for single-threaded code, trapping on misuse instead
// of refusing to compile. The discipline stays the same: one mutation
// path, checked, with shared handles observing through immutable borrows.
// => Cell for Copy values: get/set replace borrow juggling entirely
// => RefCell for larger values: borrow/borrow_mut enforce the rule at run

use std::cell::{Cell, RefCell};

// => two cells, two sizes: Cell for the counter, RefCell for the log

// Meter counts observations through shared references only.
// => Cell<u32> holds the count: Copy, so get/set need no borrows at all
// => RefCell<Vec<u32>> holds the samples: borrow_mut guards each push
struct Meter {
    // => shared handles observe: no &mut crosses this struct's face
    count: Cell<u32>,
    // => count is Copy: get/set replace the value without borrows
    samples: RefCell<Vec<u32>>,
    // => samples need borrow_mut: Vec is not Copy, so guards apply
}

impl Meter {
    // => one impl, two methods: observe writes, report reads
    // => new starts empty: zero observations, no samples recorded yet
    fn new() -> Meter {
        Meter {
            count: Cell::new(0),
            samples: RefCell::new(Vec::new()),
        }
    }

    // => &self observes: the shared reference mutates through the cells
    fn observe(&self, value: u32) {
        // => Cell::set through a shared borrow: the counter ticks legally
        self.count.set(self.count.get() + 1);
        // => borrow_mut guards the push: a second guard would trap loudly
        self.samples.borrow_mut().push(value);
    }

    // => &self reports: borrowing the samples to read them back out
    fn report(&self) -> String {
        // => borrow() reads: shared with any other reader, never a writer
        let samples = self.samples.borrow();
        format!("{} observations: {samples:?}", self.count.get())
    }
}

fn main() {
    // => three observations, two handles: the count must read 3
    // => one meter, two shared handles: both observe the same counter
    let meter = Meter::new();
    // => both handles borrow immutably: observe mutates through the cells
    let station_a = &meter;
    let station_b = &meter;
    // => three observations across two shared handles: no &mut in sight
    station_a.observe(91);
    station_b.observe(77);
    station_a.observe(88);
    // => the report reads back through the same shared path: 3 samples
    println!("{}", meter.report());
}

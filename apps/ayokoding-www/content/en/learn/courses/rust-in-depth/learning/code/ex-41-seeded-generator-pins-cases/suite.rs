// Example 41: Seeded Generator Pins Cases.
// => A fixed seed replays the same stream on every run, everywhere.
// => The generator is ten lines of wrapping arithmetic: no dependency needed.
// => Range checks over a hundred values beat three hand-picked examples.
// => The file has no `main`: the test harness provides the entry point.
struct Seeded {
    // => the tiny generator state: one number
    state: u64, // => the evolving seed, mutated per draw
}
impl Seeded {
    // => construction plus one draw method
    fn new(seed: u64) -> Seeded {
        // => the fixed starting point
        Seeded { state: seed } // => every stream replays from here
    }
    // => `next` advances the state and returns a bounded amount.
    // => `&mut self` borrows the generator mutably: draws mutate the stream.
    // => The return range is the dues range: callers never clamp again.
    fn next(&mut self) -> i32 {
        // => dues between 1 and 1000 inclusive
        self.state = self
            .state // => wrapping arithmetic: overflow is the point
            .wrapping_mul(6364136223846793005) // => the standard multiplier
            .wrapping_add(1442695040888963407); // => the standard increment
        (self.state % 1000) as i32 + 1 // => fold the stream into dues range
    }
}
#[cfg(test)] // => test-only from here down
mod tests {
    // => the suite: stream facts plus one replay fact
    use super::*; // => `Seeded` is in scope
    #[test] // => a hundred draws stay inside the dues range
            // => Each draw asserts on the spot: the first failure names its value.
    fn hundred_draws_stay_in_range() {
        // => the property under test
        let mut rng = Seeded::new(42); // => the fixed seed: replayable forever
        for _ in 0..100 {
            // => a hundred draws, each one checked
            let due = rng.next(); // => one pseudo-random due
            assert!((1..=1000).contains(&due), "due in range: {}", due); // => names the draw
        }
    }
    #[test] // => the same seed replays the same first draw, always
    fn seed_replays_first_draw() {
        // => determinism itself, pinned
        assert_eq!(Seeded::new(42).next(), Seeded::new(42).next()); // => two streams agree
    }
}

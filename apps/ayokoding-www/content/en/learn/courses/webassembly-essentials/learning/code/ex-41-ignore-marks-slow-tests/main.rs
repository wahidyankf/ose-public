// Example 41: Ignore Marks Slow Tests.
//
// The full suite must stay fast enough to run on every save; the overnight
// case gets #[ignore] so ordinary runs skip it, and the night run invokes
// it alone. The golden below records the default run: two fast tests pass
// and the ignored one reports as ignored, deterministically, on every run.
// => ignore is a schedule, not a deletion: the test still exists and runs
// => the default run prints the ignored count: skipping stays visible

// fib computes the nth Fibonacci number with plain recursion, on purpose.
// => exponential and proud: the ignored test below needs the slowness
// => small inputs stay instant: the default suite never waits on fib
fn fib(n: u32) -> u64 {
    // => u32 in, u64 out: fib(28) needs the wider return
    // => the two base cases terminate the recursion: 0 and 1 are fixed
    if n < 2 {
        return n as u64;
    }
    // => the recursive case doubles the work: slow by design, see below
    fib(n - 1) + fib(n - 2)
    // => two calls halve nothing: the tree doubles every level down
}

// => cfg(test) splits the suite: two fast tests run always, one on demand
#[cfg(test)]
mod tests {
    // => three tests, two schedules: default runs two, night runs all
    // => super::* imports fib: both schedules test the same function
    use super::*;

    // => the base cases pin the recursion's floor: fast and always run
    #[test]
    fn fib_base_cases() {
        // => fib(0) is 0 and fib(1) is 1: the recursion ends here, always
        assert_eq!(fib(0), 0);
        assert_eq!(fib(1), 1);
    }

    // => a small step pins the recurrence: fib(10) is 55 by hand addition
    #[test]
    fn fib_ten_is_55() {
        // => fast enough for every save: 10 needs only a hundred calls
        assert_eq!(fib(10), 55);
    }

    // => the overnight case: fib(28) runs long, so it runs on demand
    #[test]
    #[ignore]
    fn fib_twenty_eight_is_slow() {
        // => the name says slow: the schedule, not the code, is the point
        // => 317811 is fib(28): checked once, pinned here for the night run
        assert_eq!(fib(28), 317811);
    }
}

fn main() {
    // => the demo stays fast: fib(10) prints instantly, always
    // => the binary shows the fast values the default suite pins above
    println!("fib(10) = {}", fib(10));
    // => 55 prints: the same value the suite pins above
}

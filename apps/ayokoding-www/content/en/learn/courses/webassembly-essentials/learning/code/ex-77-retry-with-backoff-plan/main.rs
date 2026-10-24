// Example 77: Retry with a Backoff Plan.
//
// Read this like an SRE: the plan lists each attempt with its delay, the
// delays grow exponentially with a cap, and the transcript shows which
// attempt finally succeeds against a fixed script of failures. No thread
// sleeps here: the plan computes delays as data (Duration values), and a
// real runner would sleep them; the survey executes the decision, not the
// waiting, so every run prints the identical schedule.
// => delays are data: the plan prints seconds, nobody sleeps in the survey
// => the cap bounds the worst wait: growth stops at 30 seconds, by policy

use std::time::Duration;

// => Duration is data: the survey prints seconds, never sleeps

// Attempt pairs its 1-based number with the delay that precedes it.
// => delay zero on the first attempt: the first try never waits
// => Copy keeps the schedule mechanics free of borrow ceremony below
#[derive(Debug, Clone, Copy)]
struct Attempt {
    // => two fields: which try, and how long it waited
    number: u32,
    // => 1-based numbering: attempt 1 never waited, humans count from one
    delay: Duration,
    // => delay precedes the try: the wait before this attempt, as data
}

// plan builds the attempt schedule: exponential growth capped at 30s.
// => base 1s doubling: 0, 1, 2, 4, 8, 16, then the cap holds every step
// => max_attempts bounds the script: the survey never plans forever
fn plan(max_attempts: u32) -> Vec<Attempt> {
    // => owned schedule leaves: the caller owns every attempt below
    // => the schedule starts empty: attempt 1 appends with zero delay
    let mut attempts: Vec<Attempt> = Vec::new();
    // => delay doubles per attempt: 1s after the first, capped at 30s
    let mut delay = Duration::ZERO;
    // => zero starts the doubling: the first attempt waits nothing
    for number in 1..=max_attempts {
        // => 1..= includes the last: max_attempts tries, exactly
        attempts.push(Attempt { number, delay });
        // => push before growing: the stored delay is the wait just scheduled
        // => first wait is 1s, then doubling saturates at the policy cap
        delay = if delay.is_zero() {
            // => zero means first: the second attempt waits one second
            Duration::from_secs(1)
        } else {
            (delay + delay).min(Duration::from_secs(30))
            // => double then cap: growth stops at the 30s policy ceiling
        };
    }
    // => the full schedule returns: run plays the script against it below
    attempts
}

// run plays the fixed failure script against the plan and reports.
// => script lists per-attempt outcomes: false fails, true succeeds here
// => the first true ends the run: later attempts never execute at all
fn run(script: &[bool]) -> Vec<String> {
    // => the transcript starts empty: each attempt appends its own line
    let mut transcript: Vec<String> = Vec::new();
    // => the plan and the script align by index: attempt n reads script[n-1]
    for attempt in plan(script.len() as u32) {
        // => the delay prints in seconds: data, not sleeping, as promised
        let outcome = script[(attempt.number - 1) as usize];
        if outcome {
            // => success ends the run: the transcript shows the winning delay
            transcript.push(format!(
                "attempt {} after {}s: ok",
                attempt.number,
                attempt.delay.as_secs()
            ));
            break;
        }
        // => failure schedules the next attempt: the delay column grows
        transcript.push(format!(
            "attempt {} after {}s: failed",
            attempt.number,
            attempt.delay.as_secs()
        ));
    }
    transcript
}

fn main() {
    // => the fixed script: two failures, then success on the third attempt
    for line in run(&[false, false, true, true]) {
        println!("{line}");
    }
}

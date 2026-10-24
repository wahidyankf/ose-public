// Example 56: Select Polls Two Sources.
//
// Select waits on several channels at once and serves whichever speaks
// first; without threads, the survey polls two iterators round-robin and
// serves each ready item in turn. The discipline is identical (fairness
// across sources, no starvation), only the waiting becomes explicit polling.
// => round-robin is fair: sources alternate, neither waits past its turn
// => iterators model channels here: next() is the non-blocking poll

fn main() {
    // => two fixed sources: odds from roster A, evens from roster B
    // => into_iter moves the arrays: no borrow outlives the poll loop
    let mut roster_a = [91u32, 77, 58].into_iter();
    let mut roster_b = [88u32, 95, 62].into_iter();
    // => served collects the interleaved transcript: A, B, A, B, A, B
    let mut served: Vec<u32> = Vec::new();
    // => the poll loop runs while either source still has items to serve
    loop {
        // => poll A first: its next item serves before B's on every round
        let next_a = roster_a.next();
        // => poll B second: fairness means B never waits more than one turn
        let next_b = roster_b.next();
        // => both exhausted ends the loop: the survey served everything
        if next_a.is_none() && next_b.is_none() {
            break;
        }
        // => serve A's item when present: the transcript keeps round order
        if let Some(score) = next_a {
            served.push(score);
        }
        // => serve B's item when present: no source starves the other
        // => order within rounds is fixed: A before B, every round the same
        if let Some(score) = next_b {
            served.push(score);
        }
    }
    // => interleaved in rounds: 91, 88, 77, 95, 58, 62, every round fair
    println!("served: {served:?}");
}

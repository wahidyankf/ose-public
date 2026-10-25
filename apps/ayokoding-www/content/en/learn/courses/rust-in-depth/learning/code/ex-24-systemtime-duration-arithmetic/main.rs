// Example 24: SystemTime and Duration Arithmetic.
// => Fixed instants from `UNIX_EPOCH`: no clock reads, fully deterministic.
// => `checked_add` returns `None` on overflow instead of wrapping silently.
// => `duration_since` orders two instants and reports the span between them.
use std::time::{Duration, UNIX_EPOCH}; // => the epoch anchor and time spans
fn main() {
    // => the invoice lands exactly one day after the epoch, by construction.
    let invoice = UNIX_EPOCH + Duration::from_secs(86_400); // => day one, fixed
                                                            // => the payment window is thirty days: dues settle within a month.
    let window = Duration::from_secs(30 * 86_400); // => thirty days as seconds
                                                   // => the deadline adds the window; overflow would be `None`, not garbage.
    let deadline = invoice.checked_add(window).expect("far from overflow"); // => day thirty-one
                                                                            // => the span between deadline and invoice is the window itself.
    let span = deadline.duration_since(invoice).expect("deadline is later"); // => ordered pair
                                                                             // => fixed figures: thirty days is 2,592,000 seconds, printed three ways.
    println!("days: {}", span.as_secs() / 86_400); // => Output: days: 30
    println!("secs: {}", span.as_secs()); // => Output: secs: 2592000
    println!(
        "deadline after epoch: {}",
        deadline
            .duration_since(UNIX_EPOCH)
            .expect("later")
            .as_secs()
    ); // => Output: deadline after epoch: 2678400
}

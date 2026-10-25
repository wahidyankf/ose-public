// Example 25: Human Duration Formatting.
// => `as_secs` is the whole span in seconds: divide and take remainders.
// => One pure function renders any fixed span; the table below proves it.
// => No clock, no locale, no now: rendering stays a pure computation.
use std::time::Duration; // => the span type being rendered
                         // => Break a span into day, hour, minute, second parts for display.
fn human(span: Duration) -> String {
    // => pure: same input, same string
    let total = span.as_secs(); // => whole seconds: sub-second parts ignored
    let days = total / 86_400; // => full days first
    let hours = (total % 86_400) / 3_600; // => leftover hours next
    let minutes = (total % 3_600) / 60; // => leftover minutes next
    let seconds = total % 60; // => the final remainder
                              // => one fixed shape: always four parts, always the same order.
    format!("{}d {}h {}m {}s", days, hours, minutes, seconds) // => e.g. 1d 2h 3m 4s
}
fn main() {
    // => three fixed spans exercise days, hours, and the zero corner.
    println!("{}", human(Duration::from_secs(90_061))); // => Output: 1d 1h 1m 1s
    println!("{}", human(Duration::from_secs(3_600))); // => Output: 0d 1h 0m 0s
    println!("{}", human(Duration::ZERO)); // => Output: 0d 0h 0m 0s
}

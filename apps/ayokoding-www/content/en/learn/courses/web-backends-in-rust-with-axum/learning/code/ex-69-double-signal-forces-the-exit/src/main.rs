// Example 69: Double Signal Forces the Exit.
// the first SIGTERM drains gracefully; the second SIGTERM skips the wait.
use tokio::sync::mpsc; // => mpsc carries the two signals in arrival order

#[tokio::main] // => the async runtime drives the double-signal demo
async fn main() {
    // => the channel carries both signals: graceful first, forced second
    let (sig_tx, mut sig_rx) = mpsc::channel::<&str>(2); // => room for two: no send ever waits
    // => the platform delivers SIGTERM twice: patience, then insistence
    sig_tx.send("SIGTERM").await.unwrap(); // => first signal: drain gracefully
    // => the operator loses patience and sends SIGTERM again
    sig_tx.send("SIGTERM").await.unwrap(); // => second signal: stop waiting, exit now
    // => the sender drops: the loop below ends after the second signal
    drop(sig_tx); // => closing the channel bounds the signal loop
    // => the service reads its signals in order and answers each one
    let mut seen = 0; // => counts the signals: one means drain, two means force
    // => recv returns each signal in arrival order until the channel closes
    while let Some(signal) = sig_rx.recv().await {
        // => two iterations, then None ends the loop
        // => count first: the arm below branches on first versus second
        seen += 1; // => 1 for graceful, 2 for forced
        // => the first signal starts the graceful drain with its deadline
        if seen == 1 {
            println!("{signal} #1: draining with a deadline");
            continue;
        } // => golden line one: patience starts
        // => the second signal skips the wait: the exit is immediate
        println!("{signal} #2: deadline skipped; forcing the exit"); // => golden line two: patience ends
    } // => loop ends: the channel closed after two signals
    // => one golden line: the forced exit after two signals, printed last
    println!("exited after {seen} signals: graceful first, forced second"); // => the double-signal contract in one line
} // => main ends: drained once, forced once, so the run is green

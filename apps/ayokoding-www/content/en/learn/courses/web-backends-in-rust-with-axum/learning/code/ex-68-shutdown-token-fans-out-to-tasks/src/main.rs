// Example 68: Shutdown Token Fans Out to Tasks.
// one watch sender retires three workers: every receiver sees the same flip.
use tokio::sync::watch; // => watch broadcasts the single retirement flip to every worker

// => worker waits for the flip, then prints its own stop line
async fn worker(n: usize, mut stop: watch::Receiver<bool>) -> String {
    // => changed waits for the next flip: the retirement broadcast
    let _ = stop.changed().await; // => Err would mean the sender dropped: still a stop
    // => the line carries the worker number so the sort below orders the goldens
    format!("worker-{n} stopped") // => returned, not printed: the collector prints below
} // => worker ends: one flip in, one stop line out

#[tokio::main] // => the async runtime drives the fan-out demo
async fn main() {
    // => the channel starts unretired: false means serve, true means stop
    let (stop_tx, stop_rx) = watch::channel(false); // => one sender, three receivers below
    // => spawn three workers; each watches the same retirement flip
    let mut tasks = Vec::new(); // => the stop lines gather here
    // => three workers stand in for three background loops at SIGTERM
    for n in 1..=3 {
        // => worker 1 through 3, in spawn order
        // => each worker subscribes to the same broadcast
        let rx = stop_rx.clone(); // => cheap clone: receivers share the channel
        // => spawn runs the worker on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { worker(n, rx).await })); // => three waiters, one flip coming
    } // => spawn loop ends: all three workers are waiting now
    // => the original receiver stays unused: drop it so only workers remain
    drop(stop_rx); // => the sender outlives this handle; workers hold the rest
    // => SIGTERM lands: one send retires every worker at once
    stop_tx.send(true).unwrap(); // => the fan-out in one broadcast
    // => one golden line: the flip itself, printed as the retirement marker
    println!("signal received: SIGTERM; broadcast stop to 3 workers"); // => retirement fans out from here
    // => join every worker and collect the three stop lines
    let mut lines = Vec::new(); // => the lines land in wake order, not worker order
    // => await each handle; every worker stopped, none is dropped
    for task in tasks {
        lines.push(task.await.unwrap());
    } // => unwrap: a stuck worker fails the run loudly
    // => sort makes the fan-out golden-stable: the same three lines, every run
    lines.sort(); // => worker-1 through worker-3, regardless of wake order
    // => print the stop lines: the proof every worker saw the flip
    for line in lines {
        println!("{line}");
    } // => three stopped lines after the signal line
} // => main ends: one flip, three stops, so the run is green

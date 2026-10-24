// Example 55: Channel Collects, Sort Pins Order.
// => `mpsc::channel` moves values from senders to one receiver.
// => Cloned senders let many workers share the same channel.
// => Arrival order races: collect everything, then sort for the transcript.
// => Moving every sender into a worker ends the stream when workers end.
use std::sync::mpsc; // => the channel ends live here
use std::thread; // => two workers run below
fn main() {
    // => six fixed dues split across two workers: evens and odds.
    let (send, recv) = mpsc::channel(); // => the shared results channel
    let second = send.clone(); // => worker two gets its own sender
                               // => worker one doubles the first three dues, then its sender drops.
    thread::spawn(move || {
        // => owns `send`: sends 2, 4, 6
        for due in [1, 2, 3] {
            // => fixed inputs, fixed outputs
            send.send(due * 2).expect("receiver outlives workers"); // => never fails here
        }
    });
    // => worker two doubles the last three dues, then its sender drops.
    thread::spawn(move || {
        // => owns `second`: sends 8, 10, 12
        for due in [4, 5, 6] {
            // => fixed inputs, fixed outputs
            second.send(due * 2).expect("receiver outlives workers"); // => never fails here
        }
    });
    // => both senders moved into workers: the channel closes when they finish.
    // => No handle remains in `main`: the end of work needs no sentinel value.
    // => the loop ends when both workers finish: no sentinel needed.
    let mut doubled: Vec<i32> = recv.iter().collect(); // => all six, arrival order
    doubled.sort(); // => sorting pins the transcript: 2 through 12 even
    println!("{:?}", doubled); // => Output: [2, 4, 6, 8, 10, 12]
}

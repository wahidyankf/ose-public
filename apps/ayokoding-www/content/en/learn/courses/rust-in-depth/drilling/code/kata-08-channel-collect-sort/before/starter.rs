// Kata 08 Before: printing on arrival follows scheduler luck.
// => Each `println!` runs when its worker sends: order varies by machine.
// => The task: collect all six results, sort them, then print the fixed order.
// => Two workers double six dues: the values are fixed, the order is not.
use std::sync::mpsc; // => the channel both workers share
use std::thread; // => two workers, one racy transcript
fn main() {
    // => six fixed dues across two workers: values fixed, arrival random.
    let (send, recv) = mpsc::channel(); // => the shared results channel
    let second = send.clone(); // => worker two gets its own sender
    thread::spawn(move || {
        // => owns `send`: evens arrive first, usually
        for due in [1, 2, 3] {
            // => fixed inputs
            send.send(due * 2).expect("receiver lives"); // => 2, 4, 6 sent
        }
    });
    thread::spawn(move || {
        // => owns `second`: odds arrive second, usually
        for due in [4, 5, 6] {
            // => fixed inputs
            second.send(due * 2).expect("receiver lives"); // => 8, 10, 12 sent
        }
    });
    // => Racy on purpose: this transcript is what the kata learns to pin.
    for doubled in recv.iter() {
        // => arrival order: usually sorted, not promised
        println!("{}", doubled); // => racy transcript: the habit being replaced
    }
    // => Two workers, one printer: the interleaving is scheduler luck.
    // => Collect-then-sort is the fix: the after file proves it below.
}

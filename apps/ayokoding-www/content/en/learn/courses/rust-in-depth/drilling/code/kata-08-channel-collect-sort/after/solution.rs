// Kata 08 After: collect everything, sort, then print the pinned order.
// => The channel still races: collection absorbs the nondeterminism.
// => `sort` pins the transcript: 2 through 12 even, on every machine.
// => Same workers, same values: only the observation order changed.
// => Sorting after joining is the deterministic concurrency habit.
use std::sync::mpsc; // => the same channel shape as the starter
use std::thread; // => the same two workers as the starter
fn main() {
    // => identical workers to the starter: values fixed, arrival still racy.
    let (send, recv) = mpsc::channel(); // => the shared results channel
    let second = send.clone(); // => worker two gets its own sender
    thread::spawn(move || {
        // => owns `send`: sends 2, 4, 6
        for due in [1, 2, 3] {
            // => fixed inputs
            send.send(due * 2).expect("receiver lives"); // => never fails here
        }
    });
    thread::spawn(move || {
        // => owns `second`: sends 8, 10, 12
        for due in [4, 5, 6] {
            // => fixed inputs
            second.send(due * 2).expect("receiver lives"); // => never fails here
        }
    });
    // => collect all six first: the loop ends when both workers finish.
    let mut doubled: Vec<i32> = recv.iter().collect(); // => arrival order inside
    doubled.sort(); // => pinning step: order decided, not observed
                    // => Six values, one order: the sort above is the whole difference.
    for value in doubled {
        // => the fixed transcript below, every run
        println!("{}", value); // => 2, 4, 6, 8, 10, 12 in order
    }
}

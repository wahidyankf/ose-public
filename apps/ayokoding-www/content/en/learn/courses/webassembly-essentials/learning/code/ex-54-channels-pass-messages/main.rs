// Example 54: Channels Pass Messages.
//
// A channel decouples the producer from the consumer: senders push values
// in, receivers pull them out, and the queue in between absorbs bursts.
// This survey runs both ends on one thread (the pinned runtime has no
// threads; Example 60 proves the boundary), which is exactly how you test
// channel logic before threading enters the picture.
// => mpsc means many producers, one consumer: the common fan-in shape
// => try_recv never blocks: the survey polls, never parks, by design

use std::sync::mpsc;

// collect_grades drains every queued grade into a vector, in send order.
// => try_recv loops until Empty: no blocking call exists in this survey
// => Disconnected ends the drain: dropping the sender closes the channel
fn collect_grades(rx: mpsc::Receiver<u32>) -> Vec<u32> {
    // => the drain starts empty: each received grade appends in order
    let mut grades = Vec::new();
    // => loop until the channel reports Empty or Disconnected, then stop
    loop {
        match rx.try_recv() {
            // => a queued grade appends: order matches the sends below
            Ok(grade) => grades.push(grade),
            // => Empty means drained for now: the survey stops polling here
            Err(mpsc::TryRecvError::Empty) => break,
            // => Disconnected means senders are gone: the drain is final
            Err(mpsc::TryRecvError::Disconnected) => break,
        }
    }
    grades
}

fn main() {
    // => the channel pairs one sender with one receiver for this survey
    let (tx, rx) = mpsc::channel();
    // => three sends queue three grades: the buffer holds all of them
    for grade in [91u32, 77, 88] {
        // => the send cannot fail here: the receiver outlives the sends
        let _ = tx.send(grade);
    }
    // => dropping the sender closes the channel: the drain sees the end
    drop(tx);
    // => the drain prints in send order: channels preserve what they carry
    println!("grades: {:?}", collect_grades(rx));
}

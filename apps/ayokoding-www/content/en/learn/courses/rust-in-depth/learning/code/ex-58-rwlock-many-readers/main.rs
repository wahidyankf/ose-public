// Example 58: RwLock Serves Many Readers.
// => Many `read` guards coexist: readers never block each other.
// => `write` waits for solitude: the update sees a stable world.
// => Sequencing joins before the write pins the transcript: read, then update.
// => The rate below moves once, after the readers finish: fixed story, fixed output.
use std::sync::{Arc, RwLock}; // => the shared rate lives behind this lock
use std::thread; // => three readers run below
fn main() {
    // => the published settlement rate starts at two percent, shared widely.
    let rate = Arc::new(RwLock::new(2)); // => one rate, many future readers
    let mut handles = Vec::new(); // => join all readers before the update
    for id in 0..3 {
        // => three identical readers, numbered for the transcript
        let reader = Arc::clone(&rate); // => each reader owns a handle
        handles.push(thread::spawn(move || {
            // => `move` carries handle and id
            // => the read guard lives for the copy: shared, never exclusive.
            let seen = *reader.read().expect("no writer yet"); // => all three see 2
            (id, seen) // => the thread returns its numbered observation
        }));
    }
    // => collect and sort: reader finish order races, observation order does not.
    let mut seen: Vec<(i32, i32)> = handles // => move the handles into the pipeline
        .into_iter() // => consume the vector in spawn order
        .map(|h| h.join().expect("readers never panic")) // => each returns its pair
        .collect(); // => three pairs, arrival order
    seen.sort(); // => sort by id: the transcript reads 0, 1, 2 always
    for (id, value) in seen {
        // => the pinned observation order
        println!("reader {} saw {}", id, value); // => all three saw 2
    }
    // => the writer moves only after every reader joined: solitude guaranteed.
    *rate.write().expect("readers all joined") = 3; // => the single update
    println!("rate now {}", rate.read().expect("writer finished")); // => Output: rate now 3
}

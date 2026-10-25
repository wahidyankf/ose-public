// Example 55: Workers Share a Queue.
//
// A worker pool is a queue plus a draining loop: tasks wait in order,
// each is claimed once, and results land in completion order. This survey
// models the pool on one thread with a VecDeque, so the transcript shows
// the claiming discipline (pop_front, process, record) that real threaded
// pools follow, minus the threads the runtime cannot host.
// => VecDeque pops the front in O(1): the queue never reorders the work
// => results carry their task id: the audit trail survives any order

use std::collections::VecDeque;

// => VecDeque is the queue: O(1) pops from the front, forever

// Task pairs an id with the score it asks the pool to grade.
// => Copy keeps the queue mechanics free of borrow bookkeeping below
// => the id rides along: results name their task no matter the order
#[derive(Debug, Clone, Copy)]
struct Task {
    // => two plain numbers: the id audits, the score grades
    id: u32,
    // => ids arrive in order: 1 through 4, the audit trail's backbone
    score: u32,
    // => scores span the bands: A, F, C, B across the four tasks
}

// grade_task renders one graded line for a claimed task, like Example 31.
// => pure function of the task: workers share no state through this call
fn grade_task(task: Task) -> String {
    // => Task by value: Copy makes claiming cost nothing
    let letter = match task.score {
        // => the band table again: workers grade like every example before
        90..=100 => 'A',
        80..=89 => 'B',
        70..=79 => 'C',
        60..=69 => 'D',
        _ => 'F',
        // => the catch-all closes the scale: below 60 is F
    };
    format!("task {}: {} ({letter})", task.id, task.score)
    // => id plus score plus band: the record the audit trail keeps
}

fn main() {
    // => four tasks in, four lines out: the pool drains completely
    // => the queue holds four tasks in arrival order: ids 1 through 4
    let mut queue: VecDeque<Task> = [
        // => array literal first: into_iter().collect() builds the queue
        Task { id: 1, score: 91 },
        // => task 1 grades A: the head of the queue, claimed first
        Task { id: 2, score: 58 },
        // => task 2 grades F: the middle still keeps its order
        Task { id: 3, score: 77 },
        // => task 3 grades C: order, not grade, decides the claim sequence
        Task { id: 4, score: 88 },
        // => task 4 grades B: the tail waits its turn, like a real queue
    ]
    .into_iter()
    .collect();
    // => the results start empty: each claimed task appends its line here
    let mut done: Vec<String> = Vec::new();
    // => the worker loop claims from the front until nothing remains
    while let Some(task) = queue.pop_front() {
        // => pop_front claims: O(1), and the queue shrinks honestly
        // => claim, process, record: the three steps every pool repeats
        done.push(grade_task(task));
    }
    // => the queue drains fully: four claims, four records, nothing left
    println!("queue left: {}", queue.len());
    // => zero must print: anything left means a task was dropped
    // => results print in claim order: the transcript is the audit trail
    for line in done {
        println!("{line}");
    }
}

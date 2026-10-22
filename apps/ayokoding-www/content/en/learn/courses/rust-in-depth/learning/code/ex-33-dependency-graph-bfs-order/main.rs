// Example 33: Dependency Graph in BFS Order.
// => The graph is data: each package names the packages it needs.
// => Breadth-first order builds neighbors before their dependents.
// => The fixed graph below always walks the same order, every run.
// => Real build tools walk this same order over the real resolved tree.
use std::collections::{HashMap, VecDeque}; // => adjacency plus a work queue
                                           // => `order` walks from the root and returns each package exactly once.
fn order(graph: &HashMap<&str, Vec<&str>>, root: &str) -> Vec<String> {
    // => build sequence
    let mut seen = Vec::new(); // => the finished order, each package once
                               // => The queue holds the frontier: pop the front, push neighbors at the back.
    let mut queue = VecDeque::from([root]); // => start with the root package
    while let Some(name) = queue.pop_front() {
        // => oldest queued first
        if seen.iter().any(|s: &String| s == name) {
            // => skip already ordered
            continue; // => `num-core` is needed twice but builds once
        }
        seen.push(name.to_string()); // => record before queueing neighbors
        if let Some(next) = graph.get(name) {
            // => the package's own needs
            for dep in next {
                // => neighbors join the back of the queue
                queue.push_back(dep); // => breadth-first: level by level
            }
        }
    }
    seen // => root first here; builds run this list in reverse
}
fn main() {
    // => the fixed graph: root needs two kits, both need one shared core.
    let graph: HashMap<&str, Vec<&str>> = HashMap::from([
        // => adjacency data
        ("dues-ledger", vec!["ledger-kit", "audit-trail"]), // => root needs two
        ("ledger-kit", vec!["num-core"]),                   // => kit needs the core
        ("audit-trail", vec!["num-core"]),                  // => trail needs the same core
        ("num-core", vec![]),                               // => the core needs nothing
    ]);
    // => the walk order below is fixed: root, kits, then the shared core.
    // => `num-core` appears twice as a need but prints once: `seen` dedupes.
    for name in order(&graph, "dues-ledger") {
        // => each package exactly once
        println!("{}", name); // => dues-ledger, ledger-kit, audit-trail, num-core
    }
}

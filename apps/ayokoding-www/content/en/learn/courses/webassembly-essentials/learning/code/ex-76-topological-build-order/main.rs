// Example 76: Topological Build Order.
//
// Read this like a build engineer: crates list their dependencies, and
// the sorter emits an order where every dependency precedes its dependent.
// Depth-first search marks visiting nodes on the stack: revisiting one
// names the cycle instead of looping forever, and sorted iteration keeps
// the whole transcript byte-identical.
// => visiting marks the stack: a second visit to a marked node is the cycle
// => done marks the finished: each crate emits exactly once, dependencies first

use std::collections::HashMap;

// => HashMap is the graph: crates map to their dependency lists

// order sorts crates so dependencies build before their dependents.
// => graph maps each crate to the deps it names: the input contract
// => Ok carries the build order: Err names the cycle that blocks building
fn order<'a>(graph: &'a HashMap<&'a str, Vec<&'a str>>) -> Result<Vec<&'a str>, String> {
    // => lifetimes tie outputs to input: names borrow the graph, never copy
    // => done collects the finished: each crate appends once, in build order
    let mut done: Vec<&'a str> = Vec::new();
    // => done borrows names: the order references the graph's own strings
    // => visiting holds the stack: membership here means "cycle" on revisit
    let mut visiting: Vec<&'a str> = Vec::new();
    // => the stack borrows too: cycle paths quote the graph's names
    // => finished skips rework: shared dependencies visit once, not per parent
    let mut finished: Vec<&'a str> = Vec::new();
    // => finished borrows as well: all three lists share one lifetime

    // => visit walks one crate depth-first: deps first, then the crate itself
    fn visit<'a>(
        // => nested fn threads the stacks: &mut params carry the state along
        name: &'a str,
        // => the crate under visit: borrowed, never owned, throughout
        graph: &'a HashMap<&'a str, Vec<&'a str>>,
        // => the whole graph threads through: lookups borrow, always
        done: &mut Vec<&'a str>,
        // => done threads mutably: every finished crate appends here
        visiting: &mut Vec<&'a str>,
        // => the stack threads mutably: push on entry, remove on exit
        finished: &mut Vec<&'a str>,
        // => finished threads mutably: visited crates never revisit
    ) -> Result<(), String> {
        // => unit success: results accumulate in done, not the return
        // => finished crates return at once: the diamond stays linear
        if finished.contains(&name) {
            // => contains asks membership: linear scan, tiny graphs, honest
            return Ok(());
            // => nothing to redo: shared deps return without appending again
        }
        // => a stack revisit names the cycle: the path shows the loop
        if visiting.contains(&name) {
            // => the stack asks second: finished first, visiting next, in order
            // => the cycle prints from the stack: every member is implicated
            return Err(format!("cycle through {name}: {visiting:?}"));
            // => {visiting:?} quotes the path: the loop reads in stack order
        }
        // => push before descending: descendants see this crate as visiting
        visiting.push(name);
        // => push marks entry: descendants now see this crate as visiting
        // => unknown crates count as leaves: the graph may omit std crates
        if let Some(deps) = graph.get(name) {
            // => get borrows the deps: unknown crates skip to the leaves below
            // => sorted descent: siblings visit alphabetically, deterministically
            let mut ordered = deps.clone();
            // => clone to sort: the graph's own order stays untouched
            ordered.sort();
            // => byte order descent: siblings visit alphabetically, always
            for dep in ordered {
                // => recursion descends: each dep visits before its parent
                visit(dep, graph, done, visiting, finished)?;
                // => ? bubbles cycles: a deep loop aborts the whole order
            }
        }
        // => pop after descending: the crate leaves the stack finished
        visiting.retain(|stacked| *stacked != name);
        // => retain drops the name: the stack forgets on the way out
        finished.push(name);
        // => finished records: the next visit returns early above
        // => deps appended first: this crate lands after everything it needs
        done.push(name);
        Ok(())
    }

    // => sorted roots: entry order never depends on hash iteration
    let mut roots: Vec<&'a str> = graph.keys().copied().collect();
    // => keys copied out: &str is Copy, roots borrow nothing new
    roots.sort();
    // => roots sort too: diamond graphs start deterministically
    for root in roots {
        // => every root visits: disconnected crates still build
        visit(root, graph, &mut done, &mut visiting, &mut finished)?;
        // => ? ends on first cycle: one loop refuses the whole graph
    }
    Ok(done)
    // => done returns in build order: the transcript prints it whole
}

fn main() {
    // => two graphs: one builds, one refuses with its cycle named
    // => the clean graph: app needs ui and store; ui needs store; store stands alone
    let mut clean: HashMap<&str, Vec<&str>> = HashMap::new();
    clean.insert("app", vec!["ui", "store"]);
    clean.insert("ui", vec!["store"]);
    clean.insert("store", vec![]);
    // => store builds first, then ui, then app: dependencies precede dependents
    match order(&clean) {
        Ok(sequence) => println!("build: {sequence:?}"),
        Err(reason) => println!("refused: {reason}"),
    }
    // => the cyclic graph: a needs b, b needs a, and neither can go first
    let mut cyclic: HashMap<&str, Vec<&str>> = HashMap::new();
    cyclic.insert("a", vec!["b"]);
    cyclic.insert("b", vec!["a"]);
    // => the cycle refuses with its members named: a and b implicate each other
    match order(&cyclic) {
        Ok(sequence) => println!("build: {sequence:?}"),
        Err(reason) => println!("refused: {reason}"),
    }
}

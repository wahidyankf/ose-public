// Example 51: Clone Duplicates Explicitly.
//
// Clone is a cost you can see: the call site says "copy this now", so
// expensive duplicates never hide inside innocent-looking assignment.
// Cheap types implement Copy (integers, bools, shared references) and
// copy implicitly; everything else moves unless .clone() says otherwise.
// => Clone is opt-in sharing: the method call marks the allocation
// => Copy is implicit only for stack-sized scalars: the trait list says so

// duplicate_tags renders each roster name with its graded suffix, keeping originals.
// => &[String] borrows the roster: the clones are the only new allocations
// => iter-map-collect is the visible duplication idiom, in full
fn duplicate_tags(roster: &[String]) -> Vec<String> {
    roster
        .iter()
        // => format! builds the tagged copy: the original is only borrowed
        .map(|name| format!("{name}-graded"))
        .collect()
}

fn main() {
    // => scores are Copy: assignment duplicates without a single call
    let score = 91u32;
    // => curved copies the bits: score stays usable on the next line
    let curved = score + 5;
    // => both print: Copy types never retire their source names
    println!("score {score} curves to {curved}");
    // => roster names are not Copy: only explicit clones duplicate them
    let roster = vec![String::from("sari"), String::from("budi")];
    // => the tagged copies print: originals remain untouched in roster
    println!("tagged: {:?}", duplicate_tags(&roster));
    // => one deliberate clone feeds the greeting: the cost is on the surface
    let greeting = format!("hello, {}!", roster[0].clone());
    // => roster survives: the single clone above was the only duplication
    println!("{greeting} roster intact: {roster:?}");
}

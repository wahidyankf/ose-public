// Example 4: Loops Return Values.
//
// Rust loops are expressions: loop can break with a value, while guards
// each step, and for walks any iterator, so counting, searching, and
// repeating each pick the loop shape that shows its own exit condition.
// => prefer the loop whose exit condition is visible in its own header
// => break with a value turns a search into an expression, not a flag

fn main() {
    // => block plus loop: the search reads as one value-producing unit
    // => the block scopes the counter: n never leaks into the code below
    let first_big = {
        // => a mutable counter drives the search upward from 1
        let mut n = 1u32;
        loop {
            // => square before comparing: the check reads the real value
            let square = n * n;
            // => break carries the answer out: no flag variable needed
            if square > 50 {
                break square;
            }
            // => only reached while the answer is still too small
            n += 1;
        }
    };
    // => 8 is the first n with n*n above 50, so 64 always prints
    // => the block evaluates to the break value: first_big needs no mut
    println!("first square above 50: {first_big}");
    // => while guards a countdown: the condition is the whole story
    // => no initializer beyond fuel: the condition carries the whole loop
    let mut fuel = 3u32;
    while fuel > 0 {
        // => print-then-decrement keeps the trace in countdown order
        println!("fuel: {fuel}");
        fuel -= 1;
        // => decrement, not reset: the loop counts down to zero exactly
    }
    // => for walks a range: no index variable to initialize or forget
    // => 1..=5 is inclusive on both ends: five iterations, never six
    let mut total = 0u32;
    for n in 1..=5 {
        // => accumulation is the only statement: the loop adds, nothing else
        total += n;
    }
    // => 1+2+3+4+5 is fixed arithmetic: the total never varies by run
    println!("total 1..=5: {total}");
}

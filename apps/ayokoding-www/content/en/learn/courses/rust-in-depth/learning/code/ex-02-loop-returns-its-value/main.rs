// Example 2: Loop Returns Its Value.
// => `loop` repeats forever; the exit carries the answer out.
// => No flag variable is needed when the loop itself is the expression.
fn main() {
    // => start below the limit so the loop must run at least twice.
    let mut n = 3; // => the value being doubled toward the limit
                   // => the loop expression evaluates to whatever `break` hands it.
    let answer = loop {
        // => `answer` binds the break value directly
        n *= 2; // => double first, ask about stopping after
                // => the exit test lives inside, next to the work it guards.
        if n > 20 {
            // => 24 is the first double past the limit
            break n; // => carry 24 out as the value of the loop
        }
    };
    // => both prints below are fixed: the doubling is fully determined.
    println!("answer: {}", answer); // => Output: answer: 24
    println!("steps end at: {}", n); // => Output: steps end at: 24
}

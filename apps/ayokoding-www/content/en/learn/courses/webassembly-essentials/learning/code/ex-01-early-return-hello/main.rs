// Example 1: Hello with an Early Return.
//
// A WebAssembly trap aborts the whole module, so idiomatic Wasm code
// refuses bad input before it ever acts: the guard clause fails fast
// and the happy path stays flat at the left margin, never nested.
// => the guard-first shape keeps every failure visible at the call site
// => no nesting means no hidden path for a bug to hide inside

// greet prints a greeting, refusing an empty name up front.
// => the return type is data (Result), never a thrown exception
// => callers handle the failure exactly where the call happens
fn greet(name: &str) -> Result<(), String> {
    // => guard clause first: the failure case is decided up front
    if name.is_empty() {
        // => build the failure value and leave immediately
        return Err(String::from("name is empty"));
    }
    // => past the guard, the name is safe to use without further checks
    println!("hello, {name}");
    // => Ok(()) means success: there is nothing else to report
    Ok(())
}

fn main() {
    // => match the first call: the empty name trips the guard clause
    match greet("") {
        // => Err arm prints the failure value the guard returned
        Err(message) => println!("error: {message}"),
        // => Ok arm is unreachable here: the guard always refuses ""
        Ok(()) => println!("unexpected success"),
    }
    // => same call shape, valid input: success prints inside greet
    match greet("Sari") {
        // => Err arm is unreachable: a real name passes the guard
        Err(message) => println!("error: {message}"),
        // => Ok arm stays quiet: the greeting already printed above
        Ok(()) => {}
    }
}

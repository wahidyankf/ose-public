// Example 18: Build Strings with Push and Join.
// => `String` owns growable text; `push_str` appends without reallocating each time.
// => `join` fuses a slice with a separator: one allocation for the whole result.
fn main() {
    // => fixed member names: the same report on every run.
    let members = ["sari", "budi", "citra"]; // => three members to report
                                             // => grow one report line by line: push each piece in order.
    let mut report = String::new(); // => empty owned string, ready to grow
    for member in members {
        // => each member gets its own line
        report.push_str(member); // => the name first
        report.push_str(" settled\n"); // => then the verdict and newline
    }
    print!("{}", report); // => three lines: sari/budi/citra settled
                          // => the same three lines in one call: separator between, none trailing.
    let one_line = members.join(", "); // => single allocation, fixed result
    println!("members: {}", one_line); // => Output: members: sari, budi, citra
}

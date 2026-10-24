// Example 3: If Let Unwraps Option.
//
// Option marks a value that may be absent; if let opens only the Some
// case and skips the None case without nesting, so lookup code reads as
// "use it when it is there" instead of "prove it is there, then use it".
// => if let fuses the test and the unwrap into one readable step
// => the else branch stays optional: absence needs no ceremony

// nickname looks a name up in a tiny directory of preferred names.
// => Option<&str> says absence is ordinary data, not a failure to report
// => 'a links the answer to the directory: the borrower's contract, in full
// => lifetimes arrive properly in Example 53: read 'a as "borrows from" here
fn nickname<'a>(directory: &[(&'a str, &'a str)], name: &str) -> Option<&'a str> {
    // => find returns the first pair whose key matches, or None
    directory
        .iter()
        .find(|(key, _)| *key == name)
        // => map keeps only the nickname half of the found pair
        .map(|(_, nick)| *nick)
}

fn main() {
    // => a fixed directory: lookups below hit and miss on purpose
    // => pairs are (&str, &str): the borrow lives as long as this array
    let directory = [("Sari", "S"), ("Budi", "B")];
    // => if let opens the Some case directly into a usable binding
    if let Some(nick) = nickname(&directory, "Sari") {
        // => inside this block, nick is a plain &str: no unwrap in sight
        println!("Sari goes by {nick}");
    }
    // => the modern let-else form inverts the same idea for guards
    let Some(nick) = nickname(&directory, "Budi") else {
        // => divergence arm: return, break, or continue belong here
        println!("no nickname on file");
        return;
    };
    // => past the let-else, nick is usable with no further checks
    println!("Budi goes by {nick}");
    // => a miss takes the quiet path: absence prints as absence
    if let Some(nick) = nickname(&directory, "Citra") {
        println!("Citra goes by {nick}");
    } else {
        // => else runs only for None: the miss is handled, not trapped
        println!("Citra has no nickname");
    }
}

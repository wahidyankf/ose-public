// Example 21: Read and Write Temp Files.
// => `write` stores whole bytes at once; `read_to_string` loads them back.
// => The temp directory holds scratch: fixed name, fixed content, removed after.
// => Only content and length print: the temp path itself never appears.
use std::fs; // => the whole-file read and write helpers
use std::path::PathBuf; // => joins directory and file name portably
fn main() {
    // => fixed note: identical bytes on every run, in any directory.
    let note = "catat: bayar zakat sebelum haul tiba\n"; // => one line, newline kept
                                                         // => a fixed name under the temp dir: no repo litter, no cleanup surprises.
    let mut path = PathBuf::from(std::env::temp_dir()); // => OS temp directory
    path.push("rust-in-depth-ex21.txt"); // => fixed scratch name
                                         // => write the whole note in one call: small files need no streaming.
    fs::write(&path, note).expect("temp dir is writable"); // => fails loudly otherwise
                                                           // => read the whole file back: the round trip proves the write.
    let back = fs::read_to_string(&path).expect("just-written file reads back"); // => same bytes
    assert_eq!(back, note); // => the round trip is exact, checked not hoped
    print!("{}", back); // => Output: catat: bayar zakat sebelum haul tiba
    println!("bytes: {}", back.len()); // => Output: bytes: 37
                                       // => remove the scratch: deterministic runs leave no trace behind.
    fs::remove_file(&path).expect("scratch file removes cleanly"); // => tidy temp dir
}

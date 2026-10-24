// Example 77: Extern C Calls into C.
// => LAYER 1, signatures: `puts` takes a C string pointer, returns an int.
// => LAYER 2, types: `CString` owns the nul-terminated bytes C requires.
// => LAYER 3, control flow: no branches, one unsafe call, one verdict.
// => LAYER 4, data flow: Rust text in, C return code out, boolean printed.
// => `unsafe` marks caller responsibility: the pointer must be valid, and it is.
// => `puts` adds its own newline: the transcript shows it before the verdict.
use std::ffi::CString; // => the nul-terminated string C functions expect
use std::os::raw::{c_char, c_int}; // => the C types in Rust spelling
                                   // => The declaration promises what C provides: the linker resolves it.
extern "C" {
    // => C calling convention: the boundary contract
    fn puts(text: *const c_char) -> c_int; // => prints plus newline, non-negative on success
}
fn main() {
    // => one fixed line crosses the boundary: Rust owns it, C prints it.
    let line = CString::new("laporan: sari 50").expect("no interior nul bytes"); // => C-ready text
                                                                                 // => the unsafe block holds exactly the foreign call: nothing else.
    let printed = unsafe { puts(line.as_ptr()) }; // => C prints, returns its verdict
                                                  // => non-negative means success: the boolean below is fixed at true.
    println!("ok: {}", printed >= 0); // => Output: ok: true
}

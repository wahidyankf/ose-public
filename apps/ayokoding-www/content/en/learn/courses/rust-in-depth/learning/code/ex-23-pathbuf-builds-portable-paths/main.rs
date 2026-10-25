// Example 23: PathBuf Builds Portable Paths.
// => `PathBuf` joins with the platform separator: no hardcoded slashes.
// => `file_name` and `extension` read the parts back without string surgery.
// => Nothing below touches the disk: paths are data until used.
use std::path::PathBuf; // => the owned, joinable path type
fn main() {
    // => build the report path segment by segment, portably.
    let mut report = PathBuf::from("laporan"); // => base directory first
    report.push("2026"); // => year segment, separator added for us
    report.push("settle.txt"); // => file segment completes the path
                               // => the joined path prints with the platform separator, fixed segments.
    println!("path: {}", report.display()); // => Output: laporan/2026/settle.txt
                                            // => `file_name` returns the last segment as an `OsStr`, if there is one.
    println!("file: {:?}", report.file_name()); // => Output: Some("settle.txt")
                                                // => `extension` returns the part after the final dot, if there is one.
    println!("ext: {:?}", report.extension()); // => Output: Some("txt")
                                               // => `parent` walks one segment up: useful for creating directories first.
    println!("dir: {:?}", report.parent()); // => Output: Some("laporan/2026")
}

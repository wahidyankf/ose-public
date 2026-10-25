// Example 21: Read the Bundled Input File.
//
// A WASI module sees only mounted directories: this unit's run mounts
// its own folder read-only at /data, so the program reads
// /data/input.txt and nothing else. The lesson anchors the exact bytes
// the program will find, line by line.
// => absolute guest paths (/data/...) never depend on the working dir
// => read_to_string is the whole file at once: lines() then splits it

fn main() {
    // => the mount makes the unit folder visible at /data, read-only
    let text = std::fs::read_to_string("/data/input.txt")
        // => map_err keeps exit 0 on a missing mount: harness, not content
        .map_err(|error| format!("cannot read bundled input: {error}"));
    // => one match: the roster prints, or the mount problem explains itself
    match text {
        Ok(text) => {
            // => lines plus numbers: the roster prints as its own index
            for (index, line) in text.lines().enumerate() {
                println!("{}: {line}", index + 1);
            }
        }
        // => reachable only when the harness mount is missing or moved
        Err(reason) => println!("{reason}"),
    }
}

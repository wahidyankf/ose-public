// Example 22: Write the Report to Tmp.
//
// The unit folder mounts read-only, so outputs go to /tmp, the one
// writable scratch dir the harness provides. Write, read back, and print
// a checksum line: the read-back proves the bytes landed, and stdout stays
// the only channel the golden file records.
// => /tmp is per-run scratch: overwrite, never append, across executions
// => print what you wrote: goldens record stdout, not side files

// report renders one "name: score (letter)" line per roster entry.
// The whole report builds in memory: no IO runs until the text is done.
// => format! builds the whole report before any IO: IO never half-runs
// => sorting by name keeps the report byte-identical on every run
fn report(entries: &[(&str, u32)]) -> String {
    // => clone into owned pairs so the sort cannot disturb the caller
    // => to_vec copies the slice: the caller's array never moves
    let mut ordered: Vec<(&str, u32)> = entries.to_vec();
    ordered.sort();
    // => tuples sort by name first: the report reads alphabetically
    // => one line per entry: the letter follows Example 2's bands
    // => push_str appends without reallocating per line: one buffer grows
    let mut out = String::new();
    for (name, score) in ordered {
        let letter = match score {
            90..=100 => 'A',
            80..=89 => 'B',
            70..=79 => 'C',
            60..=69 => 'D',
            _ => 'F',
        };
        out.push_str(&format!("{name}: {score} ({letter})\n"));
        // => newline per entry: the report is line-oriented, like the roster
    }
    // => the owned report returns: main writes it, reads it, prints it
    out
}

fn main() {
    // => fixed roster: the same three entries render on every run
    // => the array literal is the fixture: three names, three scores
    let text = report(&[("sari", 91), ("budi", 77), ("citra", 88)]);
    // => write to scratch: the unit folder itself is read-only by design
    if let Err(error) = std::fs::write("/tmp/report.txt", &text) {
        // => a failed write explains itself: exit stays 0, output stays full
        println!("write failed: {error}");
        return;
    }
    // => read back the same path: the round trip proves the bytes landed
    // => same path, second syscall: the bytes must survive the round trip
    match std::fs::read_to_string("/tmp/report.txt") {
        // => print the round-tripped bytes: the golden records this echo
        Ok(back) => print!("{back}"),
        // => reachable only when scratch vanishes between the two calls
        Err(error) => println!("read back failed: {error}"),
    }
    // => the byte count is fixed by the roster above: 43 on every run
    println!("wrote {} bytes to /tmp/report.txt", text.len());
}

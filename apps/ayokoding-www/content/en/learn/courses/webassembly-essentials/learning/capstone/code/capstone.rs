// Capstone: a small idiomatic grading CLI for WebAssembly.
//
// Reads a roster of "name=score" rows from the mounted input, grades each
// valid row with the course's band table, writes the ranked report to
// scratch, and prints the summary transcript. Invalid rows refuse with
// their line numbers; the report ranks valid rows by score descending with
// ties broken by name. Zero dependencies: the manifest stays empty and the
// lockfile question answers itself (see learning/code/README.md).
// => read from /data, write to /tmp: mounts are the only IO in this course
// => tests ride in #[cfg(test)]: the test run below executes them as WASI

// grade renders the letter for a validated score, like Examples 2 and 13.
// => the band table reads top-down: the first matching arm wins the letter
fn grade(score: u32) -> char {
    // => u32 in, char out: the capstone grades like every example before
    match score {
        // => the band table: five arms, one per letter, top-down
        90..=100 => 'A',
        // => 90 earns A: the top band starts here
        80..=89 => 'B',
        // => 80 earns B: ten points per band, uniformly
        70..=79 => 'C',
        // => 70 earns C: the middle holds, as always
        60..=69 => 'D',
        // => 60 earns D: the last passing band
        _ => 'F',
        // => below 60 fails: the catch-all closes the scale
    }
}

// parse_row grades one roster row or refuses it with its line number.
// => Option input models blank lines: emptiness is skipped, never an error
// => the letter rides with the name and score: the report formats below
fn parse_row(line_number: usize, row: &str) -> Result<(String, u32, char), String> {
    // => &str in, owned triple out: name, score, and letter travel together
    // => blank lines skip quietly: trailing newlines never become refusals
    if row.trim().is_empty() {
        // => blanks skip: trailing newlines never become refusals
        return Err(String::new());
        // => empty refusal: the report prints nothing for skipped lines
    }
    // => the split refuses shapeless rows: the line number rides along
    let Some((name, digits)) = row.split_once('=') else {
        // => let-else diverges: shapeless rows exit with their number
        return Err(format!("line {line_number}: {row:?} has no '='"));
        // => {row:?} quotes the evidence: the author finds the shapeless row
    };
    // => the parse refuses digit soup: the digits quote themselves too
    let score = digits
        // => digits become score: trim, parse, convert, in one chain
        .trim()
        // => trim first: padded scores grade like clean ones
        .parse::<u32>()
        // => u32 parses: the roster holds no negative scores
        .map_err(|_| format!("line {line_number}: score {digits:?} is not a number"))?;
    // => ? ends the row early: digit soup never reaches the range guard
    // => the range refuses outliers: scores above 100 cannot grade
    if score > 100 {
        // => 100 is the ceiling: outliers refuse before grading
        return Err(format!(
            "line {line_number}: score {score} is outside 0..=100"
        ));
        // => {score} prints plainly: numbers need no quotes in refusals
    }
    Ok((name.trim().to_string(), score, grade(score)))
    // => the triple assembles: trimmed name, proven score, earned letter
}

// rank orders graded rows by score descending, ties by name ascending.
// => the two-key comparator from Kata 8: score first, name settles ties
fn rank(mut rows: Vec<(String, u32, char)>) -> Vec<(String, u32, char)> {
    // => owned in, owned out: sorting reorders the caller's moved Vec
    // => descending score, ascending name: the leaderboard reads top-down
    rows.sort_by(|left, right| right.1.cmp(&left.1).then(left.0.cmp(&right.0)));
    // => chained keys compare: score decides, name settles ties
    // => sorted rows return: the report renders them below
    rows
}

// report renders the ranked table plus the refusal list, in transcript order.
// => graded rows print first: rank order, one line per row, letter included
// => refusals print second: every broken row names itself with its line
fn report(graded: &[(String, u32, char)], refused: &[String]) -> String {
    // => borrowed slices in, owned text out: the transcript leaves whole
    // => the report starts empty: graded rows append first, refusals second
    let mut out = String::new();
    // => one buffer grows: graded lines then refusal lines append in order
    for (name, score, letter) in graded {
        // => destructure per row: the triple reads plainly in the format
        out.push_str(&format!("{name}: {score} ({letter})\n"));
    }
    for reason in refused {
        // => refusals append second: the graded table leads the transcript
        // => blank-line skips carry empty reasons: they print nothing here
        if !reason.is_empty() {
            // => empty skips stay silent: blank lines print nothing, as promised
            out.push_str(&format!("refused: {reason}\n"));
        }
    }
    // => the full text returns: run writes it, main prints it
    out
}

// run reads the roster, grades it, writes the report, and returns the text.
// => the mount makes the roster visible at /data: read-only, like Ex.21
// => scratch takes the report at /tmp/grade-report.txt: writable, like Ex.22
fn run() -> Result<String, String> {
    // => no args, owned text out: mounts provide the input, scratch takes output
    // => read the mounted roster: a missing mount refuses with its cause
    let text = std::fs::read_to_string("/data/roster.txt")
        // => absolute guest path: the harness mounts the roster there
        .map_err(|error| format!("cannot read mounted roster: {error}"))?;
    // => ? ends the run early: a missing mount refuses the whole report
    // => graded rows accumulate in file order: rank sorts them below
    let mut graded: Vec<(String, u32, char)> = Vec::new();
    // => triples accumulate in file order: rank sorts them below
    // => refusals accumulate with line numbers: the transcript names each
    let mut refused: Vec<String> = Vec::new();
    // => refusals accumulate with numbers: every broken row names itself
    for (index, row) in text.lines().enumerate() {
        // => enumerate numbers from zero: messages add one for humans
        // => each row grades or refuses: blanks skip, broken rows explain
        match parse_row(index + 1, row) {
            // => each row decides once: triples push left, refusals push right
            Ok(entry) => graded.push(entry),
            // => clean rows append: the triple waits for ranking below
            Err(reason) => refused.push(reason),
            // => broken rows append: blanks and refusals both land here
        }
    }
    // => rank then render: the report reads as the final leaderboard
    let text = report(&rank(graded), &refused);
    // => rank then render: graded first, refusals second, one text
    // => write to scratch: the unit folder is read-only, /tmp is not
    std::fs::write("/tmp/grade-report.txt", &text)
        // => absolute scratch path: the unit folder stays read-only
        .map_err(|error| format!("cannot write scratch report: {error}"))?;
    // => ? guards the write: a full disk refuses instead of truncating
    // => the text returns twice: once to scratch, once to main
    Ok(text)
}

// => cfg(test) pins the contract: bands, rows, ranking, and the report shape
#[cfg(test)]
// => cfg(test) gates the suite: the binary ships without tests
mod tests {
    // => five tests, five behaviors: bands, rows, range, order
    // => super::* imports the pipeline: every stage is tested, not just main
    use super::*;

    // => the band table pins five letters: one row per band, both edges near
    #[test]
    fn grades_all_bands() {
        // => five asserts, five bands: mid-band samples keep it short
        assert_eq!(grade(95), 'A');
        // => 95 is mid-A: safely inside, far from both edges
        assert_eq!(grade(85), 'B');
        // => 85 is mid-B: safely inside, far from both edges
        assert_eq!(grade(75), 'C');
        // => 75 is mid-C: the middle of the middle band
        assert_eq!(grade(65), 'D');
        // => 65 is mid-D: the last passing band's center
        assert_eq!(grade(55), 'F');
        // => 55 is mid-F: failing, but not at the floor
    }

    // => a clean row parses to its triple: name, score, and letter together
    #[test]
    fn parses_clean_row() {
        // => the happy path: one clean row proves the triple shape
        assert_eq!(parse_row(1, "sari=91"), Ok(("sari".to_string(), 91, 'A')));
        // => the triple pins all three: name owned, score parsed, letter graded
    }

    // => a shapeless row refuses with its number: line 2 names itself
    #[test]
    fn refuses_shapeless_row() {
        // => no '=' means no split: the row refuses with its number
        assert!(parse_row(2, "budi").is_err());
        // => the shape is the verdict: any refusal message satisfies
    }

    // => an outlier refuses: 104 cannot grade, and the suite pins that fact
    #[test]
    fn refuses_out_of_range() {
        // => 104 parses but cannot grade: the range guard fires here
        assert!(parse_row(3, "citra=104").is_err());
        // => is_err pins the guard: the suite needs no message text
    }

    // => ranking breaks ties by name: budi precedes eka at 77, always
    #[test]
    fn ranks_ties_by_name() {
        // => eka before budi in, budi before eka out: the tiebreak decides
        let ranked = rank(vec![
            // => the fixture arrives worst-ordered: eka first, sari buried
            ("eka".to_string(), 77, 'C'),
            // => eka grades C: the tie that must lose alphabetically
            ("sari".to_string(), 91, 'A'),
            // => sari leads on score: 91 outranks every 77, ties aside
            ("budi".to_string(), 77, 'C'),
            // => budi grades C: the tie that must win alphabetically
        ]);
        // => vec closes: three rows, two tied, one clear winner
        // => sari leads on score: the tie below her settles alphabetically
        assert_eq!(ranked[0].0, "sari");
        // => index 0 is sari: the highest score ranks first, always
        assert_eq!(ranked[1].0, "budi");
        // => index 1 is budi: the tiebreak beats arrival order
        assert_eq!(ranked[2].0, "eka");
        // => index 2 is eka: last alphabetically among equals
    }
}

fn main() {
    // => one match, two exits: the report prints, or the reason explains
    // => the binary prints the report transcript the golden records below
    match run() {
        // => run does everything: read, grade, rank, write, return
        // => the report prints whole: the scratch copy matches byte-for-byte
        Ok(text) => print!("{text}"),
        // => print!, not println!: the report already ends with a newline
        // => a failed run explains itself: exit stays 0, output stays full
        Err(reason) => println!("{reason}"),
        // => the reason prints plainly: mounts and disks explain themselves
    }
}

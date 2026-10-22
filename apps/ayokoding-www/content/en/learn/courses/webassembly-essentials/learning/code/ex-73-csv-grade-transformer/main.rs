// Example 73: CSV Grade Transformer.
//
// Read this like an auditor: each input row becomes zero or one output
// rows, malformed rows become refusal lines, and the two streams never
// mix. The transformer parses "name,score" rows, grades the valid ones,
// and reports the broken ones with their line numbers, in a single pass.
// => one pass, two streams: graded lines and refusal lines stay separate
// => the line number rides along: every refusal names its own row

// transform grades one row or refuses it with the row's own context.
// => split_once(',') divides the row: None means the comma is missing
// => the score parses after trimming: spaces never break a valid row
fn transform(line_number: usize, row: &str) -> Result<String, String> {
    // => line_number rides in: every refusal can name its own row
    // => the comma divides name from score: shapeless rows refuse here
    let (name, score_text) =
    // => the pair splits the row: name borrows, digits wait to parse
        row.split_once(',').ok_or_else(|| format!("line {line_number}: {row:?} has no comma"))?;
    // => ok_or_else quotes the row: {:?} shows the shapeless evidence
    // => digits parse after trimming: " 91 " grades exactly like "91"
    let score = score_text
        // => score_text becomes score: the name shortens once digits prove out
        .trim()
        // => trim before parse: spaces pad, digits decide
        .parse::<u32>()
        // => u32, not u8: scores parse wide, the guard narrows next
        .map_err(|_| format!("line {line_number}: score {score_text:?} is not a number"))?;
    // => the refusal quotes the digits: {:?} shows what would not parse
    // => the range guard caps the scale: scores above 100 refuse loudly
    if score > 100 {
        // => 100 is the ceiling: the bands stop where digits stop mattering
        return Err(format!(
            "line {line_number}: score {score} is outside 0..=100"
        ));
        // => {score} prints plainly: numbers need no quotes, strings get {:?}
    }
    // => the letter follows Example 2's bands: one rule, every transformer
    let letter = match score {
        // => the band table: the same five arms every grader uses
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
    };
    Ok(format!("{},{},{letter}", name.trim(), score))
    // => name trims: the output never carries the input's padding
}

fn main() {
    // => two passes, six rows: graded first, refusals second
    // => six rows: three grade, three refuse in three different ways
    let rows = [
        // => the fixed sheet: three clean rows, three broken three ways
        "sari,91",
        // => clean: grades to sari,91,A
        "budi, 77 ",
        // => padded: spaces trim away, grades to budi,77,C
        "citra,88",
        // => clean: grades to citra,88,B
        "deka",
        // => no comma: the split refuses at line 4
        "eka,many",
        // => no digits: the parse refuses at line 5
        "gita,104",
        // => over range: the guard refuses at line 6
    ];
    // => graded lines print first: the clean stream leads the transcript
    for (index, row) in rows.iter().enumerate() {
        if let Ok(graded) = transform(index + 1, row) {
            // => graded prints: the clean stream leads the transcript
            println!("{graded}");
        }
    }
    // => refusal lines print second: every broken row names itself below
    for (index, row) in rows.iter().enumerate() {
        if let Err(reason) = transform(index + 1, row) {
            // => refusals print second: every broken row names itself
            println!("refused: {reason}");
        }
    }
}

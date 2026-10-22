// Example 14: Errors Cross Module Boundaries.
//
// A module owns its errors: parse failures stay a ParseError inside the
// parsing module, and the crate root converts once at the boundary.
// Callers of the crate meet one error type, while each module keeps the
// cases only it can produce.
// => small modules, small errors: each failure lives where it is caused
// => From conversions at the boundary keep ? working across the seam

// catalog is the parsing module: names, scores, and their failures.
// => one module, one error enum: ParseError names only parsing failures
// => the enum stays private: outsiders meet the crate error instead
mod catalog {
    // => pub items are the module's whole API: parse_line and ParseError only
    // => two cases: a line without '=', or a score that is not a number
    #[derive(Debug)]
    pub enum ParseError {
        // => pub enum in a private module: reachable paths stay inside this file
        // => carries the offending line so the message can show it
        NoSeparator(String),
        // => carries the offending digits for the same reason
        BadScore(String),
    }

    // => parse_line serves one "name=score" line or names its failure
    pub fn parse_line(line: &str) -> Result<(&str, u32), ParseError> {
        // => the name borrows the input line: clean rows cost no allocation
        // => split_once divides at '=': None means the line is shapeless
        let (name, score_text) = line
            // => the binding splits the row: name borrows, digits wait to parse
            .split_once('=')
            // => the whole line rides along: the message can quote it
            .ok_or_else(|| ParseError::NoSeparator(line.to_string()))?;
        // => the digits parse or the BadScore case carries them upward
        let score = score_text
            // => score_text becomes score: the name shortens once digits are proven
            .parse::<u32>()
            .map_err(|_| ParseError::BadScore(score_text.to_string()))?;
        Ok((name, score))
        // => the pair borrows the line: the caller owns the text, not the row
    }
}

// A crate-level error with one variant per module stage, starting here
// with only the catalog stage: later stages would add their own arms.
// => the boundary converts once, so main matches one type, not many
// => From<ParseError> lets ? cross the module seam without map_err
#[derive(Debug)]
enum RosterError {
    // => Catalog is the only stage today: new modules add new arms here
    // => wraps the module error: no information is lost in conversion
    Catalog(catalog::ParseError),
}

// => From is the ? bridge: catalog failures become roster failures
impl From<catalog::ParseError> for RosterError {
    // => one-line wrap: the boundary conversion stays boring on purpose
    fn from(error: catalog::ParseError) -> Self {
        RosterError::Catalog(error)
    }
}

// load_all parses every line, letting ? cross the module boundary.
// => map_err(RosterError::from) converts each ParseError at the seam below
// => main sees one error type no matter how many modules grow behind it
fn load_all(text: &str) -> Result<Vec<(&str, u32)>, RosterError> {
    // => convert then collect: the first Err aborts with its case intact
    text.lines()
        .map(catalog::parse_line)
        .map(|row| row.map_err(RosterError::from))
        .collect()
    // => lines() drops a trailing newline: a final newline adds no empty row
}

// Display renders the boundary error by reading the module case inside.
// => match through both layers: the boundary names the module and cause
// => main prints {reason}: the typed rendering, never a Debug dump
impl std::fmt::Display for RosterError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RosterError::Catalog(inner) => match inner {
                // => the separator case quotes the shapeless row for the author
                catalog::ParseError::NoSeparator(row) => write!(f, "catalog: {row:?} has no '='"),
                // => the digits case quotes the bad number for the author
                catalog::ParseError::BadScore(digits) => {
                    write!(f, "catalog: score {digits:?} is not a number")
                }
            },
        }
    }
}

fn main() {
    // => two rosters: one clean, one broken at the second line
    for roster in ["sari=91\nbudi=77", "sari=91\nbudi--77"] {
        // => Display on the boundary error names the module case inside
        match load_all(roster) {
            // => clean rosters print their parsed pairs in file order
            Ok(pairs) => println!("parsed: {pairs:?}"),
            // => broken input prints the converted case: module, row, cause
            Err(reason) => println!("refused: {reason}"),
        }
    }
}

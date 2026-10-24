// Example 59: Async State Machines Step.
//
// Every await desugars to a state machine: Start polls the first future,
// Waiting holds the partial progress, and Done carries the answer out.
// Writing the machine by hand shows what async hides: states for pauses,
// transitions for wakeups, and no hidden thread anywhere in the design.
// => states name the pauses: what the machine waits for, written down
// => step is total: each call advances or reports Done, never blocks

// Grader machines grade one score through named pauses, by hand.
// => Start holds the raw text: nothing has been checked yet
// => Waiting holds the parsed digits: validation passed, grading pending
// => Done holds the letter: the machine has no further work to do
#[derive(Debug)]
enum Grader {
    // => three variants, three pauses: Start, Waiting, Done in order
    Start(String),
    // => Start owns the text: the input lives inside the machine
    Waiting(u32),
    // => Waiting owns the digits: parsing succeeded, grading waits
    Done(char),
    // => Done owns the letter: the answer, carried out of the machine
}

// => the machine advances one pause per step: parse, then grade, then rest
impl Grader {
    // => step advances, letter reads: one writer, one reader
    // => &mut self lets the machine rewrite its own state in place
    // => bool answers done: true carries the letter out through the state
    fn step(&mut self) -> bool {
        // => &mut self rewrites in place: machines mutate their own state
        // => take the current state, leaving Done('?') to satisfy the borrow
        let current = std::mem::replace(self, Grader::Done('?'));
        // => replace takes the state: the placeholder keeps the borrow legal
        // => each arm advances one pause: parse, then grade, then rest
        let next = match current {
            // => Start parses the digits: failure parks the machine at F
            Grader::Start(text) => match text.parse::<u32>() {
                // => nested match: parsing decides the machine's next pause
                Ok(score) => Grader::Waiting(score),
                // => digits advance: Waiting holds the parsed score next
                // => unparseable input grades F immediately: the machine ends
                Err(_) => Grader::Done('F'),
            },
            // => Waiting grades the parsed score: Example 2's bands decide
            Grader::Waiting(score) => Grader::Done(match score {
                // => grading inline: the bands decide inside the Done wrap
                90..=100 => 'A',
                80..=89 => 'B',
                70..=79 => 'C',
                60..=69 => 'D',
                _ => 'F',
            }),
            // => Done stays done: stepping a finished machine is a no-op
            Grader::Done(letter) => Grader::Done(letter),
        };
        // => the bool reports completion: Done answers true, the rest false
        let done = matches!(next, Grader::Done(_));
        // => matches! reads the shape: Done means finished, nothing else
        *self = next;
        // => write-back installs the pause: the machine rests here until stepped
        done
        // => tail returns the verdict: true ends the stepping loop
    }

    // => letter reads the answer: callable only after step reports true
    fn letter(&self) -> char {
        // => &self reads: fetching the answer never disturbs the state
        match self {
            // => only Done carries a letter: other states answer '?'
            Grader::Done(letter) => *letter,
            // => Copy out: char leaves the borrow without moving anything
            // => stepping first is the caller's contract: '?' marks misuse
            _ => '?',
        }
    }
}

fn main() {
    // => two machines: one clean score, one unparseable input, both stepped
    for input in ["91", "9x"] {
        // => each machine starts ungraded: Start holds the raw text
        let mut grader = Grader::Start(input.to_string());
        // => step until done: at most two steps for this two-pause machine
        while !grader.step() {}
        // => the letter prints: grading finished without a single await
        println!("{input} -> {}", grader.letter());
    }
}

// Example 28: Visibility Draws Boundaries.
//
// pub, pub(crate), and private form three rings: the world, the crate,
// and the module. Helpers stay innermost; the crate shares within its
// walls; only the deliberate face goes public. Adding a pub is a promise
// to every future caller, so the default stays shut until use demands it.
// => private: the module's own scratch, invisible one fence out
// => pub(crate): shared inside the crate, invisible to its dependents
// => pub: the supported face, stable across versions by social contract

// ledger owns postings: append-only entries with a running balance.
// => the struct is public: downstream crates name their own ledgers
// => entries stay private: no outside push can skip the validation
pub mod ledger {
    // => pub mod opens the gate: everything inside still defaults shut
    // => Ledger is the face: dependents construct and read through methods
    #[derive(Debug)]
    pub struct Ledger {
        // => Vec<i32> grows: postings append, history never rewrites
        // => private entries: no outside push can skip the validation
        entries: Vec<i32>,
    }

    // => the constructor is public: the face needs a front door
    impl Ledger {
        // => one impl holds the face: construction, posting, reading together
        // => new starts empty: every ledger begins with no postings
        pub fn new() -> Ledger {
            Ledger {
                entries: Vec::new(),
            }
            // => Vec::new allocates nothing: the first post pays for storage
        }

        // => post validates the sign: postings are credits, never debits
        pub fn post(&mut self, amount: i32) -> Result<(), String> {
            // => &mut self writes: posting changes the book, so it borrows mutably
            // => the guard keeps the invariant: credits only, no debits
            if amount <= 0 {
                return Err(format!(
                    "refused: postings need a positive amount, got {amount}"
                ));
            }
            self.entries.push(amount);
            // => push appends: entries never reorder, history only grows
            Ok(())
            // => unit success: the postings themselves are the receipt
        }

        // => total reads through the crate helper: method, not field access
        pub fn total(&self) -> i32 {
            // => &self reads: totaling never mutates the book
            // => crate-visible sum serves every module without going public
            crate::totals::sum(&self.entries)
            // => the slice borrows: sum reads the entries without taking them
        }
    }
}

// totals holds crate-shared arithmetic: visible inside, hidden outside.
// => pub(crate) is the middle ring: sibling modules share, users do not
pub(crate) mod totals {
    // => the middle ring in one module: one function, crate-wide
    // => sum is crate-shared: ledger calls it, dependents never see it
    pub(crate) fn sum(values: &[i32]) -> i32 {
        // => &[i32] borrows any run: arrays and Vecs both pass slices
        values.iter().sum()
        // => iter().sum() folds: the standard total in a single expression
    }
}

// count_digits is private scratch for the demo: the helper nobody exports.
// => no pub at all: another file could not call this, by design
fn count_digits(mut value: i32) -> u32 {
    // => mut value is scratch: i32 is Copy, the caller's number stays untouched
    // => zero has one digit: the loop below would otherwise count none
    if value == 0 {
        return 1;
    }
    // => strip digits by division: each step removes the last decimal digit
    let mut digits = 0u32;
    // => the counter starts at zero: the zero input returned above
    while value != 0 {
        value /= 10;
        // => integer division truncates: the last digit falls off each step
        digits += 1;
    }
    // => tail expression returns: no return keyword needed at the end
    digits
}

fn main() {
    // => the public face in use: new, post, total, nothing else reachable
    let mut book = ledger::Ledger::new();
    // => mut book: postings change it, totals only read it
    // => two valid postings and one refusal: the guard earns its line
    for amount in [100, -5, 50] {
        // => post returns Result: the refusal prints, the book is untouched
        match book.post(amount) {
            Ok(()) => println!("posted {amount}: total {}", book.total()),
            Err(reason) => println!("{reason}: total {}", book.total()),
        }
    }
    // => the private helper serves main directly: same file, same fence
    println!("digits in 10050: {}", count_digits(10050));
}

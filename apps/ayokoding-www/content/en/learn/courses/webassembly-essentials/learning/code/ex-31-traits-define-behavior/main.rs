// Example 31: Traits Define Behavior.
//
// A trait names what a type can do; each impl says how. Summary works for
// scores, shipments, and rosters alike because the trait, not the caller,
// picks the rendering per type. Generic functions then serve every type
// that implements the trait, with no overloads and no runtime dispatch.
// => traits are interfaces with the method list written once, up front
// => static dispatch: the compiler stamps one copy per type, no vtable

// Summary renders one line per value for the transcript below.
// => one method, many types: the trait is the shared vocabulary
// => &self borrows: summarizing never consumes the value it describes
trait Summary {
    // => the method list is the contract: implementors fill exactly this
    // => summarize returns an owned line: callers print without borrows
    fn summarize(&self) -> String;
    // => semicolon, not braces: the trait declares, impls define
}

// ScoreSummary pairs a name with its letter grade from Example 2's bands.
// => a plain data struct: the trait below gives it its voice
struct ScoreSummary {
    // => 'static name: the roster below lives for the whole run
    name: &'static str,
    // => borrows the name: summaries describe, they never own
    score: u8,
    // => u8 fits 0..=100: grades need no wider integer
}

// => the impl chooses the band per value: data stays dumb, voice is here
impl Summary for ScoreSummary {
    // => the first voice: scores render as name, number, and band
    fn summarize(&self) -> String {
        // => self is the row: name and score both feed the sentence
        // => match picks the band: the same table Examples 2 and 13 teach
        let letter = match self.score {
            // => the band binds first: the format below only interpolates
            90..=100 => 'A',
            80..=89 => 'B',
            70..=79 => 'C',
            60..=69 => 'D',
            _ => 'F',
        };
        format!("{}: {} ({letter})", self.name, self.score)
        // => one owned String: the caller prints without holding borrows
    }
}

// ShipmentSummary pairs an order id with its carrier from Example 30.
// => a second, unrelated type behind the same one-method trait
// => no shared fields with ScoreSummary: the trait is the only link
struct ShipmentSummary {
    // => unrelated shape, same trait: id and carrier, no score
    id: u32,
    // => u32 ids: order numbers grow beyond a byte's range
    carrier: &'static str,
    // => borrows the carrier: the name outlives the shipment
}

// => the second impl renders its own sentence: same trait, new voice
impl Summary for ShipmentSummary {
    // => the second voice: shipments render routes, not grades
    fn summarize(&self) -> String {
        // => one sentence per parcel: id plus carrier, nothing else
        format!("order {} ships via {}", self.id, self.carrier)
        // => owned again: both impls return String, uniformly
    }
}

// print_all serves every summarizable slice with one generic function.
// => T: Summary bounds the generic: only summarizable types are accepted
// => the bound is checked per call: misuse fails at compile time, with text
fn print_all<T: Summary>(items: &[T]) {
    // => &[T] borrows the slice: printing never takes the roster
    // => one loop for any T: the trait call resolves per concrete type
    for item in items {
        // => iteration borrows each element: the slice stays whole
        println!("{}", item.summarize());
        // => monomorphized per T: no vtable, one copy per type
    }
}

fn main() {
    // => two slices, one function: scores then shipments
    // => two scores behind the trait: print_all serves the slice at once
    let scores = [
        // => the array is the fixture: two names, two bands
        ScoreSummary {
            name: "sari",
            score: 91,
        },
        ScoreSummary {
            name: "budi",
            score: 77,
        },
    ];
    print_all(&scores);
    // => &scores borrows: the array stays usable after printing
    // => two shipments behind the same trait: one function, second type
    let shipments = [
        ShipmentSummary {
            id: 7,
            carrier: "tiki",
        },
        ShipmentSummary {
            id: 8,
            carrier: "jne",
        },
    ];
    print_all(&shipments);
}

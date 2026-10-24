// Example 20: Parse Numbers Without Panicking.
//
// User digits are untrusted: parse() returns Result so "12x" becomes a
// matchable Err instead of a trap. Turbofish names the target type at
// the call, and radix forms (hex, binary) parse with from_str_radix.
// => never unwrap a parse of outside input: match it like any Result
// => u32::from_str_radix handles base 16 and 2 where parse() stops at 10

fn main() {
    // => each literal below exercises a different parse exit on purpose
    for text in ["3101", "31x01", "0xC1D", "0b101", "4294967296"] {
        // => strip the 0x/0b prefix first: from_str_radix wants bare digits
        let parsed = if let Some(hex) = text.strip_prefix("0x") {
            // => base 16: C1D in hex is a three-digit module version
            u32::from_str_radix(hex, 16).map_err(|_| "bad hex digits".to_string())
        } else if let Some(bin) = text.strip_prefix("0b") {
            // => base 2: 101 in binary is the five flags below
            u32::from_str_radix(bin, 2).map_err(|_| "bad binary digits".to_string())
        } else {
            // => plain decimal through parse with a readable refusal
            text.parse::<u32>().map_err(|_| "not a u32".to_string())
        };
        // => one match serves all three shapes: Ok prints, Err explains
        match parsed {
            Ok(value) => println!("{text} -> {value}"),
            // => the refusal names the cause: bad digits, never a trap
            // => exit stays 0 throughout: refusals print, the loop continues
            Err(reason) => println!("{text} -> refused: {reason}"),
        }
    }
}

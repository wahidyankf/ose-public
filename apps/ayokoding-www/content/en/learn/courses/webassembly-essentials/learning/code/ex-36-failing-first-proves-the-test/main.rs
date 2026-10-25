// Example 36: Failing First Proves the Test.
//
// A test that never failed proves nothing: the red-green loop writes the
// assertion first, watches it fail on the stub, then earns the green with
// the implementation. This unit ships the green end of that loop; the
// lesson replays the red middle as a marked illustration, so the habit is
// taught without ever committing a red unit to the harness.
// => red first: the failure transcript names the missing behavior exactly
// => green second: the same transcript with passing lines, committed here

// is_leap decides leap years: divisible by 4, except centuries, except 400s.
// => the stub returned false always: the first test run failed on 2024
// => the rule below earns the green: three divisibility checks in order
fn is_leap(year: u32) -> bool {
    // => u32 years: the calendar has no negative years here
    // => divisible by 400 keeps its leap day: 2000 was a leap year
    if year % 400 == 0 {
        // => 400 first: the rarest exception leads the chain
        return true;
        // => early return: 2000 never reaches the century guard
    }
    // => divisible by 100 loses it: 1900 was an ordinary year
    if year % 100 == 0 {
        // => 100 second: centuries fall through only past the 400 check
        return false;
    }
    // => divisible by 4 keeps it: 2024 was a leap year, 2025 was not
    year % 4 == 0
    // => tail expression: the common case needs no branch at all
}

// => cfg(test) keeps the suite beside the rule: red and green live here
#[cfg(test)]
mod tests {
    // => inline suite: the tests ship beside the rule they prove
    // => super::* brings is_leap into the suite's scope in one line
    use super::*;

    // => the regression that proved the suite: 2024 failed on the stub
    #[test]
    fn leap_year_divisible_by_4() {
        // => 2024 passes only after the third check below was written
        assert!(is_leap(2024));
    }

    // => the century exception: 1900 failed while the rule ignored hundreds
    #[test]
    fn century_is_not_leap() {
        // => 1900 passes only with the % 100 guard in place above
        assert!(!is_leap(1900));
    }

    // => the exception to the exception: 2000 failed until % 400 led
    #[test]
    fn four_hundredth_year_is_leap() {
        // => 2000 passes only because the % 400 check runs first of all
        assert!(is_leap(2000));
    }

    // => the ordinary year: 2025 fails every divisibility check, correctly
    #[test]
    fn ordinary_year_is_not_leap() {
        // => 2025 is the control: no rule fires, false is the right answer
        assert!(!is_leap(2025));
    }
}

fn main() {
    // => the binary replays the four cases: the suite's greatest hits
    // => the binary demonstrates the rule on the four watershed years
    for year in [2024, 1900, 2000, 2025] {
        // => the same four years the suite asserts: demo mirrors tests
        println!("{year}: leap = {}", is_leap(year));
        // => one line per watershed: 2024, 1900, 2000, 2025 in order
    }
}

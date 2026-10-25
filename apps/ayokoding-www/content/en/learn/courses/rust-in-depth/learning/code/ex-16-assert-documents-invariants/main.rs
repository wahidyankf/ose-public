// Example 16: Assert Documents Invariants.
// => `assert!` and `assert_eq!` state facts the run must satisfy to continue.
// => Passing asserts are silent: the transcript shows only the real output.
fn total(dues: &[i32]) -> i32 {
    // => sums a slice of dues
    dues.iter().sum() // => the whole total in one fused pass
}
fn main() {
    // => fixed dues: every fact below is checkable by hand in advance.
    let dues = [50, 75, 25]; // => three dues, total 150
    assert_eq!(dues.len(), 3); // => the ledger shape: exactly three lines
    let sum = total(&dues); // => the value under test
    assert_eq!(sum, 150); // => hand total: 50 + 75 + 25
    assert!(sum > 0); // => the domain rule: settlements stay positive
                      // => every assert passed silently, so only the report below prints.
    println!("settled: {}", sum); // => Output: settled: 150
    println!("lines: {}", dues.len()); // => Output: lines: 3
}

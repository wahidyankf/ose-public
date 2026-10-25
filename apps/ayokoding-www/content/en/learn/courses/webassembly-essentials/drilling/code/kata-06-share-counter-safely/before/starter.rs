// Kata 6 starter: a counter nobody can share.
//
// The tally below moves through each scorer by value, so every handoff
// needs a return trip and the call sites juggle ownership instead of
// grading. Your task: wrap the count in a Cell and share the meter by
// reference, so every scorer observes through & and the total reads once.
// => ownership juggling is the smell: the tally returns after every use
// => Cell shares the count: observe takes &, the total reads at the end
fn observe(tally: u32, score: u32) -> u32 {
    // => the tally moves in and out: callers thread it by hand, every time
    let _ = score;
    tally + 1
}

fn main() {
    // => the tally travels by value: each call hands it back explicitly
    let mut tally = 0u32;
    tally = observe(tally, 91);
    tally = observe(tally, 77);
    tally = observe(tally, 88);
    // => three observations counted: the threading below is the noise to cut
    println!("observations: {tally}");
}

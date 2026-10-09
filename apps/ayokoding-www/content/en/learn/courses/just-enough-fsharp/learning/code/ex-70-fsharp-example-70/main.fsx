// => The first workflow waits without blocking a thread.
// => It eventually produces the integer 2.
let first = async {
    // => The timer is asynchronous work, unlike an immediate constant.
    do! Async.Sleep 10
    // => The first result is available after the wait.
    return 2
}
// => The second independent workflow follows the same pattern.
// => It produces 3 after its own wait.
let second = async {
    // => This timer can be pending alongside the first one.
    do! Async.Sleep 10
    // => The second result is 3.
    return 3
}
// => Running the combined workflow starts both jobs.
// => Parallel returns an array in input order.
let results = [first; second] |> Async.Parallel |> Async.RunSynchronously
// => Output order does not measure which job finished first.
printfn "%A" results

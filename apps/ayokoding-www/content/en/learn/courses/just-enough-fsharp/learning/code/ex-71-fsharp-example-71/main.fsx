// => task creates a Task<int>.
let work = task {
    // => The Task returns 42 as its integer result.
    return 21 * 2
}
// => Awaiting through GetAwaiter is only for this standalone script.
// => GetResult obtains the value for this standalone script.
let answer = work.GetAwaiter().GetResult()
// => This prints 42.
printfn "%d" answer

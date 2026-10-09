// => async describes deferred work.
let work = async {
    // => The workflow returns 42 as its result.
    return 6 * 7
}
// => RunSynchronously waits for this small local example.
// => RunSynchronously obtains the deferred value at the script boundary.
let answer = Async.RunSynchronously work
// => This prints 42.
printfn "%d" answer

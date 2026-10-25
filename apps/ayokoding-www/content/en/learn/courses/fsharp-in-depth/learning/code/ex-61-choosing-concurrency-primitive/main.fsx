// => Example 61: one doubling job through three primitives that agree.
let double n = n * 2 // => the plain job every shape below performs.
// => Parallel shape: three independent stages joined in order.
let viaParallel = // => batch shape for independent work.
    [ 1; 2; 3 ] |> List.map (fun n -> async { return double n }) // => one stage each.
    |> Async.Parallel |> Async.RunSynchronously |> Array.toList // => joined in order.
// => Direct shape: the same job with no machinery at all.
let viaDirect = [ 1; 2; 3 ] |> List.map double // => the default until a need appears.
// => Agent shape: requests serialize through one inbox.
type DoubleMsg = Go of int * AsyncReplyChannel<int> // => value plus reply address.
let doubler = MailboxProcessor.Start(fun box -> async { // => the serializing loop.
    let rec loop () = async { // => stateless loop: double and continue.
        let! (Go (n, reply)) = box.Receive() // => one request at a time.
        reply.Reply(double n) // => answer through the channel.
        return! loop () } // => loop forever.
    return! loop () }) // => the loop begins.
let viaAgent = [ 1; 2; 3 ] |> List.map (fun n -> doubler.PostAndReply(fun ch -> Go (n, ch))) // => three ordered requests.
printfn "par=%A direct=%A agent=%A" viaParallel viaDirect viaAgent // => par=[2; 4; 6] direct=[2; 4; 6] agent=[2; 4; 6].

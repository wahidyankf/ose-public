// Example 58: Executor Polls Ready Futures.
//
// An async executor polls futures until they resolve; a real one parks the
// thread on Pending and wakes on readiness. This survey polls exactly once
// per future with a no-op waker and keeps only the Ready answers, which is
// total (no loops, no hangs) and honest: anything Pending needs the real
// reactor the pinned runtime cannot host, and the lesson says so outright.
// => one poll, no loop: immediately-ready futures resolve, rest report None
// => the waker does nothing: nothing can wake what never sleeps here

use std::future::Future;
use std::task::{Context, Poll, RawWaker, RawWakerVTable, Waker};

// noop_waker builds a waker whose every operation does nothing at all.
// => the vtable names four no-ops: clone, wake, wake_by_ref, and drop
// => null data pointer: there is no executor state to point at, by design
fn noop_waker() -> Waker {
    // => clone returns the same null waker: nothing to reference-count
    unsafe fn clone(_: *const ()) -> RawWaker {
        RawWaker::new(std::ptr::null(), &VTABLE)
    }
    // => wake does nothing: no thread waits, no queue needs a nudge
    unsafe fn wake(_: *const ()) {}
    // => the table bundles the four operations: clone, wake, wake_by_ref, drop
    static VTABLE: RawWakerVTable = RawWakerVTable::new(clone, wake, wake, wake);
    // => from_raw wraps the table: the caller owns the resulting Waker
    unsafe { Waker::from_raw(RawWaker::new(std::ptr::null(), &VTABLE)) }
}

// poll_once asks a future for its answer exactly once, without parking.
// => Pin holds the future still: polling requires a pinned future by rule
// => Ready yields Some: Pending yields None instead of spinning forever
fn poll_once<F: Future>(future: F) -> Option<F::Output> {
    // => the waker lives for the poll: nothing outlives this function
    let waker = noop_waker();
    // => the context carries the waker: the future may clone it freely
    let mut context = Context::from_waker(&waker);
    // => pin the owned future on the stack: Box pins without moving it
    let mut pinned = Box::pin(future);
    // => a single poll: ready answers return, pending answers report None
    match pinned.as_mut().poll(&mut context) {
        Poll::Ready(value) => Some(value),
        // => Pending means "needs a reactor": the survey reports, never waits
        Poll::Pending => None,
    }
}

fn main() {
    // => two immediately-ready futures: async blocks with no awaits inside
    let ready_sum = async { 20 + 22 };
    let ready_name = async { "wasi" };
    // => the single poll resolves both: ready futures never report Pending
    println!("sum: {:?}", poll_once(ready_sum));
    println!("name: {:?}", poll_once(ready_name));
}

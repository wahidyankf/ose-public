// Example 30: Enums Model State Machines.
//
// An order is exactly one of Draft, Paid, Shipped, or Cancelled: an enum
// says so, and match enforces that every transition handles every state.
// Illegal transitions become explicit refusals, never silent no-ops.
// => one variant per state: the type lists the whole machine at a glance
// => transitions take self and return Result: consumed states cannot repeat

// Order carries its id and total through every state of its life.
// => struct variants hold the data each state needs and no more
// => Cancelled keeps its reason: audits read the machine's memory later
#[derive(Debug)]
enum Order {
    // => derive Debug prints whole states: main shows the leftovers
    // => a draft holds intent: id and total, nothing committed yet
    Draft {
        id: u32,
        total: u32,
    },
    // => paying moves money: the draft is consumed, the paid order remains
    Paid {
        id: u32,
        total: u32,
    },
    // => shipping keeps the total and assigns a carrier: the order leaves
    Shipped {
        id: u32,
        total: u32,
        carrier: &'static str,
    },
    // => cancelled keeps why: the reason outlives the order itself
    Cancelled {
        id: u32,
        reason: &'static str,
    },
}

// pay moves Draft to Paid; every other state refuses with its own reason.
// => self by value: the old state is consumed, reuse cannot compile
// => the refusal names the state: "shipped orders cannot be paid again"
fn pay(order: Order) -> Result<Order, String> {
    // => Order in by value: the caller hands the state over, not a loan
    match order {
        // => exhaustive arms: the compiler rejects a forgotten state
        // => the only legal origin: drafts pay into Paid, keeping id+total
        Order::Draft { id, total } => Ok(Order::Paid { id, total }),
        // => every other state names itself in its own refusal below
        Order::Paid { id, .. } => Err(format!("order {id} is already paid")),
        Order::Shipped { id, .. } => Err(format!("order {id} already shipped")),
        Order::Cancelled { id, .. } => Err(format!("order {id} was cancelled")),
    }
}

// cancel retires a live order with its reason recorded; shipped and
// cancelled orders refuse, since the warehouse and the archive are final.
// => Draft and Paid both cancel: intent and money return, the reason stays
fn cancel(order: Order, reason: &'static str) -> Result<Order, String> {
    // => reason rides along: cancellation records why, not just that
    match order {
        // => drafts cancel freely: nothing was paid, nothing was shipped
        Order::Draft { id, .. } => Ok(Order::Cancelled { id, reason }),
        // => paid orders cancel with a refund implied: the reason records why
        Order::Paid { id, .. } => Ok(Order::Cancelled { id, reason }),
        // => shipped orders are past recall: the carrier already owns them
        Order::Shipped { id, .. } => Err(format!("order {id} already shipped")),
        // => cancelled orders stay cancelled: the first reason stands
        Order::Cancelled { id, .. } => Err(format!("order {id} was cancelled")),
    }
}

// ship moves Paid to Shipped on a named carrier; the rest refuse.
// => same shape as pay: the legal origin converts, the rest explain
// => &'static str carriers: the names below live for the whole run
fn ship(order: Order, carrier: &'static str) -> Result<Order, String> {
    // => carrier names the mover: the Shipped state keeps it as data
    match order {
        // => drafts cannot ship: payment is the gate before the warehouse
        Order::Draft { id, .. } => Err(format!("order {id} is unpaid, cannot ship")),
        // => the legal origin: paid orders ship with their total intact
        Order::Paid { id, total } => Ok(Order::Shipped { id, total, carrier }),
        // => double shipping refuses: the first carrier already owns it
        Order::Shipped { id, .. } => Err(format!("order {id} already shipped")),
        Order::Cancelled { id, .. } => Err(format!("order {id} was cancelled")),
    }
}

fn main() {
    // => three scripts: the happy chain, the illegal ship, the cancel
    // => the happy path chains: draft pays, paid ships, fields print each
    let draft = Order::Draft { id: 7, total: 250 };
    // => order 7 is the hero: it pays and ships in the lines below
    match pay(draft) {
        Ok(paid) => match ship(paid, "tiki") {
            // => both transitions legal: the fields print the final state
            Ok(Order::Shipped { id, total, carrier }) => {
                println!("done: order {id} total {total} via {carrier}")
            }
            // => other states are unreachable here: shipped is the only outcome
            Ok(other) => println!("done: {other:?}"),
            // => unreachable: a paid order always accepts a carrier here
            Err(reason) => println!("ship refused: {reason}"),
        },
        // => unreachable: drafts always pay in this fixed script
        Err(reason) => println!("pay refused: {reason}"),
    }
    // => the illegal path refuses loudly: shipping a draft explains itself
    match ship(Order::Draft { id: 8, total: 99 }, "jne") {
        // => unreachable: unpaid orders never reach the warehouse
        Ok(shipped) => println!("done: {shipped:?}"),
        // => the refusal names the gate: payment comes before shipping
        Err(reason) => println!("ship refused: {reason}"),
    }
    // => the cancellation path retires a draft with its reason recorded
    match cancel(Order::Draft { id: 9, total: 40 }, "duplicate") {
        // => the cancelled order prints whole: id plus the recorded reason
        Ok(Order::Cancelled { id, reason }) => println!("cancelled: order {id} ({reason})"),
        // => other outcomes are unreachable here: drafts always cancel
        Ok(other) => println!("cancelled: {other:?}"),
        // => unreachable: nothing blocks cancelling a draft in this script
        Err(reason) => println!("cancel refused: {reason}"),
    }
}

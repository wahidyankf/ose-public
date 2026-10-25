// Worked Example 23: Parallel loader fanout.
// => NusaMart is fictional; every price and tick here is fixed.
// => A detail page needs three independent reads: the product, its stock,
// => and its reviews. Sequential loads add the waits; parallel loads pay
// => only the slowest. Logical ticks stand in for milliseconds so the
// => transcript is identical on every run.

// => Fixed waits: product takes 30 ticks, stock 20, reviews 50.
const WAITS = { product: 30, stock: 20, reviews: 50 }; // => fictional latencies

// => Sequential loading pays every wait in turn: 30 plus 20 plus 50.
function sequential(): { total: number; order: string[] } {
  // => sequential loader
  const order = ["product", "stock", "reviews"]; // => fixed request order
  const total = WAITS.product + WAITS.stock + WAITS.reviews; // => summed waits
  return { total, order }; // => cost plus order
} // => end of sequential

// => Parallel loading starts all three at once and pays only the slowest:
// => 50 ticks, the reviews read.
function parallel(): { total: number; order: string[] } {
  // => parallel loader
  const order = ["product+stock+reviews"]; // => one joint launch
  const total = Math.max(WAITS.product, WAITS.stock, WAITS.reviews); // => slowest wins
  return { total, order }; // => cost plus order
} // => end of parallel

const seq = sequential(); // => run the sequential plan
console.log("sequential ticks: " + seq.total + " order " + seq.order.join(",")); // => Output 100
const par = parallel(); // => run the parallel plan
console.log("parallel ticks: " + par.total + " order " + par.order.join(",")); // => Output 50
console.log("saved ticks: " + (seq.total - par.total)); // => Output 50
export {}; // => module scope keeps these names local

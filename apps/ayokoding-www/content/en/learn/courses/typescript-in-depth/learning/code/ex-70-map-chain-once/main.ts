// => Example 70: one reduce pass beats filter-plus-map; the array is walked once.
const orders = [
  // => fixed order lines
  { item: "lamp", qty: 2, price: 25 }, // => kept: bulk lamp
  { item: "pen", qty: 1, price: 3 }, // => dropped: single pen
  { item: "desk", qty: 2, price: 150 }, // => kept: bulk desk
]; // => end of the order lines
const chained = orders.filter((o) => o.qty >= 2).map((o) => o.qty * o.price); // => two passes, interim array
const single = orders.reduce<number[]>((out, o) => {
  // => WHY reduce: one pass, no interim array
  if (o.qty >= 2) {
    // => same filter inside the pass
    out.push(o.qty * o.price); // => same map inside the pass
  } // => end of if (o.qty >= 2)
  return out; // => accumulator carries on
}, []); // => end of const single = orders.reduce<number[]>((out, o) =>
console.log(chained.join(","), single.join(",")); // => Output: 50,300 then 50,300, identical
console.log(single.reduce((n, x) => n + x, 0)); // => Output: 350

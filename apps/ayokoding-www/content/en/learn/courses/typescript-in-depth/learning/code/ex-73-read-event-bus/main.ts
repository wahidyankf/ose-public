// => Example 73: read the map first: event names to listener lists, emit fans out.
type Handler = (payload: string) => void; // => every listener shares one shape
class Bus {
  // => minimal typed event bus
  private routes = new Map<string, Handler[]>(); // => WHY map: names to subscriber lists
  on(event: string, fn: Handler): void {
    // => subscribe one listener
    const list = this.routes.get(event) ?? []; // => existing list or fresh
    list.push(fn); // => append
    this.routes.set(event, list); // => store back, covers the fresh case
  } // => end of on(event: string, fn: Handler): void
  emit(event: string, payload: string): number {
    // => returns the delivery count
    const list = this.routes.get(event) ?? []; // => missing event reaches nobody
    for (const fn of list) {
      // => deliver in subscribe order
      fn(payload); // => same payload each
    } // => end of for (const fn of list)
    return list.length; // => count delivered
  } // => end of emit(event: string, payload: string): number
} // => end of class Bus
const bus = new Bus(); // => one bus
const heard: string[] = []; // => observed deliveries
bus.on("hi", (p) => {
  heard.push(`a:${p}`);
}); // => first subscriber
bus.on("hi", (p) => {
  heard.push(`b:${p}`);
}); // => second subscriber
console.log(bus.emit("hi", "ada")); // => Output: 2
console.log(bus.emit("unknown", "x")); // => Output: 0, nobody subscribed
console.log(heard.join(" ")); // => Output: a:ada b:ada

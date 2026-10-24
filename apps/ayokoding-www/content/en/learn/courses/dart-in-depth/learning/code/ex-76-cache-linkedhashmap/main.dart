// Example 76: The Cache Hides Behind a LinkedHashMap.
//
// An LRU cache pairs a LinkedHashMap with a capacity: hits refresh by
// reinserting, misses compute and insert, and over-capacity evicts the
// first key, which the insertion-ordered map always knows. Reading this
// file means watching keys move: every print below narrates one move of
// the eviction order, and the order is the whole lesson.
import 'dart:collection'; // => LinkedHashMap: insertion order with fast keys

void main() {
  // => the cache holds two crops: the third insert evicts the eldest
  final cache = LruCache(2); // => capacity two: small enough to watch move
  // => oat and tea fill the cache: insertion order oat, then tea
  cache.put('oat', 12); // => first in: eldest until touched again
  // => tea second: the order reads oat-tea, eldest first
  cache.put('tea', 4); // => second in: youngest until the next insert
  // => oat hit refreshes: removed and reinserted, youngest again
  print('oat: ${cache.get('oat')}'); // => Output: oat: 12
  // => rice overfills: eldest tea evicts, order becomes oat-rice
  cache.put('rice', 20); // => third in: capacity breaks, tea leaves
  // => tea misses after eviction: null, the honest miss shape (ex 14)
  print('tea: ${cache.get('tea')}'); // => Output: tea: null
  // => survivors print in order: oat refreshed first, rice inserted last
  print('keys: ${cache.keys}'); // => Output: keys: [oat, rice]
}

// LruCache keeps the newest hits and evicts the eldest on overflow.
// => LinkedHashMap orders by insertion: first key is always the eldest
// => capacity caps the size: every insert past it evicts exactly one
class LruCache {
  // => the capacity: inserts past this number evict the eldest key
  final int capacity; // => final: the cache size never changes mid-life
  // => the store: insertion-ordered map, eldest first, youngest last
  final _store = LinkedHashMap<String, int>(); // => order is the lesson
  // => construction pins the capacity: small caches teach best
  LruCache(this.capacity); // => the size promise, kept by every put
  // => get hits refresh: remove plus reinsert moves the key youngest
  int? get(String key) {
    // => miss returns null: the honest absence shape, no exception
    if (!_store.containsKey(key)) return null; // => tea lands here evicted
    // => hit refreshes: value out, value back in, youngest again
    final value = _store.remove(key)!; // => remove returns the stashed int
    // => reinsert moves youngest: the refresh the example watches happen
    _store[key] = value; // => oat moves youngest: rice will outlive tea
    // => the value returns: refreshed in order, unchanged in content
    return value; // => twelve: oat's count, order renewed
  }

  // put inserts or refreshes, evicting the eldest past capacity.
  void put(String key, int value) {
    // => existing keys refresh through remove-then-add, like get above
    _store.remove(key); // => clears the old slot wherever it sat
    // => insert lands youngest: the newest key always reads last
    _store[key] = value; // => rice lands here, youngest of three
    // => overflow evicts exactly one: the first key, the eldest of all
    if (_store.length > capacity) {
      // => three past a cap of two evicts
      // => keys.first is the eldest: insertion order never lies about age
      _store.remove(_store.keys.first); // => tea leaves: eldest goes first
    }
  }

  // keys reads youngest-last: the eviction order made visible for proof.
  Iterable<String> get keys => _store.keys; // => oat, rice: the survivors
}

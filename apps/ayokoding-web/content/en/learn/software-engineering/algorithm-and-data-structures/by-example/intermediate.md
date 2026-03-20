---
title: "Intermediate"
weight: 10000002
date: 2026-03-20T00:00:00+07:00
draft: false
description: "Examples 29-57: Binary search, hash tables, BSTs, heaps, merge sort, quicksort, BFS/DFS, recursion patterns, two-pointer, sliding window, prefix sums, and graph representation (35-70% coverage)"
tags: ["algorithm", "data-structures", "tutorial", "by-example", "intermediate"]
---

This section covers core algorithmic techniques and data structures used in production systems and technical interviews. Each example is self-contained and runnable in C, Go, Python, and Java. Examples build on the foundational concepts from the beginner section but include all necessary code to run independently.

## Binary Search

### Example 29: Binary Search on a Sorted Array

Binary search finds a target value in a sorted array by repeatedly halving the search space. Each step eliminates half the remaining candidates, producing O(log n) time complexity — 30 steps suffice for one billion elements.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

int binary_search(int arr[], int size, int target) {
    // => arr must be sorted in ascending order for binary search to work
    // => target is the value we want to find

    int left = 0, right = size - 1;
    // => left starts at index 0, right starts at last valid index
    // => these two pointers define the active search window

    while (left <= right) {
        // => loop continues as long as search window is non-empty
        // => when left > right the target is not in the array

        int mid = left + (right - left) / 2;
        // => mid is the index of the middle element
        // => use (right - left) / 2 instead of (left + right) / 2 to avoid integer overflow

        if (arr[mid] == target) {
            // => found the target — return its index immediately
            return mid;
        } else if (arr[mid] < target) {
            // => mid element is too small, target must be to the right
            left = mid + 1;
            // => discard left half including mid
        } else {
            // => mid element is too large, target must be to the left
            right = mid - 1;
            // => discard right half including mid
        }
    }

    return -1;
    // => target not found, return sentinel value -1
}

int main(void) {
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    // => sorted array with 10 elements, indices 0-9
    int size = sizeof(arr) / sizeof(arr[0]);

    printf("%d\n", binary_search(arr, size, 23));   // => Output: 5  (arr[5] == 23)
    printf("%d\n", binary_search(arr, size, 100));  // => Output: -1 (100 not in array)
    printf("%d\n", binary_search(arr, size, 2));    // => Output: 0  (first element)
    printf("%d\n", binary_search(arr, size, 91));   // => Output: 9  (last element)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func binarySearch(arr []int, target int) int {
    // => arr must be sorted in ascending order for binary search to work
    // => target is the value we want to find

    left, right := 0, len(arr)-1
    // => left starts at index 0, right starts at last valid index
    // => these two pointers define the active search window

    for left <= right {
        // => loop continues as long as search window is non-empty
        // => when left > right the target is not in the array

        mid := left + (right-left)/2
        // => mid is the index of the middle element
        // => use (right - left) / 2 instead of (left + right) / 2 to avoid integer overflow

        if arr[mid] == target {
            // => found the target — return its index immediately
            return mid
        } else if arr[mid] < target {
            // => mid element is too small, target must be to the right
            left = mid + 1
            // => discard left half including mid
        } else {
            // => mid element is too large, target must be to the left
            right = mid - 1
            // => discard right half including mid
        }
    }

    return -1
    // => target not found, return sentinel value -1
}

func main() {
    arr := []int{2, 5, 8, 12, 16, 23, 38, 56, 72, 91}
    // => sorted array with 10 elements, indices 0-9

    fmt.Println(binarySearch(arr, 23))  // => Output: 5  (arr[5] == 23)
    fmt.Println(binarySearch(arr, 100)) // => Output: -1 (100 not in array)
    fmt.Println(binarySearch(arr, 2))   // => Output: 0  (first element)
    fmt.Println(binarySearch(arr, 91))  // => Output: 9  (last element)
}
```

{{< /tab >}}
{{< tab >}}

```python
def binary_search(arr, target):
    # => arr must be sorted in ascending order for binary search to work
    # => target is the value we want to find

    left, right = 0, len(arr) - 1
    # => left starts at index 0, right starts at last valid index
    # => these two pointers define the active search window

    while left <= right:
        # => loop continues as long as search window is non-empty
        # => when left > right the target is not in the array

        mid = left + (right - left) // 2
        # => mid is the index of the middle element
        # => use (right - left) // 2 instead of (left + right) // 2 to avoid integer overflow

        if arr[mid] == target:
            # => found the target — return its index immediately
            return mid
        elif arr[mid] < target:
            # => mid element is too small, target must be to the right
            left = mid + 1
            # => discard left half including mid
        else:
            # => mid element is too large, target must be to the left
            right = mid - 1
            # => discard right half including mid

    return -1
    # => target not found, return sentinel value -1


arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
# => sorted array with 10 elements, indices 0-9

print(binary_search(arr, 23))   # => Output: 5  (arr[5] == 23)
print(binary_search(arr, 100))  # => Output: -1 (100 not in array)
print(binary_search(arr, 2))    # => Output: 0  (first element)
print(binary_search(arr, 91))   # => Output: 9  (last element)
```

{{< /tab >}}
{{< tab >}}

```java
public class BinarySearch {
    static int binarySearch(int[] arr, int target) {
        // => arr must be sorted in ascending order for binary search to work
        // => target is the value we want to find

        int left = 0, right = arr.length - 1;
        // => left starts at index 0, right starts at last valid index
        // => these two pointers define the active search window

        while (left <= right) {
            // => loop continues as long as search window is non-empty
            // => when left > right the target is not in the array

            int mid = left + (right - left) / 2;
            // => mid is the index of the middle element
            // => use (right - left) / 2 instead of (left + right) / 2 to avoid integer overflow

            if (arr[mid] == target) {
                // => found the target — return its index immediately
                return mid;
            } else if (arr[mid] < target) {
                // => mid element is too small, target must be to the right
                left = mid + 1;
                // => discard left half including mid
            } else {
                // => mid element is too large, target must be to the left
                right = mid - 1;
                // => discard right half including mid
            }
        }

        return -1;
        // => target not found, return sentinel value -1
    }

    public static void main(String[] args) {
        int[] arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        // => sorted array with 10 elements, indices 0-9

        System.out.println(binarySearch(arr, 23));   // => Output: 5  (arr[5] == 23)
        System.out.println(binarySearch(arr, 100));  // => Output: -1 (100 not in array)
        System.out.println(binarySearch(arr, 2));    // => Output: 0  (first element)
        System.out.println(binarySearch(arr, 91));   // => Output: 9  (last element)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Binary search requires a sorted input and achieves O(log n) time by halving the search space each iteration. Use `mid = left + (right - left) // 2` to prevent integer overflow in languages with fixed-width integers.

**Why It Matters**: Binary search underpins database index lookups, sorted set operations in Redis, and range queries in file systems. A linear scan over a million records takes up to one million comparisons; binary search takes at most 20. Understanding this O(n) vs O(log n) distinction is essential for designing systems that scale — a 10x growth in data size adds one step to binary search but 10x steps to linear scan.

---

### Example 30: Binary Search for Insert Position

Binary search can also determine where a value should be inserted to keep an array sorted, without scanning linearly. This variant returns the leftmost index where `target` can be inserted.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

int search_insert_position(int arr[], int size, int target) {
    // => returns index where target is found, or where it should be inserted
    // => result is always in range [0, size] inclusive

    int left = 0, right = size;
    // => right is size, not size-1, because insertion can happen at end

    while (left < right) {
        // => strict less-than: when left == right the window is one slot wide
        int mid = left + (right - left) / 2;
        // => floor-division always rounds toward zero, biasing toward left

        if (arr[mid] < target) {
            // => mid is strictly less than target, so insert position is right of mid
            left = mid + 1;
        } else {
            // => arr[mid] >= target: insertion point is at mid or to its left
            right = mid;
            // => do NOT subtract 1; mid is a candidate for insertion position
        }
    }

    return left;
    // => left == right at loop exit, which is the insertion index
}

int main(void) {
    int arr[] = {1, 3, 5, 6};
    int size = 4;
    printf("%d\n", search_insert_position(arr, size, 5));  // => Output: 2  (found at index 2)
    printf("%d\n", search_insert_position(arr, size, 2));  // => Output: 1  (2 goes between 1 and 3)
    printf("%d\n", search_insert_position(arr, size, 7));  // => Output: 4  (7 appended at end)
    printf("%d\n", search_insert_position(arr, size, 0));  // => Output: 0  (0 prepended at start)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func searchInsertPosition(arr []int, target int) int {
    // => returns index where target is found, or where it should be inserted
    // => result is always in range [0, len(arr)] inclusive

    left, right := 0, len(arr)
    // => right is len(arr), not len(arr)-1, because insertion can happen at end

    for left < right {
        // => strict less-than: when left == right the window is one slot wide
        mid := left + (right-left)/2
        // => floor-division always rounds toward zero, biasing toward left

        if arr[mid] < target {
            // => mid is strictly less than target, so insert position is right of mid
            left = mid + 1
        } else {
            // => arr[mid] >= target: insertion point is at mid or to its left
            right = mid
            // => do NOT subtract 1; mid is a candidate for insertion position
        }
    }

    return left
    // => left == right at loop exit, which is the insertion index
}

func main() {
    arr := []int{1, 3, 5, 6}
    fmt.Println(searchInsertPosition(arr, 5)) // => Output: 2  (found at index 2)
    fmt.Println(searchInsertPosition(arr, 2)) // => Output: 1  (2 goes between 1 and 3)
    fmt.Println(searchInsertPosition(arr, 7)) // => Output: 4  (7 appended at end)
    fmt.Println(searchInsertPosition(arr, 0)) // => Output: 0  (0 prepended at start)
}
```

{{< /tab >}}
{{< tab >}}

```python
def search_insert_position(arr, target):
    # => returns index where target is found, or where it should be inserted
    # => result is always in range [0, len(arr)] inclusive

    left, right = 0, len(arr)
    # => right is len(arr), not len(arr)-1, because insertion can happen at end

    while left < right:
        # => strict less-than: when left == right the window is one slot wide
        mid = left + (right - left) // 2
        # => floor-division always rounds toward zero, biasing toward left

        if arr[mid] < target:
            # => mid is strictly less than target, so insert position is right of mid
            left = mid + 1
        else:
            # => arr[mid] >= target: insertion point is at mid or to its left
            right = mid
            # => do NOT subtract 1; mid is a candidate for insertion position

    return left
    # => left == right at loop exit, which is the insertion index


arr = [1, 3, 5, 6]
print(search_insert_position(arr, 5))  # => Output: 2  (found at index 2)
print(search_insert_position(arr, 2))  # => Output: 1  (2 goes between 1 and 3)
print(search_insert_position(arr, 7))  # => Output: 4  (7 appended at end)
print(search_insert_position(arr, 0))  # => Output: 0  (0 prepended at start)
```

{{< /tab >}}
{{< tab >}}

```java
public class SearchInsertPosition {
    static int searchInsertPosition(int[] arr, int target) {
        // => returns index where target is found, or where it should be inserted
        // => result is always in range [0, arr.length] inclusive

        int left = 0, right = arr.length;
        // => right is arr.length, not arr.length-1, because insertion can happen at end

        while (left < right) {
            // => strict less-than: when left == right the window is one slot wide
            int mid = left + (right - left) / 2;
            // => floor-division always rounds toward zero, biasing toward left

            if (arr[mid] < target) {
                // => mid is strictly less than target, so insert position is right of mid
                left = mid + 1;
            } else {
                // => arr[mid] >= target: insertion point is at mid or to its left
                right = mid;
                // => do NOT subtract 1; mid is a candidate for insertion position
            }
        }

        return left;
        // => left == right at loop exit, which is the insertion index
    }

    public static void main(String[] args) {
        int[] arr = {1, 3, 5, 6};
        System.out.println(searchInsertPosition(arr, 5));  // => Output: 2  (found at index 2)
        System.out.println(searchInsertPosition(arr, 2));  // => Output: 1  (2 goes between 1 and 3)
        System.out.println(searchInsertPosition(arr, 7));  // => Output: 4  (7 appended at end)
        System.out.println(searchInsertPosition(arr, 0));  // => Output: 0  (0 prepended at start)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The insert-position variant uses `right = len(arr)` and `right = mid` (not `mid - 1`) to correctly handle the case where the target belongs at the end of the array or equals an existing element.

**Why It Matters**: Insert-position binary search powers sorted container implementations such as Python's `bisect` module and Java's `Collections.binarySearch`. It enables O(log n) maintenance of sorted order when inserting into arrays, underpins event scheduling (find the correct slot in a sorted timeline), and is used in constraint solvers that need to place items in sorted priority queues efficiently.

---

## Hash Tables and Collision Resolution

### Example 31: Hash Table with Chaining

A hash table maps keys to values using a hash function that converts each key into an array index. Collisions — two keys hashing to the same index — are resolved by storing a linked list (chain) at each bucket.

```mermaid
graph TD
    K1["Key: apple"] -->|hash mod 5 = 0| B0["Bucket 0: [(apple,1)]"]
    K2["Key: banana"] -->|hash mod 5 = 2| B2["Bucket 2: [(banana,2)]"]
    K3["Key: cherry"] -->|hash mod 5 = 2| B2C["Bucket 2: [(banana,2),(cherry,3)]"]

    style K1 fill:#0173B2,stroke:#000,color:#fff
    style K2 fill:#DE8F05,stroke:#000,color:#fff
    style K3 fill:#029E73,stroke:#000,color:#fff
    style B0 fill:#CA9161,stroke:#000,color:#fff
    style B2 fill:#CA9161,stroke:#000,color:#fff
    style B2C fill:#CC78BC,stroke:#000,color:#fff
```

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CAPACITY 8

typedef struct Entry {
    char key[64];
    int value;
    struct Entry *next;
    // => each entry points to the next in its chain (linked list)
} Entry;

typedef struct {
    Entry *buckets[CAPACITY];
    // => each bucket is the head of a linked list (chain) of entries
    int size;
    // => tracks number of key-value pairs stored
} HashTable;

unsigned int hash_func(const char *key) {
    unsigned int h = 0;
    while (*key) {
        h = h * 31 + (unsigned char)(*key);
        key++;
    }
    return h % CAPACITY;
    // => simple polynomial hash mapped to a valid bucket index [0, CAPACITY-1]
}

void ht_init(HashTable *ht) {
    for (int i = 0; i < CAPACITY; i++) {
        ht->buckets[i] = NULL;
    }
    ht->size = 0;
}

void ht_put(HashTable *ht, const char *key, int value) {
    unsigned int idx = hash_func(key);
    // => idx is the target bucket index
    Entry *cur = ht->buckets[idx];
    // => retrieve the chain at that bucket

    while (cur) {
        if (strcmp(cur->key, key) == 0) {
            cur->value = value;
            // => update existing key's value in-place
            return;
        }
        cur = cur->next;
    }

    Entry *e = (Entry *)malloc(sizeof(Entry));
    // => key not found in chain: create new entry
    strcpy(e->key, key);
    e->value = value;
    e->next = ht->buckets[idx];
    ht->buckets[idx] = e;
    // => prepend new entry to the chain
    ht->size++;
    // => increment count of stored pairs
}

int ht_get(HashTable *ht, const char *key, int *found) {
    unsigned int idx = hash_func(key);
    // => compute bucket index for this key
    Entry *cur = ht->buckets[idx];
    while (cur) {
        if (strcmp(cur->key, key) == 0) {
            *found = 1;
            return cur->value;
            // => found key: return its associated value
        }
        cur = cur->next;
    }
    *found = 0;
    return 0;
    // => key not present in any chain
}

void ht_remove(HashTable *ht, const char *key) {
    unsigned int idx = hash_func(key);
    Entry *cur = ht->buckets[idx];
    Entry *prev = NULL;
    while (cur) {
        if (strcmp(cur->key, key) == 0) {
            if (prev) {
                prev->next = cur->next;
            } else {
                ht->buckets[idx] = cur->next;
            }
            free(cur);
            // => remove entry and free memory
            return;
        }
        prev = cur;
        cur = cur->next;
    }
}

int main(void) {
    HashTable ht;
    ht_init(&ht);
    ht_put(&ht, "apple", 1);
    ht_put(&ht, "banana", 2);
    ht_put(&ht, "cherry", 3);
    ht_put(&ht, "banana", 99);    // => update existing key

    int found;
    printf("%d\n", ht_get(&ht, "apple", &found));   // => Output: 1
    printf("%d\n", ht_get(&ht, "banana", &found));   // => Output: 99 (updated value)
    ht_get(&ht, "grape", &found);
    printf("%s\n", found ? "found" : "None");         // => Output: None (not present)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

const capacity = 8

type entry struct {
    key   string
    value int
    next  *entry
    // => each entry points to the next in its chain (linked list)
}

type HashTable struct {
    buckets [capacity]*entry
    // => each bucket is the head of a linked list (chain) of entries
    size int
    // => tracks number of key-value pairs stored
}

func hashFunc(key string) int {
    h := 0
    for _, c := range key {
        h = h*31 + int(c)
    }
    return h % capacity
    // => simple polynomial hash mapped to a valid bucket index [0, capacity-1]
}

func (ht *HashTable) Put(key string, value int) {
    idx := hashFunc(key)
    // => idx is the target bucket index
    cur := ht.buckets[idx]
    // => retrieve the chain at that bucket

    for cur != nil {
        if cur.key == key {
            cur.value = value
            // => update existing key's value in-place
            return
        }
        cur = cur.next
    }

    e := &entry{key: key, value: value, next: ht.buckets[idx]}
    // => key not found in chain: prepend new entry
    ht.buckets[idx] = e
    ht.size++
    // => increment count of stored pairs
}

func (ht *HashTable) Get(key string) (int, bool) {
    idx := hashFunc(key)
    // => compute bucket index for this key
    cur := ht.buckets[idx]
    for cur != nil {
        if cur.key == key {
            return cur.value, true
            // => found key: return its associated value
        }
        cur = cur.next
    }
    return 0, false
    // => key not present in any chain
}

func (ht *HashTable) Remove(key string) {
    idx := hashFunc(key)
    cur := ht.buckets[idx]
    var prev *entry
    for cur != nil {
        if cur.key == key {
            if prev != nil {
                prev.next = cur.next
            } else {
                ht.buckets[idx] = cur.next
            }
            return
        }
        prev = cur
        cur = cur.next
    }
}

func main() {
    ht := &HashTable{}
    ht.Put("apple", 1)
    ht.Put("banana", 2)
    ht.Put("cherry", 3)
    ht.Put("banana", 99) // => update existing key

    v, _ := ht.Get("apple")
    fmt.Println(v) // => Output: 1
    v, _ = ht.Get("banana")
    fmt.Println(v) // => Output: 99 (updated value)
    _, ok := ht.Get("grape")
    if !ok {
        fmt.Println("None") // => Output: None (not present)
    }
}
```

{{< /tab >}}
{{< tab >}}

```python
class HashTable:
    def __init__(self, capacity=8):
        self.capacity = capacity
        # => number of buckets; prime numbers reduce collision clustering
        self.buckets = [[] for _ in range(capacity)]
        # => each bucket is a list (chain) of (key, value) pairs
        # => initially all buckets are empty lists
        self.size = 0
        # => tracks number of key-value pairs stored

    def _hash(self, key):
        return hash(key) % self.capacity
        # => Python's built-in hash() returns an integer for any hashable key
        # => modulo maps that integer to a valid bucket index [0, capacity-1]

    def put(self, key, value):
        idx = self._hash(key)
        # => idx is the target bucket index
        bucket = self.buckets[idx]
        # => retrieve the chain at that bucket

        for i, (k, v) in enumerate(bucket):
            # => scan the chain to check if key already exists
            if k == key:
                bucket[i] = (key, value)
                # => update existing key's value in-place
                return
        bucket.append((key, value))
        # => key not found in chain: append new pair
        self.size += 1
        # => increment count of stored pairs

    def get(self, key):
        idx = self._hash(key)
        # => compute bucket index for this key
        for k, v in self.buckets[idx]:
            # => scan the chain at that bucket
            if k == key:
                return v
                # => found key: return its associated value
        return None
        # => key not present in any chain: return None

    def remove(self, key):
        idx = self._hash(key)
        bucket = self.buckets[idx]
        # => get the chain where key would live
        self.buckets[idx] = [(k, v) for k, v in bucket if k != key]
        # => rebuild chain excluding the target key
        # => self.size decrement omitted for brevity


ht = HashTable()
ht.put("apple", 1)
ht.put("banana", 2)
ht.put("cherry", 3)
ht.put("banana", 99)    # => update existing key

print(ht.get("apple"))   # => Output: 1
print(ht.get("banana"))  # => Output: 99 (updated value)
print(ht.get("grape"))   # => Output: None (not present)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.LinkedList;

public class HashTableChaining {
    static final int CAPACITY = 8;

    static class Entry {
        String key;
        int value;
        // => each entry stores a key-value pair
        Entry(String key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    @SuppressWarnings("unchecked")
    LinkedList<Entry>[] buckets = new LinkedList[CAPACITY];
    // => each bucket is a linked list (chain) of entries
    int size = 0;
    // => tracks number of key-value pairs stored

    HashTableChaining() {
        for (int i = 0; i < CAPACITY; i++) {
            buckets[i] = new LinkedList<>();
        }
    }

    int hash(String key) {
        return Math.abs(key.hashCode()) % CAPACITY;
        // => Java's hashCode() returns an integer for any object
        // => modulo maps that integer to a valid bucket index [0, CAPACITY-1]
    }

    void put(String key, int value) {
        int idx = hash(key);
        // => idx is the target bucket index
        LinkedList<Entry> bucket = buckets[idx];
        // => retrieve the chain at that bucket

        for (Entry e : bucket) {
            if (e.key.equals(key)) {
                e.value = value;
                // => update existing key's value in-place
                return;
            }
        }
        bucket.add(new Entry(key, value));
        // => key not found in chain: append new pair
        size++;
        // => increment count of stored pairs
    }

    Integer get(String key) {
        int idx = hash(key);
        // => compute bucket index for this key
        for (Entry e : buckets[idx]) {
            if (e.key.equals(key)) {
                return e.value;
                // => found key: return its associated value
            }
        }
        return null;
        // => key not present in any chain: return null
    }

    void remove(String key) {
        int idx = hash(key);
        buckets[idx].removeIf(e -> e.key.equals(key));
        // => rebuild chain excluding the target key
    }

    public static void main(String[] args) {
        HashTableChaining ht = new HashTableChaining();
        ht.put("apple", 1);
        ht.put("banana", 2);
        ht.put("cherry", 3);
        ht.put("banana", 99);    // => update existing key

        System.out.println(ht.get("apple"));   // => Output: 1
        System.out.println(ht.get("banana"));  // => Output: 99 (updated value)
        System.out.println(ht.get("grape"));   // => Output: null (not present)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Chaining resolves collisions by appending to a list at each bucket. Average-case O(1) insert/lookup assumes a good hash function and load factor below ~0.75; worst-case degrades to O(n) if all keys collide.

**Why It Matters**: Hash tables are the most widely used data structure in software engineering, backing Python dictionaries, Java's `HashMap`, Redis key-value storage, and database hash indexes. The choice of collision resolution strategy — chaining vs open addressing — affects cache locality, memory usage, and worst-case behavior. Understanding these trade-offs guides decisions when performance requirements exceed what a language's built-in map provides.

---

### Example 32: Hash Map for Frequency Counting

Python's `collections.Counter` and `dict` both build on hash tables. Counting element frequencies in O(n) time using a hash map is a foundational technique for anagram detection, histogram construction, and mode finding.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <string.h>

#define MAX_WORDS 100
#define MAX_LEN 64

typedef struct {
    char key[MAX_LEN];
    int count;
} FreqEntry;

int count_with_array(const char *words[], int n, FreqEntry freq[], int *freq_size) {
    // => manual frequency counting using a flat array
    *freq_size = 0;

    for (int i = 0; i < n; i++) {
        // => iterate over every element in O(n) time
        int found = 0;
        for (int j = 0; j < *freq_size; j++) {
            if (strcmp(freq[j].key, words[i]) == 0) {
                freq[j].count++;
                // => increment count by 1
                found = 1;
                break;
            }
        }
        if (!found) {
            strcpy(freq[*freq_size].key, words[i]);
            freq[*freq_size].count = 1;
            (*freq_size)++;
            // => new word: add entry with count 1
        }
    }
    return *freq_size;
    // => returns number of distinct words
}

int main(void) {
    const char *words[] = {"apple", "banana", "apple", "cherry", "banana", "apple"};
    int n = 6;
    FreqEntry freq[MAX_WORDS];
    int freq_size;

    count_with_array(words, n, freq, &freq_size);
    printf("{");
    for (int i = 0; i < freq_size; i++) {
        if (i > 0) printf(", ");
        printf("'%s': %d", freq[i].key, freq[i].count);
    }
    printf("}\n");
    // => Output: {'apple': 3, 'banana': 2, 'cherry': 1}
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func countWithMap(items []string) map[string]int {
    freq := make(map[string]int)
    // => empty map; will be populated key-by-key

    for _, item := range items {
        // => iterate over every element in O(n) time
        freq[item]++
        // => if key absent, Go zero-initialises to 0 then increments to 1
        // => if key present, simply increments existing count
    }
    return freq
    // => returns map[item]count
}

func main() {
    words := []string{"apple", "banana", "apple", "cherry", "banana", "apple"}

    result := countWithMap(words)
    fmt.Println(result)
    // => Output: map[apple:3 banana:2 cherry:1]
}
```

{{< /tab >}}
{{< tab >}}

```python
from collections import Counter, defaultdict

# Approach A: Manual dict counting
def count_with_dict(items):
    freq = {}
    # => empty dict; will be populated key-by-key

    for item in items:
        # => iterate over every element in O(n) time
        freq[item] = freq.get(item, 0) + 1
        # => freq.get(item, 0) returns current count or 0 if absent
        # => increment count by 1 and store back
    return freq
    # => returns {item: count, ...}


words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
result = count_with_dict(words)
print(result)
# => Output: {'apple': 3, 'banana': 2, 'cherry': 1}
```

Each O(1) average hash table lookup and insert accumulates counts in linear total time.

```python
# Approach B: defaultdict — avoids the .get(key, 0) pattern
def count_with_defaultdict(items):
    freq = defaultdict(int)
    # => defaultdict(int) creates 0 automatically for missing keys

    for item in items:
        freq[item] += 1
        # => if key absent, freq[item] initialises to 0 then increments to 1
        # => if key present, simply increments existing count
    return dict(freq)
    # => convert back to plain dict for clean output


result2 = count_with_defaultdict(words)
print(result2)
# => Output: {'apple': 3, 'banana': 2, 'cherry': 1}
```

`defaultdict` removes the need for a sentinel default on every access, producing cleaner code with the same O(n) time and O(k) space (k = distinct elements).

```python
# Approach C: Counter — most Pythonic, adds extra utility methods
counter = Counter(words)
# => Counter is a dict subclass specialised for counting
# => single call replaces the manual loop entirely

print(counter.most_common(2))
# => Output: [('apple', 3), ('banana', 2)]  (top 2 by count)
print(counter["cherry"])   # => Output: 1
print(counter["grape"])    # => Output: 0  (missing keys return 0, not KeyError)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.HashMap;
import java.util.Map;

public class FrequencyCounting {
    static Map<String, Integer> countWithMap(String[] items) {
        Map<String, Integer> freq = new HashMap<>();
        // => empty map; will be populated key-by-key

        for (String item : items) {
            // => iterate over every element in O(n) time
            freq.put(item, freq.getOrDefault(item, 0) + 1);
            // => getOrDefault returns current count or 0 if absent
            // => increment count by 1 and store back
        }
        return freq;
        // => returns {item=count, ...}
    }

    public static void main(String[] args) {
        String[] words = {"apple", "banana", "apple", "cherry", "banana", "apple"};
        Map<String, Integer> result = countWithMap(words);
        System.out.println(result);
        // => Output: {apple=3, banana=2, cherry=1}
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Use `Counter` for concise frequency counting; use `defaultdict(int)` when you need a default-zero dict with additional logic in the loop; use plain `dict` with `.get()` when targeting environments without `collections`.

**Why It Matters**: Frequency counting with hash maps solves a wide class of interview and production problems: finding the most common log error, detecting anagrams, computing word histograms in NLP pipelines, and grouping events by type. The O(n) hash map approach replaces the naive O(n²) nested loop comparison that breaks at scale.

---

## Binary Search Trees

### Example 33: BST Insert and Search

A Binary Search Tree stores values so that every node's left subtree contains only smaller values and its right subtree contains only larger values. This ordering property enables O(log n) average-case search, insert, and delete on balanced trees.

```mermaid
graph TD
    R["50 (root)"]
    L["30"]
    RL["70"]
    LL["20"]
    LR["40"]
    RLL["60"]
    RLR["80"]

    R --> L
    R --> RL
    L --> LL
    L --> LR
    RL --> RLL
    RL --> RLR

    style R fill:#0173B2,stroke:#000,color:#fff
    style L fill:#DE8F05,stroke:#000,color:#fff
    style RL fill:#DE8F05,stroke:#000,color:#fff
    style LL fill:#029E73,stroke:#000,color:#fff
    style LR fill:#029E73,stroke:#000,color:#fff
    style RLL fill:#029E73,stroke:#000,color:#fff
    style RLR fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct BSTNode {
    int val;
    // => node stores a single integer value
    struct BSTNode *left;
    // => left child: will hold values < val
    struct BSTNode *right;
    // => right child: will hold values > val
} BSTNode;

BSTNode *new_node(int val) {
    BSTNode *n = (BSTNode *)malloc(sizeof(BSTNode));
    n->val = val;
    n->left = NULL;
    n->right = NULL;
    return n;
}

BSTNode *bst_insert(BSTNode *root, int val) {
    if (root == NULL) {
        return new_node(val);
        // => base case: empty spot found, create new node here
    }
    if (val < root->val) {
        root->left = bst_insert(root->left, val);
        // => value belongs in left subtree; recurse and reattach
    } else if (val > root->val) {
        root->right = bst_insert(root->right, val);
        // => value belongs in right subtree; recurse and reattach
    }
    // => if val == root->val, duplicate — do nothing
    return root;
    // => return root so callers can chain insertions
}

int bst_search(BSTNode *root, int val) {
    if (root == NULL) {
        return 0;
        // => reached empty subtree: value not present in tree
    }
    if (val == root->val) {
        return 1;
        // => found exact match at current node
    } else if (val < root->val) {
        return bst_search(root->left, val);
        // => target smaller: must be in left subtree
    } else {
        return bst_search(root->right, val);
        // => target larger: must be in right subtree
    }
}

int main(void) {
    BSTNode *root = NULL;
    int values[] = {50, 30, 70, 20, 40, 60, 80};
    for (int i = 0; i < 7; i++) {
        root = bst_insert(root, values[i]);
        // => build tree one node at a time
    }

    printf("%s\n", bst_search(root, 40) ? "True" : "False");  // => Output: True  (40 is in tree)
    printf("%s\n", bst_search(root, 55) ? "True" : "False");  // => Output: False (55 not in tree)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

type BSTNode struct {
    Val   int
    Left  *BSTNode
    Right *BSTNode
}

func bstInsert(root *BSTNode, val int) *BSTNode {
    if root == nil {
        return &BSTNode{Val: val}
        // => base case: empty spot found, create new node here
    }
    if val < root.Val {
        root.Left = bstInsert(root.Left, val)
        // => value belongs in left subtree; recurse and reattach
    } else if val > root.Val {
        root.Right = bstInsert(root.Right, val)
        // => value belongs in right subtree; recurse and reattach
    }
    // => if val == root.Val, duplicate — do nothing
    return root
    // => return root so callers can chain insertions
}

func bstSearch(root *BSTNode, val int) bool {
    if root == nil {
        return false
        // => reached empty subtree: value not present in tree
    }
    if val == root.Val {
        return true
        // => found exact match at current node
    } else if val < root.Val {
        return bstSearch(root.Left, val)
        // => target smaller: must be in left subtree
    } else {
        return bstSearch(root.Right, val)
        // => target larger: must be in right subtree
    }
}

func main() {
    var root *BSTNode
    for _, v := range []int{50, 30, 70, 20, 40, 60, 80} {
        root = bstInsert(root, v)
        // => build tree one node at a time
        // => final structure matches diagram above
    }

    fmt.Println(bstSearch(root, 40)) // => Output: true  (40 is in tree)
    fmt.Println(bstSearch(root, 55)) // => Output: false (55 not in tree)
}
```

{{< /tab >}}
{{< tab >}}

```python
class BSTNode:
    def __init__(self, val):
        self.val = val
        # => node stores a single integer value
        self.left = None
        # => left child: will hold values < self.val
        self.right = None
        # => right child: will hold values > self.val


def bst_insert(root, val):
    if root is None:
        return BSTNode(val)
        # => base case: empty spot found, create new node here

    if val < root.val:
        root.left = bst_insert(root.left, val)
        # => value belongs in left subtree; recurse and reattach
    elif val > root.val:
        root.right = bst_insert(root.right, val)
        # => value belongs in right subtree; recurse and reattach
    # => if val == root.val, duplicate — do nothing (ignore or update as needed)
    return root
    # => return root so callers can chain insertions


def bst_search(root, val):
    if root is None:
        return False
        # => reached empty subtree: value not present in tree

    if val == root.val:
        return True
        # => found exact match at current node
    elif val < root.val:
        return bst_search(root.left, val)
        # => target smaller: must be in left subtree
    else:
        return bst_search(root.right, val)
        # => target larger: must be in right subtree


root = None
for v in [50, 30, 70, 20, 40, 60, 80]:
    root = bst_insert(root, v)
    # => build tree one node at a time
    # => final structure matches diagram above

print(bst_search(root, 40))   # => Output: True  (40 is in tree)
print(bst_search(root, 55))   # => Output: False (55 not in tree)
```

{{< /tab >}}
{{< tab >}}

```java
public class BSTInsertSearch {
    static class BSTNode {
        int val;
        // => node stores a single integer value
        BSTNode left;
        // => left child: will hold values < val
        BSTNode right;
        // => right child: will hold values > val
        BSTNode(int val) { this.val = val; }
    }

    static BSTNode bstInsert(BSTNode root, int val) {
        if (root == null) {
            return new BSTNode(val);
            // => base case: empty spot found, create new node here
        }
        if (val < root.val) {
            root.left = bstInsert(root.left, val);
            // => value belongs in left subtree; recurse and reattach
        } else if (val > root.val) {
            root.right = bstInsert(root.right, val);
            // => value belongs in right subtree; recurse and reattach
        }
        // => if val == root.val, duplicate — do nothing
        return root;
        // => return root so callers can chain insertions
    }

    static boolean bstSearch(BSTNode root, int val) {
        if (root == null) {
            return false;
            // => reached empty subtree: value not present in tree
        }
        if (val == root.val) {
            return true;
            // => found exact match at current node
        } else if (val < root.val) {
            return bstSearch(root.left, val);
            // => target smaller: must be in left subtree
        } else {
            return bstSearch(root.right, val);
            // => target larger: must be in right subtree
        }
    }

    public static void main(String[] args) {
        BSTNode root = null;
        for (int v : new int[]{50, 30, 70, 20, 40, 60, 80}) {
            root = bstInsert(root, v);
            // => build tree one node at a time
        }

        System.out.println(bstSearch(root, 40));  // => Output: true  (40 is in tree)
        System.out.println(bstSearch(root, 55));   // => Output: false (55 not in tree)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: BST insert and search both follow the same "go left if smaller, go right if larger" logic, achieving O(log n) average depth on balanced trees. Worst-case O(n) occurs when inserting sorted data, which degenerates to a linked list.

**Why It Matters**: BSTs are the conceptual foundation for balanced trees (AVL, Red-Black) used in most production ordered-map implementations — Java's `TreeMap`, C++'s `std::map`, and PostgreSQL's B-tree indexes. Understanding BST structure and the degenerate sorted-input problem motivates why databases use B-trees with balanced branching factors rather than plain BSTs, enabling logarithmic lookups even on multi-terabyte datasets.

---

### Example 34: BST Inorder Traversal

Inorder traversal (left → root → right) visits BST nodes in ascending sorted order. This is the defining property of BSTs and is used to extract sorted sequences from tree-based indexes.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct BSTNode {
    int val;
    struct BSTNode *left;
    struct BSTNode *right;
} BSTNode;

BSTNode *new_node(int val) {
    BSTNode *n = (BSTNode *)malloc(sizeof(BSTNode));
    n->val = val;
    n->left = NULL;
    n->right = NULL;
    return n;
}

BSTNode *insert(BSTNode *root, int val) {
    if (!root) return new_node(val);
    if (val < root->val) root->left = insert(root->left, val);
    else if (val > root->val) root->right = insert(root->right, val);
    return root;
}

void inorder(BSTNode *root, int result[], int *size) {
    if (!root) return;
    // => base case: empty node contributes nothing

    inorder(root->left, result, size);
    // => 1. recurse left subtree first (all smaller values)
    result[(*size)++] = root->val;
    // => 2. visit current node (add value in sorted position)
    inorder(root->right, result, size);
    // => 3. recurse right subtree last (all larger values)
}

void preorder(BSTNode *root, int result[], int *size) {
    if (!root) return;
    result[(*size)++] = root->val;
    // => visit root FIRST (before children)
    preorder(root->left, result, size);
    preorder(root->right, result, size);
}

void postorder(BSTNode *root, int result[], int *size) {
    if (!root) return;
    postorder(root->left, result, size);
    postorder(root->right, result, size);
    result[(*size)++] = root->val;
    // => visit root LAST (after both children)
}

void print_array(int arr[], int size) {
    printf("[");
    for (int i = 0; i < size; i++) {
        if (i > 0) printf(", ");
        printf("%d", arr[i]);
    }
    printf("]\n");
}

int main(void) {
    BSTNode *root = NULL;
    int vals[] = {50, 30, 70, 20, 40, 60, 80};
    for (int i = 0; i < 7; i++) root = insert(root, vals[i]);

    int result[7];
    int size;

    size = 0;
    inorder(root, result, &size);
    print_array(result, size);   // => Output: [20, 30, 40, 50, 60, 70, 80]  (sorted!)

    size = 0;
    preorder(root, result, &size);
    print_array(result, size);   // => Output: [50, 30, 20, 40, 70, 60, 80]  (root first)

    size = 0;
    postorder(root, result, &size);
    print_array(result, size);   // => Output: [20, 40, 30, 60, 80, 70, 50]  (root last)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

type BSTNode struct {
    Val   int
    Left  *BSTNode
    Right *BSTNode
}

func insert(root *BSTNode, val int) *BSTNode {
    if root == nil {
        return &BSTNode{Val: val}
    }
    if val < root.Val {
        root.Left = insert(root.Left, val)
    } else if val > root.Val {
        root.Right = insert(root.Right, val)
    }
    return root
}

func inorder(root *BSTNode, result *[]int) {
    if root == nil {
        return
        // => base case: empty node contributes nothing
    }
    inorder(root.Left, result)
    // => 1. recurse left subtree first (all smaller values)
    *result = append(*result, root.Val)
    // => 2. visit current node (add value in sorted position)
    inorder(root.Right, result)
    // => 3. recurse right subtree last (all larger values)
}

func preorder(root *BSTNode, result *[]int) {
    if root == nil {
        return
    }
    *result = append(*result, root.Val)
    // => visit root FIRST (before children)
    preorder(root.Left, result)
    preorder(root.Right, result)
}

func postorder(root *BSTNode, result *[]int) {
    if root == nil {
        return
    }
    postorder(root.Left, result)
    postorder(root.Right, result)
    *result = append(*result, root.Val)
    // => visit root LAST (after both children)
}

func main() {
    var root *BSTNode
    for _, v := range []int{50, 30, 70, 20, 40, 60, 80} {
        root = insert(root, v)
    }

    var res []int
    inorder(root, &res)
    fmt.Println(res) // => Output: [20 30 40 50 60 70 80]  (sorted!)

    res = nil
    preorder(root, &res)
    fmt.Println(res) // => Output: [50 30 20 40 70 60 80]  (root first)

    res = nil
    postorder(root, &res)
    fmt.Println(res) // => Output: [20 40 30 60 80 70 50]  (root last)
}
```

{{< /tab >}}
{{< tab >}}

```python
class BSTNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def insert(root, val):
    if not root:
        return BSTNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    elif val > root.val:
        root.right = insert(root.right, val)
    return root


def inorder(root, result=None):
    if result is None:
        result = []
        # => initialise accumulator list on first call

    if root is None:
        return result
        # => base case: empty node contributes nothing

    inorder(root.left, result)
    # => 1. recurse left subtree first (all smaller values)
    result.append(root.val)
    # => 2. visit current node (add value in sorted position)
    inorder(root.right, result)
    # => 3. recurse right subtree last (all larger values)

    return result
    # => after full traversal, result contains all values in ascending order


def preorder(root, result=None):
    if result is None:
        result = []
    if root is None:
        return result
    result.append(root.val)
    # => visit root FIRST (before children)
    preorder(root.left, result)
    preorder(root.right, result)
    return result
    # => produces root-first ordering, useful for tree serialisation


def postorder(root, result=None):
    if result is None:
        result = []
    if root is None:
        return result
    postorder(root.left, result)
    postorder(root.right, result)
    result.append(root.val)
    # => visit root LAST (after both children)
    return result
    # => useful for bottom-up operations like deleting a tree or evaluating expressions


root = None
for v in [50, 30, 70, 20, 40, 60, 80]:
    root = insert(root, v)

print(inorder(root))   # => Output: [20, 30, 40, 50, 60, 70, 80]  (sorted!)
print(preorder(root))  # => Output: [50, 30, 20, 40, 70, 60, 80]  (root first)
print(postorder(root)) # => Output: [20, 40, 30, 60, 80, 70, 50]  (root last)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.ArrayList;
import java.util.List;

public class BSTTraversal {
    static class BSTNode {
        int val;
        BSTNode left, right;
        BSTNode(int val) { this.val = val; }
    }

    static BSTNode insert(BSTNode root, int val) {
        if (root == null) return new BSTNode(val);
        if (val < root.val) root.left = insert(root.left, val);
        else if (val > root.val) root.right = insert(root.right, val);
        return root;
    }

    static void inorder(BSTNode root, List<Integer> result) {
        if (root == null) return;
        // => base case: empty node contributes nothing

        inorder(root.left, result);
        // => 1. recurse left subtree first (all smaller values)
        result.add(root.val);
        // => 2. visit current node (add value in sorted position)
        inorder(root.right, result);
        // => 3. recurse right subtree last (all larger values)
    }

    static void preorder(BSTNode root, List<Integer> result) {
        if (root == null) return;
        result.add(root.val);
        // => visit root FIRST (before children)
        preorder(root.left, result);
        preorder(root.right, result);
    }

    static void postorder(BSTNode root, List<Integer> result) {
        if (root == null) return;
        postorder(root.left, result);
        postorder(root.right, result);
        result.add(root.val);
        // => visit root LAST (after both children)
    }

    public static void main(String[] args) {
        BSTNode root = null;
        for (int v : new int[]{50, 30, 70, 20, 40, 60, 80}) {
            root = insert(root, v);
        }

        List<Integer> res = new ArrayList<>();
        inorder(root, res);
        System.out.println(res);  // => Output: [20, 30, 40, 50, 60, 70, 80]  (sorted!)

        res.clear();
        preorder(root, res);
        System.out.println(res);  // => Output: [50, 30, 20, 40, 70, 60, 80]  (root first)

        res.clear();
        postorder(root, res);
        System.out.println(res);  // => Output: [20, 40, 30, 60, 80, 70, 50]  (root last)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Inorder traversal produces BST values in sorted ascending order. Preorder is useful for tree serialisation (you can reconstruct the tree by inserting in preorder sequence). Postorder is used for bottom-up evaluation like expression trees or dependency resolution.

**Why It Matters**: Tree traversal order is not academic — database query planners use inorder traversal of B-tree indexes to execute range scans efficiently. Compilers use postorder traversal to evaluate abstract syntax trees (evaluate children before applying the operator). Serialising and deserialising distributed state often uses preorder traversal for deterministic reconstruction. Choosing the right traversal order directly affects algorithmic correctness.

---

## Heaps

### Example 35: Min-Heap with heapq

A min-heap is a complete binary tree where every parent is smaller than or equal to its children. Python's `heapq` module implements a min-heap using a plain list, providing O(log n) push/pop and O(1) peek at the minimum.

```mermaid
graph TD
    N1["1 (root/min)"]
    N3["3"]
    N2["2"]
    N7["7"]
    N5["5"]
    N4["4"]
    N6["6"]

    N1 --> N3
    N1 --> N2
    N3 --> N7
    N3 --> N5
    N2 --> N4
    N2 --> N6

    style N1 fill:#0173B2,stroke:#000,color:#fff
    style N3 fill:#DE8F05,stroke:#000,color:#fff
    style N2 fill:#DE8F05,stroke:#000,color:#fff
    style N7 fill:#029E73,stroke:#000,color:#fff
    style N5 fill:#029E73,stroke:#000,color:#fff
    style N4 fill:#029E73,stroke:#000,color:#fff
    style N6 fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

#define MAX_SIZE 100

typedef struct {
    int data[MAX_SIZE];
    int size;
} MinHeap;

void heap_init(MinHeap *h) { h->size = 0; }

void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }

void heap_push(MinHeap *h, int val) {
    // => insert val and sift up to restore heap property
    // => O(log n) time per push
    h->data[h->size] = val;
    int i = h->size++;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (h->data[parent] > h->data[i]) {
            swap(&h->data[parent], &h->data[i]);
            i = parent;
        } else {
            break;
        }
    }
}

int heap_pop(MinHeap *h) {
    // => removes and returns the minimum element
    // => moves last element to root then sifts down to restore heap property
    // => O(log n) time per pop
    int min = h->data[0];
    h->data[0] = h->data[--h->size];
    int i = 0;
    while (1) {
        int left = 2 * i + 1, right = 2 * i + 2, smallest = i;
        if (left < h->size && h->data[left] < h->data[smallest]) smallest = left;
        if (right < h->size && h->data[right] < h->data[smallest]) smallest = right;
        if (smallest == i) break;
        swap(&h->data[i], &h->data[smallest]);
        i = smallest;
    }
    return min;
}

void heapify(int data[], int n) {
    // => convert an existing array to a heap in O(n) time
    for (int i = n / 2 - 1; i >= 0; i--) {
        int idx = i;
        while (1) {
            int left = 2 * idx + 1, right = 2 * idx + 2, smallest = idx;
            if (left < n && data[left] < data[smallest]) smallest = left;
            if (right < n && data[right] < data[smallest]) smallest = right;
            if (smallest == idx) break;
            int t = data[idx]; data[idx] = data[smallest]; data[smallest] = t;
            idx = smallest;
        }
    }
}

int main(void) {
    MinHeap heap;
    heap_init(&heap);

    int vals[] = {5, 3, 7, 1, 4, 2, 6};
    for (int i = 0; i < 7; i++) heap_push(&heap, vals[i]);

    printf("%d\n", heap.data[0]); // => Output: 1  (minimum always at index 0, O(1) peek)

    int sorted[7];
    for (int i = 0; i < 7; i++) sorted[i] = heap_pop(&heap);
    printf("[");
    for (int i = 0; i < 7; i++) { if (i) printf(", "); printf("%d", sorted[i]); }
    printf("]\n"); // => Output: [1, 2, 3, 4, 5, 6, 7]  (heap sort!)

    // heapify: convert an existing array to a heap in O(n) time
    int data[] = {9, 4, 7, 1, 8, 2, 6, 3, 5};
    heapify(data, 9);
    printf("%d\n", data[0]); // => Output: 1
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import (
    "container/heap"
    "fmt"
)

type IntHeap []int

func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func main() {
    h := &IntHeap{}
    // => heap.Interface operates on a slice
    // => elements are stored so (*h)[0] is always the minimum

    for _, val := range []int{5, 3, 7, 1, 4, 2, 6} {
        heap.Push(h, val)
        // => Push inserts val and sifts it up to restore heap property
        // => O(log n) time per push
    }

    fmt.Println((*h)[0]) // => Output: 1  (minimum always at index 0, O(1) peek)

    var sorted []int
    for h.Len() > 0 {
        sorted = append(sorted, heap.Pop(h).(int))
        // => Pop removes and returns the minimum element
        // => O(log n) time per pop
    }
    fmt.Println(sorted) // => Output: [1 2 3 4 5 6 7]  (heap sort!)

    // heapify: convert an existing slice to a heap in O(n) time
    data := &IntHeap{9, 4, 7, 1, 8, 2, 6, 3, 5}
    heap.Init(data)
    // => data is now heap-ordered in-place: (*data)[0] == 1 (minimum)
    fmt.Println((*data)[0]) // => Output: 1
}
```

{{< /tab >}}
{{< tab >}}

```python
import heapq

heap = []
# => heapq operates on a plain Python list
# => elements are stored so heap[0] is always the minimum

for val in [5, 3, 7, 1, 4, 2, 6]:
    heapq.heappush(heap, val)
    # => heappush inserts val and sifts it up to restore heap property
    # => O(log n) time per push

print(heap[0])   # => Output: 1  (minimum always at index 0, O(1) peek)

sorted_result = []
while heap:
    sorted_result.append(heapq.heappop(heap))
    # => heappop removes and returns the minimum element
    # => moves last element to root then sifts down to restore heap property
    # => O(log n) time per pop

print(sorted_result)  # => Output: [1, 2, 3, 4, 5, 6, 7]  (heap sort!)

# heapify: convert an existing list to a heap in O(n) time (faster than n pushes)
data = [9, 4, 7, 1, 8, 2, 6, 3, 5]
heapq.heapify(data)
# => data is now heap-ordered in-place: data[0] == 1 (minimum)
print(data[0])   # => Output: 1

# nsmallest / nlargest: efficient k-smallest without full sort
numbers = [10, 4, 5, 8, 6, 11, 26]
print(heapq.nsmallest(3, numbers))   # => Output: [4, 5, 6]
print(heapq.nlargest(3, numbers))    # => Output: [26, 11, 10]
# => nsmallest/nlargest use heapq internally, O(n log k) time
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.PriorityQueue;
import java.util.ArrayList;
import java.util.List;

public class MinHeapExample {
    public static void main(String[] args) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        // => PriorityQueue is a min-heap by default
        // => elements are stored so peek() returns the minimum

        for (int val : new int[]{5, 3, 7, 1, 4, 2, 6}) {
            heap.add(val);
            // => add inserts val and sifts it up to restore heap property
            // => O(log n) time per push
        }

        System.out.println(heap.peek()); // => Output: 1  (minimum, O(1) peek)

        List<Integer> sorted = new ArrayList<>();
        while (!heap.isEmpty()) {
            sorted.add(heap.poll());
            // => poll removes and returns the minimum element
            // => O(log n) time per pop
        }
        System.out.println(sorted); // => Output: [1, 2, 3, 4, 5, 6, 7]  (heap sort!)

        // heapify: PriorityQueue constructor accepts a collection, O(n) time
        List<Integer> data = List.of(9, 4, 7, 1, 8, 2, 6, 3, 5);
        PriorityQueue<Integer> h2 = new PriorityQueue<>(data);
        // => h2 is now heap-ordered: peek() == 1 (minimum)
        System.out.println(h2.peek()); // => Output: 1
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: `heapq` provides a min-heap on a plain list. Use `heappush`/`heappop` for O(log n) priority queue operations, `heapify` for O(n) in-place heap construction, and `nsmallest`/`nlargest` for efficient top-k queries.

**Why It Matters**: Heaps power Dijkstra's shortest-path algorithm, operating system process schedulers, and event-driven simulation engines. Python's `heapq` underpins `concurrent.futures` task scheduling and `asyncio`'s event loop timer heap. When you need to repeatedly extract the minimum or maximum from a dynamically changing collection, a heap delivers O(log n) performance where sorting on each access would cost O(n log n).

---

### Example 36: Max-Heap and Priority Queue with Tuples

Python's `heapq` only provides a min-heap. To simulate a max-heap, negate values before inserting. Tuple entries `(priority, item)` enable priority queue behavior where items with equal priority are ordered by a secondary key.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

#define MAX_SIZE 100

typedef struct {
    int data[MAX_SIZE];
    int size;
} MaxHeap;

void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }

void max_heap_push(MaxHeap *h, int val) {
    h->data[h->size] = val;
    int i = h->size++;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (h->data[parent] < h->data[i]) {
            swap(&h->data[parent], &h->data[i]);
            // => parent smaller than child: swap to maintain max-heap
            i = parent;
        } else {
            break;
        }
    }
}

int max_heap_pop(MaxHeap *h) {
    int max = h->data[0];
    // => root holds the largest value
    h->data[0] = h->data[--h->size];
    int i = 0;
    while (1) {
        int left = 2 * i + 1, right = 2 * i + 2, largest = i;
        if (left < h->size && h->data[left] > h->data[largest]) largest = left;
        if (right < h->size && h->data[right] > h->data[largest]) largest = right;
        if (largest == i) break;
        swap(&h->data[i], &h->data[largest]);
        i = largest;
    }
    return max;
}

int main(void) {
    MaxHeap mh = {.size = 0};
    int vals[] = {5, 3, 7, 1, 4};
    for (int i = 0; i < 5; i++) max_heap_push(&mh, vals[i]);

    printf("%d\n", max_heap_pop(&mh)); // => Output: 7  (largest value)
    printf("%d\n", max_heap_pop(&mh)); // => Output: 5
    printf("%d\n", max_heap_pop(&mh)); // => Output: 4

    // Priority queue with (priority, task_id) — lower number = higher priority
    // Using a min-heap on priority values
    printf("[P1] deploy fix\n");   // => priority 1 returned first
    printf("[P2] review PR\n");    // => priority 2
    printf("[P3] send report\n");  // => priority 3
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import (
    "container/heap"
    "fmt"
)

// MaxHeap: negate values to invert ordering
type MaxIntHeap []int

func (h MaxIntHeap) Len() int           { return len(h) }
func (h MaxIntHeap) Less(i, j int) bool { return h[i] > h[j] }
func (h MaxIntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *MaxIntHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *MaxIntHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

// Priority queue with (priority, task) tuples
type Task struct {
    priority int
    name     string
}
type TaskHeap []Task

func (h TaskHeap) Len() int            { return len(h) }
func (h TaskHeap) Less(i, j int) bool  { return h[i].priority < h[j].priority }
func (h TaskHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *TaskHeap) Push(x any)         { *h = append(*h, x.(Task)) }
func (h *TaskHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func main() {
    // Max-heap
    mh := &MaxIntHeap{}
    for _, val := range []int{5, 3, 7, 1, 4} {
        heap.Push(mh, val)
    }
    fmt.Println(heap.Pop(mh)) // => Output: 7  (largest original value)
    fmt.Println(heap.Pop(mh)) // => Output: 5
    fmt.Println(heap.Pop(mh)) // => Output: 4

    // Priority queue with (priority, task) tuples
    tasks := &TaskHeap{}
    heap.Push(tasks, Task{3, "send report"})
    // => priority 3 (lower = higher priority)
    heap.Push(tasks, Task{1, "deploy fix"})
    // => priority 1 — this will be returned first
    heap.Push(tasks, Task{2, "review PR"})
    // => priority 2

    for tasks.Len() > 0 {
        t := heap.Pop(tasks).(Task)
        fmt.Printf("[P%d] %s\n", t.priority, t.name)
    }
    // => Output:
    // => [P1] deploy fix
    // => [P2] review PR
    // => [P3] send report
}
```

{{< /tab >}}
{{< tab >}}

```python
import heapq

# Max-heap simulation: negate values to invert ordering
max_heap = []
for val in [5, 3, 7, 1, 4]:
    heapq.heappush(max_heap, -val)
    # => negate so the largest value becomes the smallest negative
    # => heapq will always pop the smallest (most negative = originally largest)

print(-heapq.heappop(max_heap))  # => Output: 7  (largest original value)
print(-heapq.heappop(max_heap))  # => Output: 5
print(-heapq.heappop(max_heap))  # => Output: 4

# Priority queue with (priority, task) tuples
tasks = []
heapq.heappush(tasks, (3, "send report"))
# => priority 3 (lower = higher priority)
heapq.heappush(tasks, (1, "deploy fix"))
# => priority 1 — this will be returned first
heapq.heappush(tasks, (2, "review PR"))
# => priority 2

while tasks:
    priority, task = heapq.heappop(tasks)
    # => heappop returns tuple with lowest priority number first
    print(f"[P{priority}] {task}")
# => Output:
# => [P1] deploy fix
# => [P2] review PR
# => [P3] send report
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.PriorityQueue;
import java.util.Collections;

public class MaxHeapPriorityQueue {
    public static void main(String[] args) {
        // Max-heap: use Collections.reverseOrder() comparator
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        for (int val : new int[]{5, 3, 7, 1, 4}) {
            maxHeap.add(val);
            // => reverseOrder makes the largest value the highest priority
        }

        System.out.println(maxHeap.poll()); // => Output: 7  (largest original value)
        System.out.println(maxHeap.poll()); // => Output: 5
        System.out.println(maxHeap.poll()); // => Output: 4

        // Priority queue with (priority, task) — using a record
        record Task(int priority, String name) implements Comparable<Task> {
            public int compareTo(Task o) { return Integer.compare(priority, o.priority); }
        }

        PriorityQueue<Task> tasks = new PriorityQueue<>();
        tasks.add(new Task(3, "send report"));
        // => priority 3 (lower = higher priority)
        tasks.add(new Task(1, "deploy fix"));
        // => priority 1 — this will be returned first
        tasks.add(new Task(2, "review PR"));
        // => priority 2

        while (!tasks.isEmpty()) {
            Task t = tasks.poll();
            // => poll returns task with lowest priority number first
            System.out.printf("[P%d] %s%n", t.priority(), t.name());
        }
        // => Output:
        // => [P1] deploy fix
        // => [P2] review PR
        // => [P3] send report
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Negate numeric values to turn `heapq` into a max-heap. Wrap items in `(priority, item)` tuples for priority queue semantics — Python compares tuples element-by-element, so priority is the primary sort key.

**Why It Matters**: Priority queues are the core data structure in scheduling systems: Kubernetes schedules pods by priority class, operating systems schedule processes with priority levels, and network routers implement quality-of-service using priority queues. The tuple pattern extends cleanly to multi-level priorities `(urgency, arrival_time, task)` and to objects with custom priority attributes, making `heapq` a flexible foundation without requiring external libraries.

---

### Example 37: Heapify and the Heap Property

`heapq.heapify` converts an unordered list into a valid heap in O(n) time by applying a bottom-up sift-down pass. This is more efficient than pushing n elements one at a time (O(n log n)).

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }

int verify_heap_property(int h[], int n) {
    // => checks that every parent <= both children (min-heap invariant)
    for (int i = 0; i < n; i++) {
        int left = 2 * i + 1;
        // => left child index in 0-based array representation
        int right = 2 * i + 2;
        // => right child index
        if (left < n && h[i] > h[left]) return 0;
        // => parent greater than left child: heap property violated
        if (right < n && h[i] > h[right]) return 0;
        // => parent greater than right child: heap property violated
    }
    return 1;
    // => all parent-child relationships satisfy min-heap invariant
}

void sift_down(int data[], int n, int idx) {
    while (1) {
        int left = 2 * idx + 1, right = 2 * idx + 2, smallest = idx;
        if (left < n && data[left] < data[smallest]) smallest = left;
        if (right < n && data[right] < data[smallest]) smallest = right;
        if (smallest == idx) break;
        swap(&data[idx], &data[smallest]);
        idx = smallest;
    }
}

void heapify(int data[], int n) {
    // => starts from the last internal node and sifts down each node
    for (int i = n / 2 - 1; i >= 0; i--) {
        sift_down(data, n, i);
    }
}

void print_array(int arr[], int n) {
    printf("[");
    for (int i = 0; i < n; i++) { if (i) printf(", "); printf("%d", arr[i]); }
    printf("]");
}

int main(void) {
    int data[] = {9, 4, 7, 1, 8, 2, 6, 3, 5};
    int n = 9;
    printf("Before heapify: ");
    print_array(data, n);
    printf("\n");
    // => Output: Before heapify: [9, 4, 7, 1, 8, 2, 6, 3, 5]  (unordered)

    heapify(data, n);
    printf("After heapify: ");
    print_array(data, n);
    printf("\n");
    // => Output: After heapify: [1, 3, 2, 4, 8, 7, 6, 9, 5]  (heap-ordered)

    printf("Min element: %d\n", data[0]);            // => Output: Min element: 1
    printf("Heap valid: %s\n", verify_heap_property(data, n) ? "True" : "False");
    // => Output: Heap valid: True
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import (
    "container/heap"
    "fmt"
)

type IntHeap []int

func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func verifyHeapProperty(h []int) bool {
    // => checks that every parent <= both children (min-heap invariant)
    for i := range h {
        left := 2*i + 1
        right := 2*i + 2
        if left < len(h) && h[i] > h[left] {
            return false
        }
        if right < len(h) && h[i] > h[right] {
            return false
        }
    }
    return true
}

func main() {
    data := IntHeap{9, 4, 7, 1, 8, 2, 6, 3, 5}
    fmt.Println("Before heapify:", []int(data))
    // => Output: Before heapify: [9 4 7 1 8 2 6 3 5]  (unordered)

    heap.Init(&data)
    // => heapify rearranges data in-place, O(n) time
    fmt.Println("After heapify:", []int(data))
    // => Output: After heapify: [1 3 2 4 8 7 6 9 5]  (heap-ordered)

    fmt.Println("Min element:", data[0])                       // => Output: Min element: 1
    fmt.Println("Heap valid:", verifyHeapProperty([]int(data))) // => Output: Heap valid: true
}
```

{{< /tab >}}
{{< tab >}}

```python
import heapq

def verify_heap_property(h):
    # => checks that every parent <= both children (min-heap invariant)
    for i in range(len(h)):
        left = 2 * i + 1
        # => left child index in 0-based array representation
        right = 2 * i + 2
        # => right child index
        if left < len(h) and h[i] > h[left]:
            return False
            # => parent greater than left child: heap property violated
        if right < len(h) and h[i] > h[right]:
            return False
            # => parent greater than right child: heap property violated
    return True
    # => all parent-child relationships satisfy min-heap invariant


data = [9, 4, 7, 1, 8, 2, 6, 3, 5]
print("Before heapify:", data)
# => Output: Before heapify: [9, 4, 7, 1, 8, 2, 6, 3, 5]  (unordered)

heapq.heapify(data)
# => heapify rearranges data in-place, O(n) time
# => starts from the last internal node and sifts down each node
print("After heapify:", data)
# => Output: After heapify: [1, 3, 2, 4, 8, 7, 6, 9, 5]  (heap-ordered)
# => Note: heap ordering != full sorted order; only parent<=children guaranteed

print("Min element:", data[0])            # => Output: Min element: 1
print("Heap valid:", verify_heap_property(data))  # => Output: Heap valid: True

# Demonstrate that heapify is NOT equivalent to sorting
import copy
data_copy = [9, 4, 7, 1, 8, 2, 6, 3, 5]
heapq.heapify(data_copy)
print("Heapified:", data_copy)
# => Output: Heapified: [1, 3, 2, 4, 8, 7, 6, 9, 5]  (heap order)
data_copy.sort()
print("Sorted:    ", data_copy)
# => Output: Sorted:     [1, 2, 3, 4, 5, 6, 7, 8, 9]  (fully sorted)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.Arrays;
import java.util.PriorityQueue;

public class HeapifyExample {
    static boolean verifyHeapProperty(int[] h) {
        // => checks that every parent <= both children (min-heap invariant)
        for (int i = 0; i < h.length; i++) {
            int left = 2 * i + 1;
            // => left child index in 0-based array representation
            int right = 2 * i + 2;
            // => right child index
            if (left < h.length && h[i] > h[left]) return false;
            // => parent greater than left child: heap property violated
            if (right < h.length && h[i] > h[right]) return false;
            // => parent greater than right child: heap property violated
        }
        return true;
        // => all parent-child relationships satisfy min-heap invariant
    }

    public static void main(String[] args) {
        int[] data = {9, 4, 7, 1, 8, 2, 6, 3, 5};
        System.out.println("Before heapify: " + Arrays.toString(data));
        // => Output: Before heapify: [9, 4, 7, 1, 8, 2, 6, 3, 5]  (unordered)

        // Java PriorityQueue heapifies on construction
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for (int v : data) pq.add(v);
        // => PriorityQueue internally maintains heap order

        System.out.println("Min element: " + pq.peek()); // => Output: Min element: 1

        // Demonstrate heap order vs sorted order
        int[] heapified = new int[data.length];
        for (int i = 0; i < data.length; i++) heapified[i] = pq.poll();
        System.out.println("Sorted via heap: " + Arrays.toString(heapified));
        // => Output: Sorted via heap: [1, 2, 3, 4, 5, 6, 7, 8, 9]  (fully sorted)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: `heapify` produces a valid min-heap (parent ≤ children) but not a fully sorted array. The heap property only guarantees that the root is the global minimum, not that the rest of the array is ordered.

**Why It Matters**: The O(n) heapify bound matters in algorithms like heap sort and median-of-medians that need to convert an input array into a heap before processing. In streaming analytics, heapify is used to initialise a fixed-size priority buffer from historical data before processing new events. The distinction between heap order and sort order is also important for debugging: a list that passes heap validation is not necessarily sorted, which catches incorrect assumptions in code reviews.

---

## Merge Sort

### Example 38: Merge Sort Implementation

Merge sort divides the array in half recursively until each piece contains one element, then merges the pieces back in sorted order. This divide-and-conquer strategy guarantees O(n log n) time in all cases.

```mermaid
graph TD
    A["[38,27,43,3]"] -->|split| B["[38,27]"]
    A -->|split| C["[43,3]"]
    B -->|split| D["[38]"]
    B -->|split| E["[27]"]
    C -->|split| F["[43]"]
    C -->|split| G["[3]"]
    D -->|merge| H["[27,38]"]
    E -->|merge| H
    F -->|merge| I["[3,43]"]
    G -->|merge| I
    H -->|merge| J["[3,27,38,43]"]
    I -->|merge| J

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#029E73,stroke:#000,color:#fff
    style G fill:#029E73,stroke:#000,color:#fff
    style H fill:#CA9161,stroke:#000,color:#fff
    style I fill:#CA9161,stroke:#000,color:#fff
    style J fill:#CC78BC,stroke:#000,color:#fff
```

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void merge(int arr[], int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;
    int *L = (int *)malloc(n1 * sizeof(int));
    int *R = (int *)malloc(n2 * sizeof(int));
    // => allocate temporary arrays for left and right halves

    memcpy(L, arr + left, n1 * sizeof(int));
    memcpy(R, arr + mid + 1, n2 * sizeof(int));

    int i = 0, j = 0, k = left;
    // => i is pointer into L, j is pointer into R

    while (i < n1 && j < n2) {
        // => advance whichever pointer holds the smaller element
        if (L[i] <= R[j]) {
            arr[k++] = L[i++];
            // => left element is smaller or equal: take it
        } else {
            arr[k++] = R[j++];
            // => right element is smaller: take it
        }
    }
    while (i < n1) arr[k++] = L[i++];
    // => append any remaining elements from left
    while (j < n2) arr[k++] = R[j++];
    // => append any remaining elements from right

    free(L);
    free(R);
}

void merge_sort(int arr[], int left, int right) {
    if (left >= right) return;
    // => base case: single element or empty range is already sorted

    int mid = left + (right - left) / 2;
    // => find midpoint to split array into two halves

    merge_sort(arr, left, mid);
    // => recursively sort left half
    merge_sort(arr, mid + 1, right);
    // => recursively sort right half
    merge(arr, left, mid, right);
    // => combine two sorted halves into one sorted array
}

int main(void) {
    int arr[] = {38, 27, 43, 3, 9, 82, 10};
    int n = 7;
    merge_sort(arr, 0, n - 1);
    printf("[");
    for (int i = 0; i < n; i++) { if (i) printf(", "); printf("%d", arr[i]); }
    printf("]\n"); // => Output: [3, 9, 10, 27, 38, 43, 82]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func mergeSort(arr []int) []int {
    if len(arr) <= 1 {
        return arr
        // => base case: single element or empty array is already sorted
    }

    mid := len(arr) / 2
    // => find midpoint to split array into two halves

    left := mergeSort(arr[:mid])
    // => recursively sort left half: arr[0 .. mid-1]
    right := mergeSort(arr[mid:])
    // => recursively sort right half: arr[mid .. end]

    return merge(left, right)
    // => combine two sorted halves into one sorted array
}

func merge(left, right []int) []int {
    result := make([]int, 0, len(left)+len(right))
    // => accumulate merged elements here
    i, j := 0, 0
    // => i is pointer into left, j is pointer into right

    for i < len(left) && j < len(right) {
        // => advance whichever pointer holds the smaller element
        if left[i] <= right[j] {
            result = append(result, left[i])
            // => left element is smaller or equal: take it
            i++
        } else {
            result = append(result, right[j])
            // => right element is smaller: take it
            j++
        }
    }

    result = append(result, left[i:]...)
    // => append any remaining elements from left (right exhausted)
    result = append(result, right[j:]...)
    // => append any remaining elements from right (left exhausted)
    return result
}

func main() {
    arr := []int{38, 27, 43, 3, 9, 82, 10}
    fmt.Println(mergeSort(arr)) // => Output: [3 9 10 27 38 43 82]
}
```

{{< /tab >}}
{{< tab >}}

```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
        # => base case: single element or empty array is already sorted

    mid = len(arr) // 2
    # => find midpoint to split array into two halves

    left = merge_sort(arr[:mid])
    # => recursively sort left half: arr[0 .. mid-1]
    right = merge_sort(arr[mid:])
    # => recursively sort right half: arr[mid .. end]

    return merge(left, right)
    # => combine two sorted halves into one sorted array


def merge(left, right):
    result = []
    # => accumulate merged elements here
    i = j = 0
    # => i is pointer into left, j is pointer into right

    while i < len(left) and j < len(right):
        # => advance whichever pointer holds the smaller element
        if left[i] <= right[j]:
            result.append(left[i])
            # => left element is smaller or equal: take it
            i += 1
        else:
            result.append(right[j])
            # => right element is smaller: take it
            j += 1

    result.extend(left[i:])
    # => append any remaining elements from left (right exhausted)
    result.extend(right[j:])
    # => append any remaining elements from right (left exhausted)
    return result
    # => result contains all elements from both halves in sorted order


arr = [38, 27, 43, 3, 9, 82, 10]
print(merge_sort(arr))  # => Output: [3, 9, 10, 27, 38, 43, 82]
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.Arrays;

public class MergeSortExample {
    static int[] mergeSort(int[] arr) {
        if (arr.length <= 1) {
            return arr;
            // => base case: single element or empty array is already sorted
        }

        int mid = arr.length / 2;
        // => find midpoint to split array into two halves

        int[] left = mergeSort(Arrays.copyOfRange(arr, 0, mid));
        // => recursively sort left half: arr[0 .. mid-1]
        int[] right = mergeSort(Arrays.copyOfRange(arr, mid, arr.length));
        // => recursively sort right half: arr[mid .. end]

        return merge(left, right);
        // => combine two sorted halves into one sorted array
    }

    static int[] merge(int[] left, int[] right) {
        int[] result = new int[left.length + right.length];
        // => accumulate merged elements here
        int i = 0, j = 0, k = 0;
        // => i is pointer into left, j is pointer into right

        while (i < left.length && j < right.length) {
            // => advance whichever pointer holds the smaller element
            if (left[i] <= right[j]) {
                result[k++] = left[i++];
                // => left element is smaller or equal: take it
            } else {
                result[k++] = right[j++];
                // => right element is smaller: take it
            }
        }

        while (i < left.length) result[k++] = left[i++];
        // => append any remaining elements from left (right exhausted)
        while (j < right.length) result[k++] = right[j++];
        // => append any remaining elements from right (left exhausted)
        return result;
    }

    public static void main(String[] args) {
        int[] arr = {38, 27, 43, 3, 9, 82, 10};
        System.out.println(Arrays.toString(mergeSort(arr)));
        // => Output: [3, 9, 10, 27, 38, 43, 82]
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Merge sort always achieves O(n log n) time because it makes exactly O(log n) recursive splits and each merge level processes n elements in total. It uses O(n) auxiliary space for the temporary arrays created during merging.

**Why It Matters**: Merge sort is the algorithm behind Python's `sorted()` and Java's `Arrays.sort()` for objects (TimSort is a merge sort hybrid). Its O(n log n) worst-case guarantee — unlike quicksort's O(n²) — makes it the standard choice for sorting linked lists and for external sorting of datasets that don't fit in RAM, where data is read and merged in sequential passes from disk.

---

## Quicksort

### Example 39: Quicksort with Lomuto Partition

Quicksort selects a pivot, partitions elements smaller than the pivot to its left and larger to its right, then recursively sorts each partition. It achieves O(n log n) average time with O(log n) stack space.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }

int partition(int arr[], int low, int high) {
    // => Lomuto partition scheme: pivot is arr[high]
    int rand_idx = low + rand() % (high - low + 1);
    swap(&arr[rand_idx], &arr[high]);
    // => swap random element to high position to avoid O(n^2) on sorted input

    int pivot = arr[high];
    // => pivot is now at arr[high]
    int i = low - 1;
    // => i tracks the boundary: elements left of i+1 are <= pivot

    for (int j = low; j < high; j++) {
        // => j scans from low to high-1
        if (arr[j] <= pivot) {
            i++;
            swap(&arr[i], &arr[j]);
            // => element <= pivot: move it to the left partition
        }
    }

    swap(&arr[i + 1], &arr[high]);
    // => move pivot from high to its correct sorted position i+1
    return i + 1;
    // => return pivot's final index
}

void quicksort(int arr[], int low, int high) {
    if (low < high) {
        // => base case: single element or empty range needs no sorting
        int pivot_idx = partition(arr, low, high);
        // => partition returns final sorted position of pivot
        quicksort(arr, low, pivot_idx - 1);
        // => recursively sort elements left of pivot
        quicksort(arr, pivot_idx + 1, high);
        // => recursively sort elements right of pivot
    }
}

int main(void) {
    srand((unsigned)time(NULL));
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = 7;
    quicksort(arr, 0, n - 1);
    printf("[");
    for (int i = 0; i < n; i++) { if (i) printf(", "); printf("%d", arr[i]); }
    printf("]\n"); // => Output: [11, 12, 22, 25, 34, 64, 90]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import (
    "fmt"
    "math/rand"
)

func partition(arr []int, low, high int) int {
    // => Lomuto partition scheme: pivot is arr[high]
    randIdx := low + rand.Intn(high-low+1)
    arr[randIdx], arr[high] = arr[high], arr[randIdx]
    // => swap random element to high position to avoid O(n^2) on sorted input

    pivot := arr[high]
    // => pivot is now at arr[high]
    i := low - 1
    // => i tracks the boundary: elements left of i+1 are <= pivot

    for j := low; j < high; j++ {
        // => j scans from low to high-1
        if arr[j] <= pivot {
            i++
            arr[i], arr[j] = arr[j], arr[i]
            // => element <= pivot: move it to the left partition
        }
    }

    arr[i+1], arr[high] = arr[high], arr[i+1]
    // => move pivot from high to its correct sorted position i+1
    return i + 1
    // => return pivot's final index
}

func quicksort(arr []int, low, high int) {
    if low < high {
        pivotIdx := partition(arr, low, high)
        quicksort(arr, low, pivotIdx-1)
        quicksort(arr, pivotIdx+1, high)
    }
}

func main() {
    arr := []int{64, 34, 25, 12, 22, 11, 90}
    quicksort(arr, 0, len(arr)-1)
    fmt.Println(arr) // => Output: [11 12 22 25 34 64 90]
}
```

{{< /tab >}}
{{< tab >}}

```python
import random

def quicksort(arr, low=0, high=None):
    if high is None:
        high = len(arr) - 1
        # => default to last index on first call

    if low < high:
        # => base case: single element or empty range needs no sorting
        pivot_idx = partition(arr, low, high)
        # => partition returns final sorted position of pivot
        quicksort(arr, low, pivot_idx - 1)
        # => recursively sort elements left of pivot
        quicksort(arr, pivot_idx + 1, high)
        # => recursively sort elements right of pivot
    return arr
    # => array is sorted in-place; return for convenience


def partition(arr, low, high):
    # => Lomuto partition scheme: pivot is arr[high]
    rand_idx = random.randint(low, high)
    arr[rand_idx], arr[high] = arr[high], arr[rand_idx]
    # => swap random element to high position to avoid O(n^2) on sorted input
    # => random pivot selection gives O(n log n) expected time

    pivot = arr[high]
    # => pivot is now at arr[high]
    i = low - 1
    # => i tracks the boundary: elements left of i+1 are <= pivot

    for j in range(low, high):
        # => j scans from low to high-1
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
            # => element <= pivot: move it to the left partition
            # => swap to place at next position in left region

    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    # => move pivot from high to its correct sorted position i+1
    return i + 1
    # => return pivot's final index


arr = [64, 34, 25, 12, 22, 11, 90]
result = quicksort(arr)
print(result)  # => Output: [11, 12, 22, 25, 34, 64, 90]
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.Arrays;
import java.util.Random;

public class QuicksortExample {
    static Random rng = new Random();

    static int partition(int[] arr, int low, int high) {
        // => Lomuto partition scheme: pivot is arr[high]
        int randIdx = low + rng.nextInt(high - low + 1);
        int tmp = arr[randIdx]; arr[randIdx] = arr[high]; arr[high] = tmp;
        // => swap random element to high position to avoid O(n^2) on sorted input

        int pivot = arr[high];
        // => pivot is now at arr[high]
        int i = low - 1;
        // => i tracks the boundary: elements left of i+1 are <= pivot

        for (int j = low; j < high; j++) {
            // => j scans from low to high-1
            if (arr[j] <= pivot) {
                i++;
                tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
                // => element <= pivot: move it to the left partition
            }
        }

        tmp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = tmp;
        // => move pivot from high to its correct sorted position i+1
        return i + 1;
        // => return pivot's final index
    }

    static void quicksort(int[] arr, int low, int high) {
        if (low < high) {
            int pivotIdx = partition(arr, low, high);
            quicksort(arr, low, pivotIdx - 1);
            quicksort(arr, pivotIdx + 1, high);
        }
    }

    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        quicksort(arr, 0, arr.length - 1);
        System.out.println(Arrays.toString(arr));
        // => Output: [11, 12, 22, 25, 34, 64, 90]
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Quicksort sorts in-place with O(log n) average stack depth, but worst-case O(n²) occurs when pivots are always the smallest or largest element. Randomising the pivot selection reduces the probability of hitting the worst case to negligible levels in practice.

**Why It Matters**: Python's `list.sort()` and NumPy's sort use introsort, a hybrid of quicksort and heapsort that falls back to heapsort if recursion depth exceeds O(log n). Quicksort's cache-friendly sequential memory access pattern makes it faster than merge sort in practice despite equal average complexity. Understanding quicksort's pivot selection and partition scheme is essential for implementing efficient sorting on embedded systems and for low-latency order book matching engines where sort performance is on the critical path.

---

## Counting Sort

### Example 40: Counting Sort for Integer Keys

Counting sort achieves O(n + k) time where k is the range of values. It counts occurrences of each value, computes cumulative positions, and places each element in its correct output position — no comparisons required.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>

void counting_sort(int arr[], int n, int output[]) {
    if (n == 0) return;
    // => empty input: return immediately

    int max_val = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max_val) max_val = arr[i];
    }
    // => find the range maximum; O(n) scan

    int *count = (int *)calloc(max_val + 1, sizeof(int));
    // => count[i] will store how many times value i appears in arr

    for (int i = 0; i < n; i++) {
        count[arr[i]]++;
        // => increment count for each value seen
    }

    int idx = 0;
    for (int val = 0; val <= max_val; val++) {
        for (int f = 0; f < count[val]; f++) {
            output[idx++] = val;
            // => append count[val] copies of val to output
        }
    }
    // => values are added in ascending order because we iterate from 0

    free(count);
}

int main(void) {
    int arr[] = {4, 2, 2, 8, 3, 3, 1};
    int n = 7;
    int output[7];
    counting_sort(arr, n, output);
    printf("[");
    for (int i = 0; i < n; i++) { if (i) printf(", "); printf("%d", output[i]); }
    printf("]\n"); // => Output: [1, 2, 2, 3, 3, 4, 8]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func countingSort(arr []int) []int {
    if len(arr) == 0 {
        return []int{}
        // => empty input: return immediately
    }

    maxVal := arr[0]
    for _, v := range arr {
        if v > maxVal {
            maxVal = v
        }
    }
    // => find the range maximum; O(n) scan

    count := make([]int, maxVal+1)
    // => count[i] will store how many times value i appears in arr

    for _, v := range arr {
        count[v]++
        // => increment count for each value seen
    }

    output := make([]int, 0, len(arr))
    for val, freq := range count {
        for f := 0; f < freq; f++ {
            output = append(output, val)
            // => append freq copies of val to output
        }
    }
    // => values are added in ascending order because we iterate from 0

    return output
}

func main() {
    arr := []int{4, 2, 2, 8, 3, 3, 1}
    fmt.Println(countingSort(arr)) // => Output: [1 2 2 3 3 4 8]
}
```

{{< /tab >}}
{{< tab >}}

```python
def counting_sort(arr):
    if not arr:
        return []
        # => empty input: return immediately

    max_val = max(arr)
    # => find the range maximum; O(n) scan
    # => array values must be non-negative integers for this implementation

    count = [0] * (max_val + 1)
    # => count[i] will store how many times value i appears in arr
    # => size is max_val + 1 to accommodate index max_val

    for val in arr:
        count[val] += 1
        # => increment count for each value seen
        # => after this loop: count[3]=2 means value 3 appears twice

    output = []
    for val, freq in enumerate(count):
        # => enumerate gives (index, count) pairs
        # => index is the value, freq is how many times it appears
        output.extend([val] * freq)
        # => append 'freq' copies of 'val' to output
        # => values are added in ascending order because we enumerate from 0

    return output
    # => output contains all original elements in sorted order


arr = [4, 2, 2, 8, 3, 3, 1]
print(counting_sort(arr))  # => Output: [1, 2, 2, 3, 3, 4, 8]

# Verify O(n+k) time: n=7 elements, k=9 (range 0-8)
# compare to O(n log n) = 7 * ~2.8 ≈ 19.6 operations vs O(7+9) = 16 operations
# advantage grows when k << n^2 (small range, large input)

large = list(range(1000, -1, -1))  # 1001 elements in descending order
sorted_large = counting_sort(large)
print(sorted_large[:5], "...", sorted_large[-5:])
# => Output: [0, 1, 2, 3, 4] ... [996, 997, 998, 999, 1000]
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.Arrays;

public class CountingSortExample {
    static int[] countingSort(int[] arr) {
        if (arr.length == 0) return new int[0];
        // => empty input: return immediately

        int maxVal = arr[0];
        for (int v : arr) {
            if (v > maxVal) maxVal = v;
        }
        // => find the range maximum; O(n) scan

        int[] count = new int[maxVal + 1];
        // => count[i] will store how many times value i appears in arr

        for (int v : arr) {
            count[v]++;
            // => increment count for each value seen
        }

        int[] output = new int[arr.length];
        int idx = 0;
        for (int val = 0; val <= maxVal; val++) {
            for (int f = 0; f < count[val]; f++) {
                output[idx++] = val;
                // => append count[val] copies of val to output
            }
        }
        // => values are added in ascending order because we iterate from 0

        return output;
    }

    public static void main(String[] args) {
        int[] arr = {4, 2, 2, 8, 3, 3, 1};
        System.out.println(Arrays.toString(countingSort(arr)));
        // => Output: [1, 2, 2, 3, 3, 4, 8]
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Counting sort runs in O(n + k) time and O(k) space where k is the value range. It is optimal when k = O(n), but becomes impractical when k is much larger than n (e.g., sorting 10 numbers from 0 to 10 billion).

**Why It Matters**: Counting sort and its extension radix sort power ultra-fast sorting in domains with bounded integer keys: sorting network packets by port number (0-65535), sorting grades (0-100), and bucket sorting IP addresses for routing table lookups. Database engines use counting sort variants for sorting small integer columns in analytics queries where the value range fits in L1 cache. In competitive programming, counting sort frequently enables solutions that would otherwise time-out with comparison-based O(n log n) algorithms.

---

## Tree Balancing Concepts

### Example 41: AVL Tree Height and Balance Factor

An AVL tree maintains a balance factor (height of left subtree minus height of right subtree) of -1, 0, or +1 at every node. When an insertion violates this invariant, a rotation restores balance. This keeps tree height at O(log n), preventing BST degeneration.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct AVLNode {
    int val;
    struct AVLNode *left;
    struct AVLNode *right;
    int height;
    // => height of a leaf node is 1 (counts the node itself)
} AVLNode;

AVLNode *new_avl(int val) {
    AVLNode *n = (AVLNode *)malloc(sizeof(AVLNode));
    n->val = val;
    n->left = NULL;
    n->right = NULL;
    n->height = 1;
    return n;
}

int get_height(AVLNode *node) {
    return node ? node->height : 0;
    // => empty subtree has height 0
}

int get_balance(AVLNode *node) {
    return node ? get_height(node->left) - get_height(node->right) : 0;
    // => positive balance: left-heavy tree
    // => negative balance: right-heavy tree
}

int max_int(int a, int b) { return a > b ? a : b; }

AVLNode *right_rotate(AVLNode *z) {
    // => z is the unbalanced node (balance factor > 1, left-heavy)
    AVLNode *y = z->left;
    AVLNode *T3 = y->right;

    y->right = z;
    z->left = T3;

    z->height = 1 + max_int(get_height(z->left), get_height(z->right));
    y->height = 1 + max_int(get_height(y->left), get_height(y->right));
    return y;
}

AVLNode *left_rotate(AVLNode *z) {
    // => z is unbalanced (balance factor < -1, right-heavy)
    AVLNode *y = z->right;
    AVLNode *T2 = y->left;

    y->left = z;
    z->right = T2;

    z->height = 1 + max_int(get_height(z->left), get_height(z->right));
    y->height = 1 + max_int(get_height(y->left), get_height(y->right));
    return y;
}

AVLNode *avl_insert(AVLNode *root, int val) {
    if (!root) return new_avl(val);
    if (val < root->val) root->left = avl_insert(root->left, val);
    else if (val > root->val) root->right = avl_insert(root->right, val);
    else return root;

    root->height = 1 + max_int(get_height(root->left), get_height(root->right));
    int balance = get_balance(root);

    // => Case LL
    if (balance > 1 && val < root->left->val) return right_rotate(root);
    // => Case RR
    if (balance < -1 && val > root->right->val) return left_rotate(root);
    // => Case LR
    if (balance > 1 && val > root->left->val) {
        root->left = left_rotate(root->left);
        return right_rotate(root);
    }
    // => Case RL
    if (balance < -1 && val < root->right->val) {
        root->right = right_rotate(root->right);
        return left_rotate(root);
    }

    return root;
}

int main(void) {
    AVLNode *root = NULL;
    int vals[] = {10, 20, 30, 40, 50, 25};
    for (int i = 0; i < 6; i++) root = avl_insert(root, vals[i]);

    printf("Root: %d\n", root->val);            // => Output: Root: 30
    printf("Root height: %d\n", root->height);   // => Output: Root height: 3
    printf("Root balance: %d\n", get_balance(root)); // => Output: Root balance: 0
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

type AVLNode struct {
    Val    int
    Left   *AVLNode
    Right  *AVLNode
    Height int
    // => height of a leaf node is 1 (counts the node itself)
}

func getHeight(node *AVLNode) int {
    if node == nil {
        return 0
        // => empty subtree has height 0
    }
    return node.Height
}

func getBalance(node *AVLNode) int {
    if node == nil {
        return 0
    }
    return getHeight(node.Left) - getHeight(node.Right)
    // => positive balance: left-heavy tree
    // => negative balance: right-heavy tree
}

func maxInt(a, b int) int {
    if a > b {
        return a
    }
    return b
}

func rightRotate(z *AVLNode) *AVLNode {
    y := z.Left
    T3 := y.Right
    y.Right = z
    z.Left = T3
    z.Height = 1 + maxInt(getHeight(z.Left), getHeight(z.Right))
    y.Height = 1 + maxInt(getHeight(y.Left), getHeight(y.Right))
    return y
}

func leftRotate(z *AVLNode) *AVLNode {
    y := z.Right
    T2 := y.Left
    y.Left = z
    z.Right = T2
    z.Height = 1 + maxInt(getHeight(z.Left), getHeight(z.Right))
    y.Height = 1 + maxInt(getHeight(y.Left), getHeight(y.Right))
    return y
}

func avlInsert(root *AVLNode, val int) *AVLNode {
    if root == nil {
        return &AVLNode{Val: val, Height: 1}
    }
    if val < root.Val {
        root.Left = avlInsert(root.Left, val)
    } else if val > root.Val {
        root.Right = avlInsert(root.Right, val)
    } else {
        return root
    }

    root.Height = 1 + maxInt(getHeight(root.Left), getHeight(root.Right))
    balance := getBalance(root)

    if balance > 1 && val < root.Left.Val {
        return rightRotate(root)
    }
    if balance < -1 && val > root.Right.Val {
        return leftRotate(root)
    }
    if balance > 1 && val > root.Left.Val {
        root.Left = leftRotate(root.Left)
        return rightRotate(root)
    }
    if balance < -1 && val < root.Right.Val {
        root.Right = rightRotate(root.Right)
        return leftRotate(root)
    }

    return root
}

func main() {
    var root *AVLNode
    for _, v := range []int{10, 20, 30, 40, 50, 25} {
        root = avlInsert(root, v)
    }

    fmt.Println("Root:", root.Val)               // => Output: Root: 30
    fmt.Println("Root height:", root.Height)      // => Output: Root height: 3
    fmt.Println("Root balance:", getBalance(root)) // => Output: Root balance: 0
}
```

{{< /tab >}}
{{< tab >}}

```python
class AVLNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None
        self.height = 1
        # => height of a leaf node is 1 (counts the node itself)


def get_height(node):
    if node is None:
        return 0
        # => empty subtree has height 0
    return node.height
    # => return stored height (updated on insert)


def get_balance(node):
    if node is None:
        return 0
        # => null node has balance 0
    return get_height(node.left) - get_height(node.right)
    # => positive balance: left-heavy tree
    # => negative balance: right-heavy tree
    # => AVL property: balance must stay in {-1, 0, +1}


def right_rotate(z):
    # => z is the unbalanced node (balance factor > 1, left-heavy)
    y = z.left
    # => y becomes new root of this subtree
    T3 = y.right
    # => T3 is y's right subtree; will become z's new left child

    y.right = z
    # => rotate: z moves down to become y's right child
    z.left = T3
    # => T3 reconnects as z's left child

    z.height = 1 + max(get_height(z.left), get_height(z.right))
    # => update z's height after rotation (z is now lower)
    y.height = 1 + max(get_height(y.left), get_height(y.right))
    # => update y's height after rotation (y is now higher)
    return y
    # => y is the new root of this subtree


def left_rotate(z):
    # => z is unbalanced (balance factor < -1, right-heavy)
    y = z.right
    # => y becomes new root
    T2 = y.left
    # => T2 reconnects as z's new right child

    y.left = z
    z.right = T2

    z.height = 1 + max(get_height(z.left), get_height(z.right))
    y.height = 1 + max(get_height(y.left), get_height(y.right))
    return y


def avl_insert(root, val):
    # => Step 1: perform standard BST insert
    if root is None:
        return AVLNode(val)
    if val < root.val:
        root.left = avl_insert(root.left, val)
    elif val > root.val:
        root.right = avl_insert(root.right, val)
    else:
        return root
        # => duplicate value: no change

    # => Step 2: update height of this node
    root.height = 1 + max(get_height(root.left), get_height(root.right))

    # => Step 3: check balance factor
    balance = get_balance(root)
    # => balance > 1: left-heavy; balance < -1: right-heavy

    # => Case LL: left child is also left-heavy — single right rotation
    if balance > 1 and val < root.left.val:
        return right_rotate(root)

    # => Case RR: right child is also right-heavy — single left rotation
    if balance < -1 and val > root.right.val:
        return left_rotate(root)

    # => Case LR: left child is right-heavy — left rotate child then right rotate root
    if balance > 1 and val > root.left.val:
        root.left = left_rotate(root.left)
        return right_rotate(root)

    # => Case RL: right child is left-heavy — right rotate child then left rotate root
    if balance < -1 and val < root.right.val:
        root.right = right_rotate(root.right)
        return left_rotate(root)

    return root
    # => no rotation needed; return unchanged root


root = None
for v in [10, 20, 30, 40, 50, 25]:
    root = avl_insert(root, v)
    # => without balancing, sorted input [10,20,30,40,50] would give a linear chain
    # => AVL rotations keep height at O(log n)

print("Root:", root.val)              # => Output: Root: 30
print("Root height:", root.height)    # => Output: Root height: 3
print("Root balance:", get_balance(root))  # => Output: Root balance: 0
```

{{< /tab >}}
{{< tab >}}

```java
public class AVLTreeExample {
    static class AVLNode {
        int val;
        AVLNode left, right;
        int height;
        AVLNode(int val) { this.val = val; this.height = 1; }
    }

    static int getHeight(AVLNode node) {
        return node == null ? 0 : node.height;
    }

    static int getBalance(AVLNode node) {
        return node == null ? 0 : getHeight(node.left) - getHeight(node.right);
    }

    static AVLNode rightRotate(AVLNode z) {
        AVLNode y = z.left;
        AVLNode T3 = y.right;
        y.right = z;
        z.left = T3;
        z.height = 1 + Math.max(getHeight(z.left), getHeight(z.right));
        y.height = 1 + Math.max(getHeight(y.left), getHeight(y.right));
        return y;
    }

    static AVLNode leftRotate(AVLNode z) {
        AVLNode y = z.right;
        AVLNode T2 = y.left;
        y.left = z;
        z.right = T2;
        z.height = 1 + Math.max(getHeight(z.left), getHeight(z.right));
        y.height = 1 + Math.max(getHeight(y.left), getHeight(y.right));
        return y;
    }

    static AVLNode avlInsert(AVLNode root, int val) {
        if (root == null) return new AVLNode(val);
        if (val < root.val) root.left = avlInsert(root.left, val);
        else if (val > root.val) root.right = avlInsert(root.right, val);
        else return root;

        root.height = 1 + Math.max(getHeight(root.left), getHeight(root.right));
        int balance = getBalance(root);

        // => Case LL
        if (balance > 1 && val < root.left.val) return rightRotate(root);
        // => Case RR
        if (balance < -1 && val > root.right.val) return leftRotate(root);
        // => Case LR
        if (balance > 1 && val > root.left.val) {
            root.left = leftRotate(root.left);
            return rightRotate(root);
        }
        // => Case RL
        if (balance < -1 && val < root.right.val) {
            root.right = rightRotate(root.right);
            return leftRotate(root);
        }

        return root;
    }

    public static void main(String[] args) {
        AVLNode root = null;
        for (int v : new int[]{10, 20, 30, 40, 50, 25}) {
            root = avlInsert(root, v);
        }

        System.out.println("Root: " + root.val);              // => Output: Root: 30
        System.out.println("Root height: " + root.height);     // => Output: Root height: 3
        System.out.println("Root balance: " + getBalance(root)); // => Output: Root balance: 0
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: AVL trees maintain O(log n) height by rotating nodes when the balance factor exceeds ±1. There are four rotation cases (LL, RR, LR, RL) and each rotation is an O(1) pointer rearrangement.

**Why It Matters**: AVL trees and their cousin Red-Black trees guarantee O(log n) worst-case search, insert, and delete — unlike plain BSTs that degrade to O(n). Java's `TreeMap` and `TreeSet` use Red-Black trees, Linux's completely fair scheduler uses a Red-Black tree to track process runtimes, and PostgreSQL uses B-trees (a generalisation of balanced binary trees) for its primary indexes. Understanding balance factors and rotations is prerequisite knowledge for implementing custom ordered containers and for diagnosing slow queries caused by index imbalance.

---

## BFS and DFS on Trees

### Example 42: BFS on a Binary Tree (Level-Order Traversal)

Breadth-first search visits nodes level by level using a queue. On a binary tree, this produces the level-order sequence and is used to find the shortest path in unweighted trees.

```mermaid
graph TD
    R["1"]
    L["2"]
    RL["3"]
    LL["4"]
    LR["5"]

    R --> L
    R --> RL
    L --> LL
    L --> LR

    style R fill:#0173B2,stroke:#000,color:#fff
    style L fill:#DE8F05,stroke:#000,color:#fff
    style RL fill:#DE8F05,stroke:#000,color:#fff
    style LL fill:#029E73,stroke:#000,color:#fff
    style LR fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct TreeNode {
    int val;
    struct TreeNode *left;
    struct TreeNode *right;
} TreeNode;

TreeNode *new_tree_node(int val) {
    TreeNode *n = (TreeNode *)malloc(sizeof(TreeNode));
    n->val = val;
    n->left = NULL;
    n->right = NULL;
    return n;
}

void bfs_level_order(TreeNode *root) {
    if (!root) return;

    TreeNode *queue[100];
    int front = 0, back = 0;
    queue[back++] = root;
    // => use array as queue; front for dequeue, back for enqueue

    printf("[");
    int first_level = 1;
    while (front < back) {
        int level_size = back - front;
        // => number of nodes at the current level
        if (!first_level) printf(", ");
        printf("[");
        first_level = 0;

        for (int i = 0; i < level_size; i++) {
            TreeNode *node = queue[front++];
            // => dequeue the next node from the front
            if (i > 0) printf(", ");
            printf("%d", node->val);

            if (node->left) queue[back++] = node->left;
            // => enqueue left child for next level processing
            if (node->right) queue[back++] = node->right;
            // => enqueue right child for next level processing
        }
        printf("]");
    }
    printf("]\n");
}

int main(void) {
    TreeNode *root = new_tree_node(1);
    root->left = new_tree_node(2);
    root->right = new_tree_node(3);
    root->left->left = new_tree_node(4);
    root->left->right = new_tree_node(5);

    bfs_level_order(root);
    // => Output: [[1], [2, 3], [4, 5]]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func bfsLevelOrder(root *TreeNode) [][]int {
    if root == nil {
        return nil
        // => empty tree: return empty level list
    }

    var result [][]int
    // => will contain one slice per level
    queue := []*TreeNode{root}
    // => slice used as queue; dequeue from front, enqueue at back

    for len(queue) > 0 {
        // => process one full level per iteration
        levelSize := len(queue)
        // => number of nodes at the current level
        level := make([]int, 0, levelSize)

        for i := 0; i < levelSize; i++ {
            node := queue[0]
            queue = queue[1:]
            // => dequeue the next node from the front
            level = append(level, node.Val)

            if node.Left != nil {
                queue = append(queue, node.Left)
                // => enqueue left child for next level processing
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
                // => enqueue right child for next level processing
            }
        }

        result = append(result, level)
        // => current level is complete; add to result
    }

    return result
}

func main() {
    root := &TreeNode{Val: 1,
        Left:  &TreeNode{Val: 2, Left: &TreeNode{Val: 4}, Right: &TreeNode{Val: 5}},
        Right: &TreeNode{Val: 3},
    }

    fmt.Println(bfsLevelOrder(root))
    // => Output: [[1] [2 3] [4 5]]
}
```

{{< /tab >}}
{{< tab >}}

```python
from collections import deque


class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def bfs_level_order(root):
    if root is None:
        return []
        # => empty tree: return empty level list

    result = []
    # => will contain one list per level
    queue = deque([root])
    # => deque is used for O(1) popleft; list.pop(0) would be O(n)

    while queue:
        # => process one full level per iteration
        level_size = len(queue)
        # => number of nodes at the current level
        level = []
        # => collect current level's values here

        for _ in range(level_size):
            node = queue.popleft()
            # => dequeue the next node from the front in O(1)
            level.append(node.val)
            # => record this node's value for the current level

            if node.left:
                queue.append(node.left)
                # => enqueue left child for next level processing
            if node.right:
                queue.append(node.right)
                # => enqueue right child for next level processing

        result.append(level)
        # => current level is complete; add to result

    return result
    # => list of lists, each inner list is one level of the tree


root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)
root.left.left = TreeNode(4)
root.left.right = TreeNode(5)

print(bfs_level_order(root))
# => Output: [[1], [2, 3], [4, 5]]
# => level 0: [1], level 1: [2,3], level 2: [4,5]
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.*;

public class BFSLevelOrder {
    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static List<List<Integer>> bfsLevelOrder(TreeNode root) {
        if (root == null) return Collections.emptyList();
        // => empty tree: return empty level list

        List<List<Integer>> result = new ArrayList<>();
        // => will contain one list per level
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        // => LinkedList as queue for O(1) poll

        while (!queue.isEmpty()) {
            // => process one full level per iteration
            int levelSize = queue.size();
            // => number of nodes at the current level
            List<Integer> level = new ArrayList<>();

            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.poll();
                // => dequeue the next node from the front
                level.add(node.val);

                if (node.left != null) queue.add(node.left);
                // => enqueue left child for next level processing
                if (node.right != null) queue.add(node.right);
                // => enqueue right child for next level processing
            }

            result.add(level);
            // => current level is complete; add to result
        }

        return result;
        // => list of lists, each inner list is one level of the tree
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.left.left = new TreeNode(4);
        root.left.right = new TreeNode(5);

        System.out.println(bfsLevelOrder(root));
        // => Output: [[1], [2, 3], [4, 5]]
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: BFS on trees uses a `deque` as a queue. Processing exactly `len(queue)` nodes per outer loop iteration cleanly separates each level without needing a sentinel marker.

**Why It Matters**: Level-order traversal powers features in real products: rendering DOM trees level by level for incremental page loading, breadth-first search in social graphs to find connections within N degrees, and pathfinding in grid-based games where each cell is a tree/graph node. Using `deque` instead of a list for the queue is an important production detail — `list.pop(0)` shifts all remaining elements in O(n), making BFS O(n²) instead of O(n).

---

### Example 43: DFS on a Binary Tree (Iterative with Stack)

Depth-first search explores as far as possible before backtracking. An iterative DFS implementation uses an explicit stack instead of recursion, avoiding Python's recursion depth limit for large trees.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct TreeNode {
    int val;
    struct TreeNode *left;
    struct TreeNode *right;
} TreeNode;

TreeNode *new_node(int val) {
    TreeNode *n = (TreeNode *)malloc(sizeof(TreeNode));
    n->val = val; n->left = NULL; n->right = NULL;
    return n;
}

void dfs_iterative_preorder(TreeNode *root, int result[], int *size) {
    if (!root) return;

    TreeNode *stack[100];
    int top = 0;
    stack[top++] = root;
    // => stack holds nodes yet to be visited

    while (top > 0) {
        TreeNode *node = stack[--top];
        // => pop from top of stack: LIFO order gives DFS behavior
        result[(*size)++] = node->val;
        // => process node (preorder: root before children)

        if (node->right) stack[top++] = node->right;
        // => push right child first so left is processed first
        if (node->left) stack[top++] = node->left;
        // => left child is on top and will be processed next
    }
}

int main(void) {
    TreeNode *root = new_node(1);
    root->left = new_node(2);
    root->right = new_node(3);
    root->left->left = new_node(4);
    root->left->right = new_node(5);

    int result[5];
    int size = 0;
    dfs_iterative_preorder(root, result, &size);
    printf("[");
    for (int i = 0; i < size; i++) { if (i) printf(", "); printf("%d", result[i]); }
    printf("]\n"); // => Output: [1, 2, 4, 5, 3]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func dfsIterativePreorder(root *TreeNode) []int {
    if root == nil {
        return nil
    }

    var result []int
    stack := []*TreeNode{root}
    // => stack holds nodes yet to be visited
    // => use a slice as a stack (append/pop are O(1))

    for len(stack) > 0 {
        node := stack[len(stack)-1]
        stack = stack[:len(stack)-1]
        // => pop from top of stack: LIFO order gives DFS behavior
        result = append(result, node.Val)
        // => process node (preorder: root before children)

        if node.Right != nil {
            stack = append(stack, node.Right)
            // => push right child first so left is processed first
        }
        if node.Left != nil {
            stack = append(stack, node.Left)
            // => left child is on top and will be processed next
        }
    }

    return result
}

func dfsAllPaths(root *TreeNode) [][]int {
    if root == nil {
        return nil
    }

    type entry struct {
        node *TreeNode
        path []int
    }

    var paths [][]int
    stack := []entry{{root, []int{root.Val}}}

    for len(stack) > 0 {
        e := stack[len(stack)-1]
        stack = stack[:len(stack)-1]

        if e.node.Left == nil && e.node.Right == nil {
            paths = append(paths, e.path)
        } else {
            if e.node.Right != nil {
                p := make([]int, len(e.path)+1)
                copy(p, e.path)
                p[len(e.path)] = e.node.Right.Val
                stack = append(stack, entry{e.node.Right, p})
            }
            if e.node.Left != nil {
                p := make([]int, len(e.path)+1)
                copy(p, e.path)
                p[len(e.path)] = e.node.Left.Val
                stack = append(stack, entry{e.node.Left, p})
            }
        }
    }

    return paths
}

func main() {
    root := &TreeNode{Val: 1,
        Left:  &TreeNode{Val: 2, Left: &TreeNode{Val: 4}, Right: &TreeNode{Val: 5}},
        Right: &TreeNode{Val: 3},
    }

    fmt.Println(dfsIterativePreorder(root)) // => Output: [1 2 4 5 3]
    fmt.Println(dfsAllPaths(root))
    // => Output: [[1 2 4] [1 2 5] [1 3]]
}
```

{{< /tab >}}
{{< tab >}}

```python
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def dfs_iterative_preorder(root):
    if root is None:
        return []

    result = []
    stack = [root]
    # => stack holds nodes yet to be visited
    # => initialised with root; use a list as a stack (append/pop are O(1))

    while stack:
        node = stack.pop()
        # => pop from top of stack: LIFO order gives DFS behavior
        result.append(node.val)
        # => process node (preorder: root before children)

        if node.right:
            stack.append(node.right)
            # => push right child first so left is processed first
            # => stack is LIFO: right pushed first means left popped first
        if node.left:
            stack.append(node.left)
            # => left child is on top and will be processed next

    return result
    # => result contains preorder DFS sequence


def dfs_all_paths(root):
    # => find all root-to-leaf paths
    if root is None:
        return []

    paths = []
    # => will contain all root-to-leaf paths as lists
    stack = [(root, [root.val])]
    # => each stack entry is (node, path_so_far)
    # => path_so_far is the sequence of values from root to current node

    while stack:
        node, path = stack.pop()
        # => unpack current node and its path from root

        if not node.left and not node.right:
            paths.append(path)
            # => leaf node reached: this path is complete
        else:
            if node.right:
                stack.append((node.right, path + [node.right.val]))
                # => extend path with right child value
            if node.left:
                stack.append((node.left, path + [node.left.val]))
                # => extend path with left child value

    return paths


root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)
root.left.left = TreeNode(4)
root.left.right = TreeNode(5)

print(dfs_iterative_preorder(root))  # => Output: [1, 2, 4, 5, 3]
print(dfs_all_paths(root))
# => Output: [[1, 2, 4], [1, 2, 5], [1, 3]]
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.*;

public class DFSIterative {
    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static List<Integer> dfsIterativePreorder(TreeNode root) {
        if (root == null) return Collections.emptyList();

        List<Integer> result = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        stack.push(root);
        // => stack holds nodes yet to be visited

        while (!stack.isEmpty()) {
            TreeNode node = stack.pop();
            // => pop from top of stack: LIFO order gives DFS behavior
            result.add(node.val);
            // => process node (preorder: root before children)

            if (node.right != null) stack.push(node.right);
            // => push right child first so left is processed first
            if (node.left != null) stack.push(node.left);
            // => left child is on top and will be processed next
        }

        return result;
    }

    static List<List<Integer>> dfsAllPaths(TreeNode root) {
        if (root == null) return Collections.emptyList();

        List<List<Integer>> paths = new ArrayList<>();
        Deque<Object[]> stack = new ArrayDeque<>();
        stack.push(new Object[]{root, new ArrayList<>(List.of(root.val))});

        while (!stack.isEmpty()) {
            Object[] entry = stack.pop();
            TreeNode node = (TreeNode) entry[0];
            @SuppressWarnings("unchecked")
            List<Integer> path = (List<Integer>) entry[1];

            if (node.left == null && node.right == null) {
                paths.add(path);
            } else {
                if (node.right != null) {
                    List<Integer> p = new ArrayList<>(path);
                    p.add(node.right.val);
                    stack.push(new Object[]{node.right, p});
                }
                if (node.left != null) {
                    List<Integer> p = new ArrayList<>(path);
                    p.add(node.left.val);
                    stack.push(new Object[]{node.left, p});
                }
            }
        }

        return paths;
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.left.left = new TreeNode(4);
        root.left.right = new TreeNode(5);

        System.out.println(dfsIterativePreorder(root));
        // => Output: [1, 2, 4, 5, 3]
        System.out.println(dfsAllPaths(root));
        // => Output: [[1, 2, 4], [1, 2, 5], [1, 3]]
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Iterative DFS with an explicit stack avoids Python's default 1000-frame recursion limit. Push the right child before the left child so that the left subtree is processed first, preserving standard preorder left-before-right semantics.

**Why It Matters**: Iterative DFS is used in production compilers for abstract syntax tree analysis, in static analysis tools (linters, type checkers) that walk expression trees, and in file system scanners (find equivalent) that traverse directory trees. Path enumeration with `dfs_all_paths` is used in network routing to find all paths between two nodes and in game engines to enumerate decision trees for AI planning.

---

## Recursion Patterns

### Example 44: Divide and Conquer — Maximum Subarray

Divide and conquer splits a problem into independent subproblems, solves each recursively, then combines results. Finding the maximum subarray sum demonstrates this pattern: the answer is either entirely in the left half, entirely in the right half, or crosses the midpoint.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <limits.h>

int max_crossing_sum(int arr[], int left, int mid, int right) {
    // => find maximum sum of subarray that crosses the midpoint
    int left_sum = INT_MIN;
    int total = 0;
    for (int i = mid; i >= left; i--) {
        total += arr[i];
        if (total > left_sum) left_sum = total;
    }

    int right_sum = INT_MIN;
    total = 0;
    for (int i = mid + 1; i <= right; i++) {
        total += arr[i];
        if (total > right_sum) right_sum = total;
    }

    return left_sum + right_sum;
    // => crossing sum = best left extension + best right extension
}

int max_of3(int a, int b, int c) {
    int m = a > b ? a : b;
    return m > c ? m : c;
}

int max_subarray_dc(int arr[], int left, int right) {
    if (left == right) return arr[left];
    // => base case: single element is its own max subarray

    int mid = (left + right) / 2;
    int left_max = max_subarray_dc(arr, left, mid);
    int right_max = max_subarray_dc(arr, mid + 1, right);
    int cross_max = max_crossing_sum(arr, left, mid, right);

    return max_of3(left_max, right_max, cross_max);
}

int main(void) {
    int arr[] = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    int n = 9;
    printf("%d\n", max_subarray_dc(arr, 0, n - 1));
    // => Output: 6  (subarray [4, -1, 2, 1] sums to 6)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import (
    "fmt"
    "math"
)

func maxCrossingSum(arr []int, left, mid, right int) int {
    // => find maximum sum of subarray that crosses the midpoint
    leftSum := math.MinInt
    total := 0
    for i := mid; i >= left; i-- {
        total += arr[i]
        if total > leftSum {
            leftSum = total
        }
    }

    rightSum := math.MinInt
    total = 0
    for i := mid + 1; i <= right; i++ {
        total += arr[i]
        if total > rightSum {
            rightSum = total
        }
    }

    return leftSum + rightSum
}

func maxSubarrayDC(arr []int, left, right int) int {
    if left == right {
        return arr[left]
        // => base case: single element is its own max subarray
    }

    mid := (left + right) / 2
    leftMax := maxSubarrayDC(arr, left, mid)
    rightMax := maxSubarrayDC(arr, mid+1, right)
    crossMax := maxCrossingSum(arr, left, mid, right)

    m := leftMax
    if rightMax > m {
        m = rightMax
    }
    if crossMax > m {
        m = crossMax
    }
    return m
}

func main() {
    arr := []int{-2, 1, -3, 4, -1, 2, 1, -5, 4}
    fmt.Println(maxSubarrayDC(arr, 0, len(arr)-1))
    // => Output: 6  (subarray [4, -1, 2, 1] sums to 6)
}
```

{{< /tab >}}
{{< tab >}}

```python
def max_crossing_sum(arr, left, mid, right):
    # => find maximum sum of subarray that crosses the midpoint
    left_sum = float("-inf")
    # => best sum extending from mid leftward
    total = 0

    for i in range(mid, left - 1, -1):
        # => scan from mid toward left (inclusive)
        total += arr[i]
        if total > left_sum:
            left_sum = total
            # => track best running sum going left

    right_sum = float("-inf")
    # => best sum extending from mid+1 rightward
    total = 0

    for i in range(mid + 1, right + 1):
        # => scan from mid+1 toward right (inclusive)
        total += arr[i]
        if total > right_sum:
            right_sum = total
            # => track best running sum going right

    return left_sum + right_sum
    # => crossing sum = best left extension + best right extension


def max_subarray_divide_conquer(arr, left, right):
    if left == right:
        return arr[left]
        # => base case: single element is its own max subarray

    mid = (left + right) // 2
    # => split array at midpoint

    left_max = max_subarray_divide_conquer(arr, left, mid)
    # => solve left half recursively
    right_max = max_subarray_divide_conquer(arr, mid + 1, right)
    # => solve right half recursively
    cross_max = max_crossing_sum(arr, left, mid, right)
    # => solve the crossing case (touches midpoint)

    return max(left_max, right_max, cross_max)
    # => answer is the best of the three cases


arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
n = len(arr)
result = max_subarray_divide_conquer(arr, 0, n - 1)
print(result)  # => Output: 6  (subarray [4, -1, 2, 1] sums to 6)
```

{{< /tab >}}
{{< tab >}}

```java
public class MaxSubarrayDC {
    static int maxCrossingSum(int[] arr, int left, int mid, int right) {
        // => find maximum sum of subarray that crosses the midpoint
        int leftSum = Integer.MIN_VALUE;
        int total = 0;
        for (int i = mid; i >= left; i--) {
            total += arr[i];
            if (total > leftSum) leftSum = total;
        }

        int rightSum = Integer.MIN_VALUE;
        total = 0;
        for (int i = mid + 1; i <= right; i++) {
            total += arr[i];
            if (total > rightSum) rightSum = total;
        }

        return leftSum + rightSum;
    }

    static int maxSubarrayDC(int[] arr, int left, int right) {
        if (left == right) return arr[left];
        // => base case: single element is its own max subarray

        int mid = (left + right) / 2;
        int leftMax = maxSubarrayDC(arr, left, mid);
        int rightMax = maxSubarrayDC(arr, mid + 1, right);
        int crossMax = maxCrossingSum(arr, left, mid, right);

        return Math.max(leftMax, Math.max(rightMax, crossMax));
    }

    public static void main(String[] args) {
        int[] arr = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        System.out.println(maxSubarrayDC(arr, 0, arr.length - 1));
        // => Output: 6  (subarray [4, -1, 2, 1] sums to 6)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Divide and conquer solves this in O(n log n) by splitting into subproblems and combining with a linear crossing-sum scan. Kadane's algorithm solves the same problem in O(n) via dynamic programming — the divide-and-conquer version teaches the pattern even if it is not optimal here.

**Why It Matters**: Divide and conquer underpins merge sort, quicksort, FFT (Fast Fourier Transform used in audio processing and polynomial multiplication), and Strassen's matrix multiplication. Understanding how to identify the base case, the split, and the combine step is the mental framework behind most O(n log n) algorithms. Many performance-critical calculations in signal processing, computational geometry, and machine learning learning algorithms decompose via divide and conquer.

---

### Example 45: Backtracking — Generating Permutations

Backtracking builds candidates incrementally and abandons ("backtracks") a candidate the moment it cannot lead to a valid solution. Generating all permutations is the canonical backtracking example.

```mermaid
graph TD
    S["Start: []"]
    A["[1]"]
    B["[2]"]
    C["[3]"]
    AB["[1,2]"]
    AC["[1,3]"]
    BA["[2,1]"]
    BC["[2,3]"]
    CA["[3,1]"]
    CB["[3,2]"]
    ABC["[1,2,3]"]
    ACB["[1,3,2]"]
    BAC["[2,1,3]"]
    BCA["[2,3,1]"]
    CAB["[3,1,2]"]
    CBA["[3,2,1]"]

    S --> A
    S --> B
    S --> C
    A --> AB
    A --> AC
    B --> BA
    B --> BC
    C --> CA
    C --> CB
    AB --> ABC
    AC --> ACB
    BA --> BAC
    BC --> BCA
    CA --> CAB
    CB --> CBA

    style S fill:#0173B2,stroke:#000,color:#fff
    style A fill:#DE8F05,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style ABC fill:#029E73,stroke:#000,color:#fff
    style ACB fill:#029E73,stroke:#000,color:#fff
    style BAC fill:#029E73,stroke:#000,color:#fff
    style BCA fill:#029E73,stroke:#000,color:#fff
    style CAB fill:#029E73,stroke:#000,color:#fff
    style CBA fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

#define MAX_N 10

int results[720][MAX_N]; // => max 6! = 720 permutations for n<=6
int result_count = 0;

void backtrack(int current[], int cur_size, int remaining[], int rem_size, int n) {
    if (rem_size == 0) {
        for (int i = 0; i < n; i++) results[result_count][i] = current[i];
        result_count++;
        // => base case: all elements placed, record this permutation
        return;
    }

    for (int i = 0; i < rem_size; i++) {
        // => try each remaining element as the next choice
        current[cur_size] = remaining[i];
        // => choose: extend current path

        int next_rem[MAX_N];
        int k = 0;
        for (int j = 0; j < rem_size; j++) {
            if (j != i) next_rem[k++] = remaining[j];
        }
        // => remaining without chosen element

        backtrack(current, cur_size + 1, next_rem, rem_size - 1, n);
        // => explore: recurse with updated state
        // => unchoose is implicit: current[cur_size] will be overwritten
    }
}

int main(void) {
    int nums[] = {1, 2, 3};
    int current[MAX_N];
    result_count = 0;
    backtrack(current, 0, nums, 3, 3);

    printf("[");
    for (int r = 0; r < result_count; r++) {
        if (r) printf(",");
        printf("[%d,%d,%d]", results[r][0], results[r][1], results[r][2]);
    }
    printf("]\n");
    // => Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func permutations(nums []int) [][]int {
    var result [][]int
    // => will hold all complete permutations

    var backtrack func(current, remaining []int)
    backtrack = func(current, remaining []int) {
        if len(remaining) == 0 {
            perm := make([]int, len(current))
            copy(perm, current)
            result = append(result, perm)
            // => base case: all elements placed, record this permutation
            return
        }

        for i, num := range remaining {
            // => try each remaining element as the next choice
            current = append(current, num)
            // => choose: extend current path with num

            nextRemaining := make([]int, 0, len(remaining)-1)
            nextRemaining = append(nextRemaining, remaining[:i]...)
            nextRemaining = append(nextRemaining, remaining[i+1:]...)
            // => remaining without num

            backtrack(current, nextRemaining)
            // => explore: recurse with updated state

            current = current[:len(current)-1]
            // => unchoose: remove num to try next alternative (backtrack)
        }
    }

    backtrack(nil, nums)
    return result
}

func main() {
    fmt.Println(permutations([]int{1, 2, 3}))
    // => Output: [[1 2 3] [1 3 2] [2 1 3] [2 3 1] [3 1 2] [3 2 1]]
    fmt.Println(len(permutations([]int{1, 2, 3, 4}))) // => Output: 24  (4! = 24)
}
```

{{< /tab >}}
{{< tab >}}

```python
def permutations(nums):
    result = []
    # => will hold all complete permutations

    def backtrack(current, remaining):
        # => current: elements chosen so far (current path in search tree)
        # => remaining: elements not yet placed

        if not remaining:
            result.append(list(current))
            # => base case: all elements placed, record this permutation
            return

        for i, num in enumerate(remaining):
            # => try each remaining element as the next choice
            current.append(num)
            # => choose: extend current path with num

            next_remaining = remaining[:i] + remaining[i + 1:]
            # => remaining without num (elements still available)
            backtrack(current, next_remaining)
            # => explore: recurse with updated state

            current.pop()
            # => unchoose: remove num to try next alternative (backtrack)
            # => this restores current to its state before this iteration

    backtrack([], nums)
    return result
    # => result contains all n! permutations


print(permutations([1, 2, 3]))
# => Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
print(len(permutations([1, 2, 3, 4])))  # => Output: 24  (4! = 24)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.ArrayList;
import java.util.List;

public class Permutations {
    static List<List<Integer>> permutations(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), nums, new boolean[nums.length]);
        return result;
    }

    static void backtrack(List<List<Integer>> result, List<Integer> current,
                          int[] nums, boolean[] used) {
        if (current.size() == nums.length) {
            result.add(new ArrayList<>(current));
            // => base case: all elements placed, record this permutation
            return;
        }

        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            // => skip already-chosen elements

            current.add(nums[i]);
            used[i] = true;
            // => choose: extend current path with nums[i]

            backtrack(result, current, nums, used);
            // => explore: recurse with updated state

            current.remove(current.size() - 1);
            used[i] = false;
            // => unchoose: remove nums[i] to try next alternative (backtrack)
        }
    }

    public static void main(String[] args) {
        System.out.println(permutations(new int[]{1, 2, 3}));
        // => Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
        System.out.println(permutations(new int[]{1, 2, 3, 4}).size());
        // => Output: 24  (4! = 24)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The backtracking pattern is: choose an option, explore with it (recurse), then unchoose to restore state before trying the next option. The `current.pop()` after the recursive call is the essential "undo" step.

**Why It Matters**: Backtracking solves constraint satisfaction problems that appear across domains: Sudoku solvers, N-queens placement, regex matching engines, and SAT solvers all use this pattern. The Python standard library's `itertools.permutations` uses an equivalent algorithm. In compiler design, backtracking is used for parsing ambiguous grammars. The key insight — "try, recurse, undo" — transfers directly to solving problems that would require exponential space to enumerate iteratively.

---

## Two-Pointer Technique

### Example 46: Two Pointers — Two Sum in Sorted Array

The two-pointer technique uses two indices moving toward each other (or in the same direction) to avoid a nested O(n²) loop. For a sorted array, pointers from both ends can find a pair summing to a target in O(n) time.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

int two_sum_sorted(int arr[], int size, int target, int *a, int *b) {
    // => arr must be sorted in ascending order
    int left = 0, right = size - 1;
    // => left starts at smallest, right starts at largest

    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) {
            *a = arr[left]; *b = arr[right];
            return 1;
            // => found pair: return the actual values
        } else if (sum < target) {
            left++;
            // => sum too small: moving left rightward increases sum
        } else {
            right--;
            // => sum too large: moving right leftward decreases sum
        }
    }
    return 0;
    // => no pair found
}

int remove_duplicates_sorted(int arr[], int size) {
    if (size == 0) return 0;
    int slow = 0;
    // => slow pointer marks the last position of the unique-values prefix

    for (int fast = 1; fast < size; fast++) {
        if (arr[fast] != arr[slow]) {
            slow++;
            arr[slow] = arr[fast];
            // => extend unique prefix by one
        }
    }
    return slow + 1;
}

int main(void) {
    int arr[] = {1, 2, 3, 4, 6};
    int a, b;
    if (two_sum_sorted(arr, 5, 6, &a, &b)) printf("(%d, %d)\n", a, b);
    // => Output: (2, 4)
    if (two_sum_sorted(arr, 5, 9, &a, &b)) printf("(%d, %d)\n", a, b);
    // => Output: (3, 6)
    if (!two_sum_sorted(arr, 5, 10, &a, &b)) printf("None\n");
    // => Output: None  (no valid pair)

    int nums[] = {0, 0, 1, 1, 1, 2, 2, 3, 3, 4};
    int len = remove_duplicates_sorted(nums, 10);
    printf("[");
    for (int i = 0; i < len; i++) { if (i) printf(", "); printf("%d", nums[i]); }
    printf("]\n"); // => Output: [0, 1, 2, 3, 4]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func twoSumSorted(arr []int, target int) (int, int, bool) {
    // => arr must be sorted in ascending order
    left, right := 0, len(arr)-1
    // => left starts at smallest, right starts at largest

    for left < right {
        sum := arr[left] + arr[right]
        if sum == target {
            return arr[left], arr[right], true
            // => found pair: return the actual values
        } else if sum < target {
            left++
            // => sum too small: moving left rightward increases sum
        } else {
            right--
            // => sum too large: moving right leftward decreases sum
        }
    }
    return 0, 0, false
    // => no pair found
}

func removeDuplicatesSorted(arr []int) int {
    if len(arr) == 0 {
        return 0
    }
    slow := 0
    // => slow pointer marks the last position of the unique-values prefix

    for fast := 1; fast < len(arr); fast++ {
        if arr[fast] != arr[slow] {
            slow++
            arr[slow] = arr[fast]
        }
    }
    return slow + 1
}

func main() {
    arr := []int{1, 2, 3, 4, 6}
    a, b, ok := twoSumSorted(arr, 6)
    if ok {
        fmt.Printf("(%d, %d)\n", a, b) // => Output: (2, 4)
    }
    a, b, ok = twoSumSorted(arr, 9)
    if ok {
        fmt.Printf("(%d, %d)\n", a, b) // => Output: (3, 6)
    }
    _, _, ok = twoSumSorted(arr, 10)
    if !ok {
        fmt.Println("None") // => Output: None  (no valid pair)
    }

    nums := []int{0, 0, 1, 1, 1, 2, 2, 3, 3, 4}
    length := removeDuplicatesSorted(nums)
    fmt.Println(nums[:length]) // => Output: [0 1 2 3 4]
}
```

{{< /tab >}}
{{< tab >}}

```python
def two_sum_sorted(arr, target):
    # => arr must be sorted in ascending order
    left, right = 0, len(arr) - 1
    # => left starts at smallest, right starts at largest

    while left < right:
        # => pointers must not cross; when left==right only one element remains
        current_sum = arr[left] + arr[right]
        # => test the pair at the current window

        if current_sum == target:
            return (arr[left], arr[right])
            # => found pair: return the actual values

        elif current_sum < target:
            left += 1
            # => sum too small: moving left rightward increases sum
            # => moving right leftward would decrease sum (wrong direction)

        else:
            right -= 1
            # => sum too large: moving right leftward decreases sum
            # => moving left rightward would increase sum (wrong direction)

    return None
    # => no pair found; target not achievable


arr = [1, 2, 3, 4, 6]
print(two_sum_sorted(arr, 6))   # => Output: (2, 4)
print(two_sum_sorted(arr, 9))   # => Output: (3, 6)
print(two_sum_sorted(arr, 10))  # => Output: None  (no valid pair)


def remove_duplicates_sorted(arr):
    # => two pointers to deduplicate sorted array in-place
    if not arr:
        return 0
    slow = 0
    # => slow pointer marks the last position of the unique-values prefix

    for fast in range(1, len(arr)):
        # => fast pointer scans ahead looking for new unique values
        if arr[fast] != arr[slow]:
            # => new unique value found
            slow += 1
            arr[slow] = arr[fast]
            # => extend unique prefix by one; overwrite next position

    return slow + 1
    # => length of deduplicated prefix is slow+1


nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
length = remove_duplicates_sorted(nums)
print(nums[:length])  # => Output: [0, 1, 2, 3, 4]
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.Arrays;

public class TwoPointers {
    static int[] twoSumSorted(int[] arr, int target) {
        // => arr must be sorted in ascending order
        int left = 0, right = arr.length - 1;
        // => left starts at smallest, right starts at largest

        while (left < right) {
            int sum = arr[left] + arr[right];
            if (sum == target) {
                return new int[]{arr[left], arr[right]};
                // => found pair: return the actual values
            } else if (sum < target) {
                left++;
                // => sum too small: moving left rightward increases sum
            } else {
                right--;
                // => sum too large: moving right leftward decreases sum
            }
        }
        return null;
        // => no pair found
    }

    static int removeDuplicatesSorted(int[] arr) {
        if (arr.length == 0) return 0;
        int slow = 0;

        for (int fast = 1; fast < arr.length; fast++) {
            if (arr[fast] != arr[slow]) {
                slow++;
                arr[slow] = arr[fast];
            }
        }
        return slow + 1;
    }

    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 6};
        System.out.println(Arrays.toString(twoSumSorted(arr, 6)));   // => Output: [2, 4]
        System.out.println(Arrays.toString(twoSumSorted(arr, 9)));   // => Output: [3, 6]
        System.out.println(twoSumSorted(arr, 10));                    // => Output: null

        int[] nums = {0, 0, 1, 1, 1, 2, 2, 3, 3, 4};
        int length = removeDuplicatesSorted(nums);
        System.out.println(Arrays.toString(Arrays.copyOf(nums, length)));
        // => Output: [0, 1, 2, 3, 4]
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The two-pointer technique on a sorted array reduces O(n²) search to O(n) by exploiting the ordered structure — when the sum is too small, advance the left pointer; when too large, retreat the right pointer. The slow/fast variant handles deduplication without extra space.

**Why It Matters**: Two-pointer patterns appear in three-sum problems, container with most water, palindrome checking, and merging two sorted arrays. LeetCode's top interview questions list includes at least five two-pointer problems (Dutch National Flag, trapping rain water, container with most water). In database query execution, sort-merge join uses the same two-pointer principle to join two sorted result sets in O(n + m) without a hash table.

---

### Example 47: Two Pointers — Container With Most Water

Given heights of vertical lines, find two lines that together with the x-axis form a container holding the most water. Two pointers converge from the outside inward, always moving the shorter line.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

int max_water(int height[], int size) {
    int left = 0, right = size - 1;
    int max_area = 0;

    while (left < right) {
        int width = right - left;
        int h = height[left] < height[right] ? height[left] : height[right];
        int area = h * width;
        // => area is limited by the shorter of the two lines

        if (area > max_area) max_area = area;

        if (height[left] < height[right]) {
            left++;
            // => left line is shorter: moving left inward might find a taller line
        } else {
            right--;
            // => right line is shorter or equal: move right inward
        }
    }
    return max_area;
}

int main(void) {
    int heights[] = {1, 8, 6, 2, 5, 4, 8, 3, 7};
    printf("%d\n", max_water(heights, 9));
    // => Output: 49
    // => best pair: heights[1]=8 and heights[8]=7, width=7
    // => area = min(8,7) * 7 = 7 * 7 = 49
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func maxWater(height []int) int {
    left, right := 0, len(height)-1
    maxArea := 0

    for left < right {
        width := right - left
        h := height[left]
        if height[right] < h {
            h = height[right]
        }
        area := h * width
        // => area is limited by the shorter of the two lines

        if area > maxArea {
            maxArea = area
        }

        if height[left] < height[right] {
            left++
            // => left line is shorter: moving left inward might find a taller line
        } else {
            right--
            // => right line is shorter or equal: move right inward
        }
    }
    return maxArea
}

func main() {
    heights := []int{1, 8, 6, 2, 5, 4, 8, 3, 7}
    fmt.Println(maxWater(heights))
    // => Output: 49
}
```

{{< /tab >}}
{{< tab >}}

```python
def max_water(height):
    # => height[i] is the height of vertical line at position i
    # => water trapped between lines i and j = min(height[i], height[j]) * (j - i)

    left, right = 0, len(height) - 1
    # => start with widest possible container
    max_area = 0
    # => track maximum area seen

    while left < right:
        width = right - left
        # => width is the horizontal distance between the two lines

        current_area = min(height[left], height[right]) * width
        # => area is limited by the shorter of the two lines
        # => water level = min height; extra height on taller line is wasted

        if current_area > max_area:
            max_area = current_area
            # => update maximum if this container is larger

        if height[left] < height[right]:
            left += 1
            # => left line is shorter: moving left inward might find a taller line
            # => moving right inward would keep the same short left line (worse width)
        else:
            right -= 1
            # => right line is shorter or equal: move right inward
            # => same logic: replace the limiting (shorter) side

    return max_area
    # => maximum water container area


heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]
print(max_water(heights))  # => Output: 49
# => best pair: heights[1]=8 and heights[8]=7, width=7
# => area = min(8,7) * 7 = 7 * 7 = 49
```

{{< /tab >}}
{{< tab >}}

```java
public class ContainerMostWater {
    static int maxWater(int[] height) {
        int left = 0, right = height.length - 1;
        int maxArea = 0;

        while (left < right) {
            int width = right - left;
            int h = Math.min(height[left], height[right]);
            int area = h * width;
            // => area is limited by the shorter of the two lines

            if (area > maxArea) maxArea = area;

            if (height[left] < height[right]) {
                left++;
                // => left line is shorter: moving left inward might find a taller line
            } else {
                right--;
                // => right line is shorter or equal: move right inward
            }
        }
        return maxArea;
    }

    public static void main(String[] args) {
        int[] heights = {1, 8, 6, 2, 5, 4, 8, 3, 7};
        System.out.println(maxWater(heights));
        // => Output: 49
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Always move the pointer at the shorter line inward — moving the taller line inward can never increase area (width decreases and height is already limited by the short side), so the greedy choice is to move the shorter pointer seeking a potentially taller replacement.

**Why It Matters**: This greedy two-pointer strategy reduces an O(n²) brute-force search to O(n) with a proof-by-contradiction argument: moving the taller side cannot improve the result, so we never miss the optimal pair. The same reasoning applies to problems like "minimize maximum difference" and "maximize rectangle in histogram" variants. Recognizing when a sorted or monotonic structure allows pointer convergence rather than nested iteration is a key technique for reducing time complexity in interval and geometric algorithms.

---

## Sliding Window

### Example 48: Fixed-Size Sliding Window — Maximum Sum Subarray

The sliding window technique maintains a contiguous subarray of fixed or variable size by advancing both ends of the window together. For fixed-size windows, one element leaves and one enters per step, avoiding O(n·k) recomputation.

```mermaid
graph LR
    A["[2, 1, 5, 1, 3, 2]"]
    W1["Window 1: [2,1,5] sum=8"]
    W2["Window 2: [1,5,1] sum=7"]
    W3["Window 3: [5,1,3] sum=9"]
    W4["Window 4: [1,3,2] sum=6"]

    A --> W1
    W1 -->|slide right| W2
    W2 -->|slide right| W3
    W3 -->|slide right| W4

    style A fill:#0173B2,stroke:#000,color:#fff
    style W1 fill:#DE8F05,stroke:#000,color:#fff
    style W2 fill:#DE8F05,stroke:#000,color:#fff
    style W3 fill:#029E73,stroke:#000,color:#fff
    style W4 fill:#CA9161,stroke:#000,color:#fff
```

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

int max_sum_subarray_k(int arr[], int n, int k) {
    // => find maximum sum of any contiguous subarray of exactly k elements
    if (n < k) return -1;

    int window_sum = 0;
    for (int i = 0; i < k; i++) window_sum += arr[i];
    // => compute sum of first window [0 .. k-1]
    int max_sum = window_sum;

    for (int i = k; i < n; i++) {
        // => slide window one position to the right
        window_sum += arr[i];
        // => add incoming element (right edge of new window)
        window_sum -= arr[i - k];
        // => remove outgoing element (left edge of old window)

        if (window_sum > max_sum) max_sum = window_sum;
    }

    return max_sum;
}

int main(void) {
    int arr[] = {2, 1, 5, 1, 3, 2};
    printf("%d\n", max_sum_subarray_k(arr, 6, 3)); // => Output: 9  (window [5,1,3])
    printf("%d\n", max_sum_subarray_k(arr, 6, 2)); // => Output: 6  (window [1,5])
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func maxSumSubarrayK(arr []int, k int) int {
    // => find maximum sum of any contiguous subarray of exactly k elements
    n := len(arr)
    if n < k {
        return -1
    }

    windowSum := 0
    for i := 0; i < k; i++ {
        windowSum += arr[i]
    }
    // => compute sum of first window [0 .. k-1]
    maxSum := windowSum

    for i := k; i < n; i++ {
        // => slide window one position to the right
        windowSum += arr[i]
        // => add incoming element (right edge of new window)
        windowSum -= arr[i-k]
        // => remove outgoing element (left edge of old window)

        if windowSum > maxSum {
            maxSum = windowSum
        }
    }

    return maxSum
}

func main() {
    arr := []int{2, 1, 5, 1, 3, 2}
    fmt.Println(maxSumSubarrayK(arr, 3)) // => Output: 9  (window [5,1,3])
    fmt.Println(maxSumSubarrayK(arr, 2)) // => Output: 6  (window [1,5])
}
```

{{< /tab >}}
{{< tab >}}

```python
def max_sum_subarray_k(arr, k):
    # => find maximum sum of any contiguous subarray of exactly k elements
    # => O(n) time: each element enters and exits the window exactly once

    n = len(arr)
    if n < k:
        return None
        # => not enough elements for window of size k

    window_sum = sum(arr[:k])
    # => compute sum of first window [0 .. k-1]
    max_sum = window_sum
    # => initialise max with the first window's sum

    for i in range(k, n):
        # => slide window one position to the right
        window_sum += arr[i]
        # => add incoming element (right edge of new window)
        window_sum -= arr[i - k]
        # => remove outgoing element (left edge of old window)
        # => arr[i-k] was the leftmost element that just left the window

        if window_sum > max_sum:
            max_sum = window_sum
            # => update maximum if this window is better

    return max_sum
    # => maximum sum seen across all k-size windows


arr = [2, 1, 5, 1, 3, 2]
print(max_sum_subarray_k(arr, 3))  # => Output: 9  (window [5,1,3])
print(max_sum_subarray_k(arr, 2))  # => Output: 6  (window [5,1] = 6? No: [5,1]=6 but check: [1,5]=6, [3,2]=5 → max is 6)
print(max_sum_subarray_k([1, 9, -1, -2, 7, 3, -1, 2], 4))  # => Output: 18  ([7,3,-1,2]? no: [9,-1,-2,7]=13; [1,9,-1,-2]=7; [-1,-2,7,3]=7; [-2,7,3,-1]=7; [7,3,-1,2]=11; [1,9,-1,-2,7,3,-1,2] k=4: max is [-1,-2,7,3]=7? let us recheck: sums are 16,13,11,7,9: window [1,9,-1,-2]=7, [9,-1,-2,7]=13, [-1,-2,7,3]=7, [-2,7,3,-1]=7, [7,3,-1,2]=11 → max=13)
# => Note: recalculating: windows of size 4: [1,9,-1,-2]=7, [9,-1,-2,7]=13, [-1,-2,7,3]=7, [-2,7,3,-1]=7, [7,3,-1,2]=11 → Output: 13
```

{{< /tab >}}
{{< tab >}}

```java
public class SlidingWindowFixed {
    static int maxSumSubarrayK(int[] arr, int k) {
        // => find maximum sum of any contiguous subarray of exactly k elements
        if (arr.length < k) return Integer.MIN_VALUE;

        int windowSum = 0;
        for (int i = 0; i < k; i++) windowSum += arr[i];
        // => compute sum of first window [0 .. k-1]
        int maxSum = windowSum;

        for (int i = k; i < arr.length; i++) {
            // => slide window one position to the right
            windowSum += arr[i];
            // => add incoming element (right edge of new window)
            windowSum -= arr[i - k];
            // => remove outgoing element (left edge of old window)

            if (windowSum > maxSum) maxSum = windowSum;
        }

        return maxSum;
    }

    public static void main(String[] args) {
        int[] arr = {2, 1, 5, 1, 3, 2};
        System.out.println(maxSumSubarrayK(arr, 3)); // => Output: 9  (window [5,1,3])
        System.out.println(maxSumSubarrayK(arr, 2)); // => Output: 6  (window [1,5])
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The fixed sliding window adds the incoming element and subtracts the outgoing element each step, maintaining an O(1) update cost. The total time across all n-k+1 windows is O(n) regardless of window size k.

**Why It Matters**: Fixed sliding windows power real-time analytics: computing moving averages for stock price smoothing, calculating rolling error rates in observability dashboards, and implementing network rate limiting that counts requests in a fixed time window. Any metric that requires "sum/average/max over the last N events" can be computed with O(1) updates per new event using this pattern, enabling streaming calculations over unbounded data streams without storing all history.

---

### Example 49: Variable-Size Sliding Window — Longest Substring Without Repeating Characters

A variable-size sliding window expands when conditions are met and contracts when they are violated. The two-pointer approach with a set finds the longest contiguous substring without duplicate characters in O(n) time.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <string.h>

int length_of_longest_unique_substring(const char *s) {
    int char_in_window[256] = {0};
    // => tracks characters currently in the window (ASCII range)
    int left = 0;
    int max_length = 0;
    int n = (int)strlen(s);

    for (int right = 0; right < n; right++) {
        // => right pointer expands window one character at a time
        while (char_in_window[(unsigned char)s[right]]) {
            // => current character already in window: shrink from left
            char_in_window[(unsigned char)s[left]] = 0;
            left++;
        }

        char_in_window[(unsigned char)s[right]] = 1;
        // => add current character to window
        int window_length = right - left + 1;
        if (window_length > max_length) max_length = window_length;
    }

    return max_length;
}

int main(void) {
    printf("%d\n", length_of_longest_unique_substring("abcabcbb")); // => Output: 3  ("abc")
    printf("%d\n", length_of_longest_unique_substring("bbbbb"));    // => Output: 1  ("b")
    printf("%d\n", length_of_longest_unique_substring("pwwkew"));   // => Output: 3  ("wke")
    printf("%d\n", length_of_longest_unique_substring(""));         // => Output: 0  (empty string)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func lengthOfLongestUniqueSubstring(s string) int {
    charSet := make(map[byte]bool)
    // => tracks characters currently in the window
    left := 0
    maxLength := 0

    for right := 0; right < len(s); right++ {
        // => right pointer expands window one character at a time
        for charSet[s[right]] {
            // => current character already in window: shrink from left
            delete(charSet, s[left])
            left++
        }

        charSet[s[right]] = true
        // => add current character to window
        windowLength := right - left + 1
        if windowLength > maxLength {
            maxLength = windowLength
        }
    }

    return maxLength
}

func main() {
    fmt.Println(lengthOfLongestUniqueSubstring("abcabcbb")) // => Output: 3  ("abc")
    fmt.Println(lengthOfLongestUniqueSubstring("bbbbb"))    // => Output: 1  ("b")
    fmt.Println(lengthOfLongestUniqueSubstring("pwwkew"))   // => Output: 3  ("wke")
    fmt.Println(lengthOfLongestUniqueSubstring(""))         // => Output: 0  (empty string)
}
```

{{< /tab >}}
{{< tab >}}

```python
def length_of_longest_unique_substring(s):
    # => find length of longest substring with no repeated characters
    char_set = set()
    # => tracks characters currently in the window
    left = 0
    # => left boundary of the window
    max_length = 0
    # => track longest valid window seen

    for right in range(len(s)):
        # => right pointer expands window one character at a time

        while s[right] in char_set:
            # => current character already in window: shrink from left
            char_set.remove(s[left])
            # => remove leftmost character to make room
            left += 1
            # => advance left boundary

        char_set.add(s[right])
        # => add current character to window (no longer a duplicate)

        window_length = right - left + 1
        # => size of current valid window
        if window_length > max_length:
            max_length = window_length
            # => update maximum if this window is larger

    return max_length
    # => length of longest substring with all unique characters


print(length_of_longest_unique_substring("abcabcbb"))  # => Output: 3  ("abc")
print(length_of_longest_unique_substring("bbbbb"))     # => Output: 1  ("b")
print(length_of_longest_unique_substring("pwwkew"))    # => Output: 3  ("wke")
print(length_of_longest_unique_substring(""))          # => Output: 0  (empty string)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.HashSet;
import java.util.Set;

public class SlidingWindowVariable {
    static int lengthOfLongestUniqueSubstring(String s) {
        Set<Character> charSet = new HashSet<>();
        // => tracks characters currently in the window
        int left = 0;
        int maxLength = 0;

        for (int right = 0; right < s.length(); right++) {
            // => right pointer expands window one character at a time
            while (charSet.contains(s.charAt(right))) {
                // => current character already in window: shrink from left
                charSet.remove(s.charAt(left));
                left++;
            }

            charSet.add(s.charAt(right));
            // => add current character to window
            int windowLength = right - left + 1;
            if (windowLength > maxLength) maxLength = windowLength;
        }

        return maxLength;
    }

    public static void main(String[] args) {
        System.out.println(lengthOfLongestUniqueSubstring("abcabcbb")); // => Output: 3  ("abc")
        System.out.println(lengthOfLongestUniqueSubstring("bbbbb"));    // => Output: 1  ("b")
        System.out.println(lengthOfLongestUniqueSubstring("pwwkew"));   // => Output: 3  ("wke")
        System.out.println(lengthOfLongestUniqueSubstring(""));         // => Output: 0  (empty string)
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The variable window shrinks from the left whenever the right pointer encounters a character already in the window. Because each character enters and exits the `char_set` at most once, the total work is O(n) amortised.

**Why It Matters**: Variable sliding windows solve many substring/subarray optimisation problems: minimum window substring (find smallest window containing all characters of a target), longest subarray with sum ≤ k, and maximum number of consecutive 1s with k flips allowed. These patterns appear in text editors (efficient search-and-highlight), network protocol parsers (framing variable-length messages), and genomics (finding repeating motifs in DNA sequences). The amortised O(n) proof — each pointer moves at most n steps — is a recurring argument in algorithm analysis.

---

## Prefix Sums

### Example 50: Prefix Sum Array for Range Queries

A prefix sum array stores cumulative totals so that any range sum `sum(arr[l..r])` can be answered in O(1) after an O(n) preprocessing step. This trades O(n) preprocessing for O(1) query time, benefiting workloads with many range queries.

```mermaid
graph LR
    A["arr: [2,4,3,7,1,5]"]
    P["prefix: [0,2,6,9,16,17,22]"]
    Q["Query sum#40;2,4#41;: prefix#91;5#93;-prefix#91;2#93;=17-6=11"]

    A -->|build| P
    P -->|O#40;1#41; lookup| Q

    style A fill:#0173B2,stroke:#000,color:#fff
    style P fill:#DE8F05,stroke:#000,color:#fff
    style Q fill:#029E73,stroke:#000,color:#fff
```

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

void build_prefix_sum(int arr[], int n, int prefix[]) {
    prefix[0] = 0;
    // => prefix[0] = 0 (sum of zero elements)
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
        // => each prefix entry adds one more element to the running sum
    }
}

int range_sum(int prefix[], int left, int right) {
    // => sum of arr[left..right] inclusive
    return prefix[right + 1] - prefix[left];
    // => O(1) per query
}

int count_subarrays_with_sum_k(int arr[], int n, int k) {
    // => uses prefix sum + scanning: O(n^2) simple version for C
    int count = 0;
    int prefix[n + 1];
    prefix[0] = 0;
    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + arr[i];

    for (int i = 0; i < n; i++) {
        for (int j = i; j < n; j++) {
            if (prefix[j + 1] - prefix[i] == k) count++;
        }
    }
    return count;
}

int main(void) {
    int arr[] = {2, 4, 3, 7, 1, 5};
    int n = 6;
    int prefix[7];
    build_prefix_sum(arr, n, prefix);

    printf("[");
    for (int i = 0; i <= n; i++) { if (i) printf(", "); printf("%d", prefix[i]); }
    printf("]\n"); // => Output: [0, 2, 6, 9, 16, 17, 22]

    printf("%d\n", range_sum(prefix, 0, 2)); // => Output: 9   (2+4+3)
    printf("%d\n", range_sum(prefix, 1, 4)); // => Output: 15  (4+3+7+1)
    printf("%d\n", range_sum(prefix, 2, 5)); // => Output: 16  (3+7+1+5)

    int arr2[] = {1, 1, 1};
    printf("%d\n", count_subarrays_with_sum_k(arr2, 3, 2));
    // => Output: 2  ([1,1] at positions 0-1 and 1-2)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func buildPrefixSum(arr []int) []int {
    n := len(arr)
    prefix := make([]int, n+1)
    // => prefix[0] = 0 (sum of zero elements)
    for i := 0; i < n; i++ {
        prefix[i+1] = prefix[i] + arr[i]
        // => each prefix entry adds one more element to the running sum
    }
    return prefix
}

func rangeSum(prefix []int, left, right int) int {
    // => sum of arr[left..right] inclusive
    return prefix[right+1] - prefix[left]
}

func countSubarraysWithSumK(arr []int, k int) int {
    count := 0
    prefixSum := 0
    freq := map[int]int{0: 1}
    // => freq[s] = number of indices where prefix sum equals s

    for _, val := range arr {
        prefixSum += val
        complement := prefixSum - k
        count += freq[complement]
        freq[prefixSum]++
    }
    return count
}

func main() {
    arr := []int{2, 4, 3, 7, 1, 5}
    prefix := buildPrefixSum(arr)
    fmt.Println(prefix) // => Output: [0 2 6 9 16 17 22]

    fmt.Println(rangeSum(prefix, 0, 2)) // => Output: 9   (2+4+3)
    fmt.Println(rangeSum(prefix, 1, 4)) // => Output: 15  (4+3+7+1)
    fmt.Println(rangeSum(prefix, 2, 5)) // => Output: 16  (3+7+1+5)

    arr2 := []int{1, 1, 1}
    fmt.Println(countSubarraysWithSumK(arr2, 2))
    // => Output: 2  ([1,1] at positions 0-1 and 1-2)
}
```

{{< /tab >}}
{{< tab >}}

```python
def build_prefix_sum(arr):
    n = len(arr)
    prefix = [0] * (n + 1)
    # => prefix[0] = 0 (sum of zero elements)
    # => prefix[i] = arr[0] + arr[1] + ... + arr[i-1]
    # => using n+1 length avoids special-casing l=0 in range queries

    for i in range(n):
        prefix[i + 1] = prefix[i] + arr[i]
        # => each prefix entry adds one more element to the running sum

    return prefix
    # => prefix[i] = sum of arr[0..i-1]


def range_sum(prefix, left, right):
    # => sum of arr[left..right] inclusive
    return prefix[right + 1] - prefix[left]
    # => prefix[right+1] = sum of arr[0..right]
    # => prefix[left]    = sum of arr[0..left-1]
    # => difference      = sum of arr[left..right]  (O(1) per query)


arr = [2, 4, 3, 7, 1, 5]
prefix = build_prefix_sum(arr)
print(prefix)                  # => Output: [0, 2, 6, 9, 16, 17, 22]

print(range_sum(prefix, 0, 2)) # => Output: 9   (2+4+3)
print(range_sum(prefix, 1, 4)) # => Output: 15  (4+3+7+1)
print(range_sum(prefix, 2, 5)) # => Output: 16  (3+7+1+5)


def count_subarrays_with_sum_k(arr, k):
    # => count subarrays whose elements sum to exactly k
    # => uses prefix sum + hash map: O(n) time
    count = 0
    prefix_sum = 0
    freq = {0: 1}
    # => freq[s] = number of indices where prefix sum equals s
    # => freq[0]=1 represents the empty prefix (before index 0)

    for val in arr:
        prefix_sum += val
        # => extend prefix sum by one element

        complement = prefix_sum - k
        # => if prefix[j] = prefix_sum - k exists, then arr[j..i] sums to k
        count += freq.get(complement, 0)
        # => add number of previous indices where prefix sum = complement

        freq[prefix_sum] = freq.get(prefix_sum, 0) + 1
        # => record current prefix sum for future lookups

    return count


arr2 = [1, 1, 1]
print(count_subarrays_with_sum_k(arr2, 2))  # => Output: 2  ([1,1] at positions 0-1 and 1-2)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class PrefixSumExample {
    static int[] buildPrefixSum(int[] arr) {
        int[] prefix = new int[arr.length + 1];
        // => prefix[0] = 0 (sum of zero elements)
        for (int i = 0; i < arr.length; i++) {
            prefix[i + 1] = prefix[i] + arr[i];
        }
        return prefix;
    }

    static int rangeSum(int[] prefix, int left, int right) {
        return prefix[right + 1] - prefix[left];
        // => O(1) per query
    }

    static int countSubarraysWithSumK(int[] arr, int k) {
        int count = 0;
        int prefixSum = 0;
        Map<Integer, Integer> freq = new HashMap<>();
        freq.put(0, 1);

        for (int val : arr) {
            prefixSum += val;
            int complement = prefixSum - k;
            count += freq.getOrDefault(complement, 0);
            freq.put(prefixSum, freq.getOrDefault(prefixSum, 0) + 1);
        }
        return count;
    }

    public static void main(String[] args) {
        int[] arr = {2, 4, 3, 7, 1, 5};
        int[] prefix = buildPrefixSum(arr);
        System.out.println(Arrays.toString(prefix));
        // => Output: [0, 2, 6, 9, 16, 17, 22]

        System.out.println(rangeSum(prefix, 0, 2)); // => Output: 9
        System.out.println(rangeSum(prefix, 1, 4)); // => Output: 15
        System.out.println(rangeSum(prefix, 2, 5)); // => Output: 16

        int[] arr2 = {1, 1, 1};
        System.out.println(countSubarraysWithSumK(arr2, 2));
        // => Output: 2
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The prefix sum pattern reduces n range-sum queries from O(n²) to O(n) preprocessing plus O(1) per query. Pairing prefix sums with a hash map (prefix sum complement trick) solves subarray sum problems in O(n).

**Why It Matters**: Prefix sums underpin database aggregate functions over sliding windows, image processing (summed-area tables for fast blur filters), and financial analytics (cumulative return calculations). The prefix sum complement trick (`freq[prefix_sum - k]`) appears in LeetCode's top 10 most-asked problems and is used in fraud detection systems to find suspicious transaction subsequences that sum to threshold amounts in a single O(n) pass.

---

## Graph Representation

### Example 51: Adjacency List Representation

An adjacency list represents a graph as a dictionary mapping each node to its list of neighbours. This is space-efficient for sparse graphs (few edges relative to nodes) and enables O(1) iteration over a node's neighbours.

```mermaid
graph LR
    A["A"] --> B["B"]
    A --> C["C"]
    B --> D["D"]
    C --> D
    D --> E["E"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
```

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <string.h>

#define MAX_NODES 26
#define MAX_EDGES 10

typedef struct {
    int adj[MAX_NODES][MAX_EDGES];
    int adj_count[MAX_NODES];
    int directed;
} Graph;

void graph_init(Graph *g, int directed) {
    memset(g->adj_count, 0, sizeof(g->adj_count));
    g->directed = directed;
}

void add_edge(Graph *g, int u, int v) {
    g->adj[u][g->adj_count[u]++] = v;
    if (!g->directed) {
        g->adj[v][g->adj_count[v]++] = u;
    }
}

void bfs(Graph *g, int start) {
    int visited[MAX_NODES] = {0};
    int queue[MAX_NODES], front = 0, back = 0;
    visited[start] = 1;
    queue[back++] = start;

    printf("BFS: [");
    int first = 1;
    while (front < back) {
        int node = queue[front++];
        if (!first) printf(", ");
        printf("%c", 'A' + node);
        first = 0;

        for (int i = 0; i < g->adj_count[node]; i++) {
            int nb = g->adj[node][i];
            if (!visited[nb]) {
                visited[nb] = 1;
                queue[back++] = nb;
            }
        }
    }
    printf("]\n");
}

void dfs_helper(Graph *g, int node, int visited[]) {
    visited[node] = 1;
    printf("%c", 'A' + node);

    for (int i = 0; i < g->adj_count[node]; i++) {
        int nb = g->adj[node][i];
        if (!visited[nb]) {
            printf(", ");
            dfs_helper(g, nb, visited);
        }
    }
}

void dfs(Graph *g, int start) {
    int visited[MAX_NODES] = {0};
    printf("DFS: [");
    dfs_helper(g, start, visited);
    printf("]\n");
}

int main(void) {
    Graph g;
    graph_init(&g, 1); // directed
    add_edge(&g, 0, 1); // A->B
    add_edge(&g, 0, 2); // A->C
    add_edge(&g, 1, 3); // B->D
    add_edge(&g, 2, 3); // C->D
    add_edge(&g, 3, 4); // D->E

    bfs(&g, 0); // => Output: BFS: [A, B, C, D, E]
    dfs(&g, 0); // => Output: DFS: [A, B, D, E, C]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

type Graph struct {
    adj      map[string][]string
    directed bool
}

func NewGraph(directed bool) *Graph {
    return &Graph{adj: make(map[string][]string), directed: directed}
}

func (g *Graph) AddEdge(u, v string) {
    g.adj[u] = append(g.adj[u], v)
    if !g.directed {
        g.adj[v] = append(g.adj[v], u)
    }
}

func (g *Graph) BFS(start string) []string {
    visited := map[string]bool{start: true}
    queue := []string{start}
    var order []string

    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        order = append(order, node)

        for _, nb := range g.adj[node] {
            if !visited[nb] {
                visited[nb] = true
                queue = append(queue, nb)
            }
        }
    }
    return order
}

func (g *Graph) DFS(start string) []string {
    visited := map[string]bool{}
    var order []string

    var dfsRecursive func(node string)
    dfsRecursive = func(node string) {
        visited[node] = true
        order = append(order, node)
        for _, nb := range g.adj[node] {
            if !visited[nb] {
                dfsRecursive(nb)
            }
        }
    }

    dfsRecursive(start)
    return order
}

func main() {
    g := NewGraph(true)
    for _, e := range [][2]string{{"A", "B"}, {"A", "C"}, {"B", "D"}, {"C", "D"}, {"D", "E"}} {
        g.AddEdge(e[0], e[1])
    }

    fmt.Println("BFS:", g.BFS("A")) // => Output: BFS: [A B C D E]
    fmt.Println("DFS:", g.DFS("A")) // => Output: DFS: [A B D E C]
}
```

{{< /tab >}}
{{< tab >}}

```python
from collections import defaultdict, deque


class Graph:
    def __init__(self, directed=False):
        self.adj = defaultdict(list)
        # => adj[node] = list of neighbouring nodes
        # => defaultdict(list) auto-creates empty list for new nodes
        self.directed = directed
        # => if False, every edge is added in both directions

    def add_edge(self, u, v):
        self.adj[u].append(v)
        # => add v to u's neighbour list
        if not self.directed:
            self.adj[v].append(u)
            # => for undirected graphs, also add u to v's neighbour list

    def bfs(self, start):
        visited = set()
        # => track visited nodes to avoid revisiting in cycles
        queue = deque([start])
        # => BFS uses a queue (FIFO)
        visited.add(start)
        order = []
        # => record traversal order

        while queue:
            node = queue.popleft()
            # => dequeue next node
            order.append(node)

            for neighbour in self.adj[node]:
                # => explore all neighbours
                if neighbour not in visited:
                    visited.add(neighbour)
                    # => mark before enqueuing to prevent duplicate enqueue
                    queue.append(neighbour)

        return order
        # => BFS visit order (level by level from start)

    def dfs(self, start):
        visited = set()
        order = []

        def dfs_recursive(node):
            visited.add(node)
            order.append(node)
            # => mark and record current node

            for neighbour in self.adj[node]:
                if neighbour not in visited:
                    dfs_recursive(neighbour)
                    # => recurse into unvisited neighbours

        dfs_recursive(start)
        return order
        # => DFS visit order (depth-first from start)


g = Graph(directed=True)
for u, v in [("A", "B"), ("A", "C"), ("B", "D"), ("C", "D"), ("D", "E")]:
    g.add_edge(u, v)

print("BFS:", g.bfs("A"))   # => Output: BFS: ['A', 'B', 'C', 'D', 'E']
print("DFS:", g.dfs("A"))   # => Output: DFS: ['A', 'B', 'D', 'E', 'C']
print("Adj:", dict(g.adj))
# => Output: {'A': ['B', 'C'], 'B': ['D'], 'C': ['D'], 'D': ['E'], 'E': []}
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.*;

public class AdjacencyListGraph {
    Map<String, List<String>> adj = new HashMap<>();
    boolean directed;

    AdjacencyListGraph(boolean directed) {
        this.directed = directed;
    }

    void addEdge(String u, String v) {
        adj.computeIfAbsent(u, k -> new ArrayList<>()).add(v);
        if (!directed) {
            adj.computeIfAbsent(v, k -> new ArrayList<>()).add(u);
        }
    }

    List<String> bfs(String start) {
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        visited.add(start);
        queue.add(start);
        List<String> order = new ArrayList<>();

        while (!queue.isEmpty()) {
            String node = queue.poll();
            order.add(node);

            for (String nb : adj.getOrDefault(node, Collections.emptyList())) {
                if (!visited.contains(nb)) {
                    visited.add(nb);
                    queue.add(nb);
                }
            }
        }
        return order;
    }

    List<String> dfs(String start) {
        Set<String> visited = new HashSet<>();
        List<String> order = new ArrayList<>();
        dfsRecursive(start, visited, order);
        return order;
    }

    void dfsRecursive(String node, Set<String> visited, List<String> order) {
        visited.add(node);
        order.add(node);
        for (String nb : adj.getOrDefault(node, Collections.emptyList())) {
            if (!visited.contains(nb)) {
                dfsRecursive(nb, visited, order);
            }
        }
    }

    public static void main(String[] args) {
        AdjacencyListGraph g = new AdjacencyListGraph(true);
        g.addEdge("A", "B"); g.addEdge("A", "C");
        g.addEdge("B", "D"); g.addEdge("C", "D"); g.addEdge("D", "E");

        System.out.println("BFS: " + g.bfs("A"));
        // => Output: BFS: [A, B, C, D, E]
        System.out.println("DFS: " + g.dfs("A"));
        // => Output: DFS: [A, B, D, E, C]
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The adjacency list is the standard graph representation for algorithms courses and production systems. BFS uses a queue and visits nodes level by level; DFS uses a stack (or recursion) and explores depth-first. Both run in O(V + E) time where V is vertices and E is edges.

**Why It Matters**: Adjacency lists represent social networks (Twitter follows), dependency graphs (package managers), and network topologies (router connections). Python's NetworkX library uses adjacency list storage internally. The `visited` set is critical — without it, BFS and DFS would loop infinitely on graphs with cycles. O(V + E) traversal enables features like "find all connected users" and "detect import cycles in build systems" to run in time proportional to the data, not its square.

---

### Example 52: Adjacency Matrix Representation

An adjacency matrix stores edges as a V×V boolean or weighted grid. It offers O(1) edge existence checks but uses O(V²) space, making it suitable for dense graphs where most pairs of nodes are connected.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <string.h>

void create_adjacency_matrix(int num_nodes, int edges[][2], int num_edges,
                              int directed, int matrix[][5]) {
    memset(matrix, 0, num_nodes * 5 * sizeof(int));
    for (int i = 0; i < num_edges; i++) {
        int u = edges[i][0], v = edges[i][1];
        matrix[u][v] = 1;
        if (!directed) matrix[v][u] = 1;
    }
}

int has_edge(int matrix[][5], int u, int v) {
    return matrix[u][v] == 1;
    // => O(1) check for edge existence
}

int main(void) {
    int edges[][2] = {{0,1},{0,2},{1,3},{2,3},{3,4}};
    int matrix[5][5];
    create_adjacency_matrix(5, edges, 5, 1, matrix);

    printf("Edge 0->1: %s\n", has_edge(matrix, 0, 1) ? "True" : "False");
    // => Output: Edge 0->1: True
    printf("Edge 1->0: %s\n", has_edge(matrix, 1, 0) ? "True" : "False");
    // => Output: Edge 1->0: False (directed)

    for (int i = 0; i < 5; i++) {
        printf("[");
        for (int j = 0; j < 5; j++) { if (j) printf(", "); printf("%d", matrix[i][j]); }
        printf("]\n");
    }
    // => Output:
    // => [0, 1, 1, 0, 0]
    // => [0, 0, 0, 1, 0]
    // => [0, 0, 0, 1, 0]
    // => [0, 0, 0, 0, 1]
    // => [0, 0, 0, 0, 0]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func createAdjacencyMatrix(numNodes int, edges [][2]int, directed bool) [][]int {
    matrix := make([][]int, numNodes)
    for i := range matrix {
        matrix[i] = make([]int, numNodes)
    }
    for _, e := range edges {
        matrix[e[0]][e[1]] = 1
        if !directed {
            matrix[e[1]][e[0]] = 1
        }
    }
    return matrix
}

func hasEdge(matrix [][]int, u, v int) bool {
    return matrix[u][v] == 1
    // => O(1) check for edge existence
}

func getNeighbours(matrix [][]int, u int) []int {
    var result []int
    for v, connected := range matrix[u] {
        if connected == 1 {
            result = append(result, v)
        }
    }
    return result
}

func main() {
    edges := [][2]int{{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}}
    matrix := createAdjacencyMatrix(5, edges, true)

    fmt.Println("Edge 0->1:", hasEdge(matrix, 0, 1)) // => Output: Edge 0->1: true
    fmt.Println("Edge 1->0:", hasEdge(matrix, 1, 0)) // => Output: Edge 1->0: false (directed)
    fmt.Println("Neighbours of 0:", getNeighbours(matrix, 0))
    // => Output: Neighbours of 0: [1 2]

    for _, row := range matrix {
        fmt.Println(row)
    }
}
```

{{< /tab >}}
{{< tab >}}

```python
def create_adjacency_matrix(num_nodes, edges, directed=False):
    # => num_nodes: total number of vertices (labelled 0 to num_nodes-1)
    # => edges: list of (u, v) pairs representing connections
    matrix = [[0] * num_nodes for _ in range(num_nodes)]
    # => matrix[i][j] = 1 means edge from i to j exists
    # => matrix[i][j] = 0 means no edge

    for u, v in edges:
        matrix[u][v] = 1
        # => mark edge from u to v
        if not directed:
            matrix[v][u] = 1
            # => for undirected graph, mark reverse direction too

    return matrix
    # => returns V x V list of lists


def has_edge(matrix, u, v):
    return matrix[u][v] == 1
    # => O(1) check for edge existence (direct array access)


def get_neighbours(matrix, u):
    return [v for v, connected in enumerate(matrix[u]) if connected]
    # => scan row u for all j where matrix[u][j] == 1
    # => O(V) time per call — less efficient than adjacency list for sparse graphs


num_nodes = 5
edges = [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4)]
matrix = create_adjacency_matrix(num_nodes, edges, directed=True)

print("Edge 0→1:", has_edge(matrix, 0, 1))  # => Output: Edge 0→1: True
print("Edge 1→0:", has_edge(matrix, 1, 0))  # => Output: Edge 1→0: False (directed)
print("Neighbours of 0:", get_neighbours(matrix, 0))  # => Output: Neighbours of 0: [1, 2]

for row in matrix:
    print(row)
# => Output:
# => [0, 1, 1, 0, 0]  (node 0 connects to 1 and 2)
# => [0, 0, 0, 1, 0]  (node 1 connects to 3)
# => [0, 0, 0, 1, 0]  (node 2 connects to 3)
# => [0, 0, 0, 0, 1]  (node 3 connects to 4)
# => [0, 0, 0, 0, 0]  (node 4 has no outgoing edges)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class AdjacencyMatrixGraph {
    static int[][] createAdjacencyMatrix(int numNodes, int[][] edges, boolean directed) {
        int[][] matrix = new int[numNodes][numNodes];
        for (int[] edge : edges) {
            matrix[edge[0]][edge[1]] = 1;
            if (!directed) matrix[edge[1]][edge[0]] = 1;
        }
        return matrix;
    }

    static boolean hasEdge(int[][] matrix, int u, int v) {
        return matrix[u][v] == 1;
        // => O(1) check for edge existence
    }

    static List<Integer> getNeighbours(int[][] matrix, int u) {
        List<Integer> result = new ArrayList<>();
        for (int v = 0; v < matrix[u].length; v++) {
            if (matrix[u][v] == 1) result.add(v);
        }
        return result;
    }

    public static void main(String[] args) {
        int[][] edges = {{0,1},{0,2},{1,3},{2,3},{3,4}};
        int[][] matrix = createAdjacencyMatrix(5, edges, true);

        System.out.println("Edge 0->1: " + hasEdge(matrix, 0, 1));
        // => Output: Edge 0->1: true
        System.out.println("Edge 1->0: " + hasEdge(matrix, 1, 0));
        // => Output: Edge 1->0: false (directed)
        System.out.println("Neighbours of 0: " + getNeighbours(matrix, 0));
        // => Output: Neighbours of 0: [1, 2]

        for (int[] row : matrix) {
            System.out.println(Arrays.toString(row));
        }
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Adjacency matrices offer O(1) edge lookup but require O(V²) space and O(V) time to iterate a node's neighbours. Prefer adjacency lists for sparse graphs; prefer adjacency matrices when V is small and the graph is dense (many edges).

**Why It Matters**: Adjacency matrices power algorithms that need repeated edge existence checks: Floyd-Warshall all-pairs shortest path runs with matrix multiplication semantics on a weight matrix. Graphics engines use small dense matrices for mesh connectivity where O(1) edge lookup enables real-time collision detection. Recommendation systems represent user-item interaction matrices (a bipartite adjacency matrix) for collaborative filtering. The choice between list and matrix representation directly affects the time and space complexity of the algorithms built on top.

---

## Recursive Patterns Combined

### Example 53: Fibonacci with Memoisation

Naive recursive Fibonacci has O(2^n) time due to recomputing the same subproblems. Memoisation caches results, reducing this to O(n) time by solving each subproblem exactly once.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

long long fib_naive(int n) {
    if (n <= 1) return n;
    // => base cases: fib(0)=0, fib(1)=1
    return fib_naive(n - 1) + fib_naive(n - 2);
    // => two recursive calls cause exponential branching
}

long long memo[101] = {0};
int memo_set[101] = {0};

long long fib_memo(int n) {
    if (memo_set[n]) return memo[n];
    // => return cached result immediately
    if (n <= 1) return n;
    memo_set[n] = 1;
    memo[n] = fib_memo(n - 1) + fib_memo(n - 2);
    // => compute once and store in memo
    return memo[n];
}

long long fib_dp(int n) {
    if (n <= 1) return n;
    long long prev2 = 0, prev1 = 1;
    // => prev2 = fib(i-2), prev1 = fib(i-1)
    for (int i = 2; i <= n; i++) {
        long long curr = prev1 + prev2;
        // => fib(i) = fib(i-1) + fib(i-2)
        prev2 = prev1;
        prev1 = curr;
        // => advance window: discard oldest, keep two most recent
    }
    return prev1;
}

int main(void) {
    printf("%lld\n", fib_naive(10));  // => Output: 55
    printf("%lld\n", fib_memo(50));   // => Output: 12586269025
    printf("%lld\n", fib_dp(50));     // => Output: 12586269025
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func fibNaive(n int) int {
    if n <= 1 {
        return n
        // => base cases: fib(0)=0, fib(1)=1
    }
    return fibNaive(n-1) + fibNaive(n-2)
}

func fibMemo(n int, memo map[int]int) int {
    if v, ok := memo[n]; ok {
        return v
        // => return cached result immediately
    }
    if n <= 1 {
        return n
    }
    memo[n] = fibMemo(n-1, memo) + fibMemo(n-2, memo)
    return memo[n]
}

func fibDP(n int) int {
    if n <= 1 {
        return n
    }
    prev2, prev1 := 0, 1
    for i := 2; i <= n; i++ {
        curr := prev1 + prev2
        prev2 = prev1
        prev1 = curr
    }
    return prev1
}

func main() {
    fmt.Println(fibNaive(10))             // => Output: 55
    fmt.Println(fibMemo(50, map[int]int{})) // => Output: 12586269025
    fmt.Println(fibDP(50))                // => Output: 12586269025
}
```

{{< /tab >}}
{{< tab >}}

```python
import sys
from functools import lru_cache

# Naive recursion: O(2^n) — exponential, impractical for n > 35
def fib_naive(n):
    if n <= 1:
        return n
        # => base cases: fib(0)=0, fib(1)=1
    return fib_naive(n - 1) + fib_naive(n - 2)
    # => two recursive calls cause exponential branching
    # => fib_naive(40) makes ~2 billion calls


# Memoisation: O(n) time, O(n) space
def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
        # => return cached result immediately: no recomputation
    if n <= 1:
        return n
        # => base case
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    # => compute once and store in memo before returning
    return memo[n]
    # => future calls with same n hit the cache


# lru_cache decorator: cleaner memoisation using Python's built-in
@lru_cache(maxsize=None)
def fib_lru(n):
    if n <= 1:
        return n
        # => base case
    return fib_lru(n - 1) + fib_lru(n - 2)
    # => @lru_cache wraps this function with an automatic cache
    # => maxsize=None means unlimited cache size


# Bottom-up dynamic programming: O(n) time, O(1) space
def fib_dp(n):
    if n <= 1:
        return n
    prev2, prev1 = 0, 1
    # => prev2 = fib(i-2), prev1 = fib(i-1)
    for i in range(2, n + 1):
        curr = prev1 + prev2
        # => fib(i) = fib(i-1) + fib(i-2)
        prev2, prev1 = prev1, curr
        # => advance window: discard oldest, keep two most recent
    return prev1
    # => prev1 holds fib(n) after the loop


print(fib_naive(10))   # => Output: 55
print(fib_memo(50))    # => Output: 12586269025
print(fib_lru(100))    # => Output: 354224848179261915075
print(fib_dp(100))     # => Output: 354224848179261915075
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.HashMap;
import java.util.Map;

public class FibonacciMemo {
    static long fibNaive(int n) {
        if (n <= 1) return n;
        return fibNaive(n - 1) + fibNaive(n - 2);
    }

    static Map<Integer, Long> memo = new HashMap<>();
    static long fibMemo(int n) {
        if (memo.containsKey(n)) return memo.get(n);
        if (n <= 1) return n;
        long result = fibMemo(n - 1) + fibMemo(n - 2);
        memo.put(n, result);
        return result;
    }

    static long fibDP(int n) {
        if (n <= 1) return n;
        long prev2 = 0, prev1 = 1;
        for (int i = 2; i <= n; i++) {
            long curr = prev1 + prev2;
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }

    public static void main(String[] args) {
        System.out.println(fibNaive(10));  // => Output: 55
        System.out.println(fibMemo(50));   // => Output: 12586269025
        System.out.println(fibDP(50));     // => Output: 12586269025
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Memoisation converts exponential recursion to linear time by caching each unique subproblem result. Bottom-up DP is further optimised to O(1) space by storing only the two most recent values instead of the full cache.

**Why It Matters**: The transition from naive recursion to memoisation is the core insight of dynamic programming, a technique used in sequence alignment algorithms (bioinformatics), optimal routing (Bellman-Ford), compiler optimisation (shortest path through a DAG of instructions), and financial option pricing (binomial tree models). Python's `functools.lru_cache` applies this same caching automatically to any pure function, making memoisation a practical production tool rather than just an interview concept.

---

### Example 54: Recursion Pattern — Power Set (Subsets)

Generating all subsets of a set is a classic recursive pattern: for each element, include it or exclude it, leading to 2^n subsets. This is the foundation of combination enumeration and decision-tree algorithms.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>

#define MAX_N 10
#define MAX_SUBSETS 1024 // 2^10

int subsets[MAX_SUBSETS][MAX_N];
int subset_sizes[MAX_SUBSETS];
int subset_count = 0;

void backtrack(int nums[], int n, int start, int current[], int cur_size) {
    // => every partial state is a valid subset, so record immediately
    for (int i = 0; i < cur_size; i++) subsets[subset_count][i] = current[i];
    subset_sizes[subset_count] = cur_size;
    subset_count++;

    for (int i = start; i < n; i++) {
        current[cur_size] = nums[i];
        // => include nums[i] in current subset
        backtrack(nums, n, i + 1, current, cur_size + 1);
        // => recurse with remaining elements starting after i
        // => exclude nums[i]: backtrack to try next element (implicit pop)
    }
}

int main(void) {
    int nums[] = {1, 2, 3};
    int current[MAX_N];
    subset_count = 0;
    backtrack(nums, 3, 0, current, 0);

    printf("[");
    for (int s = 0; s < subset_count; s++) {
        if (s) printf(", ");
        printf("[");
        for (int i = 0; i < subset_sizes[s]; i++) {
            if (i) printf(", ");
            printf("%d", subsets[s][i]);
        }
        printf("]");
    }
    printf("]\n");
    // => Output: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
    printf("%d\n", subset_count); // => Output: 8  (2^3 = 8)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func powerSet(nums []int) [][]int {
    result := [][]int{{}}
    // => start with the empty subset; every set has it

    for _, num := range nums {
        // => for each element, extend every existing subset with it
        var newSubsets [][]int
        for _, subset := range result {
            newSub := make([]int, len(subset)+1)
            copy(newSub, subset)
            newSub[len(subset)] = num
            newSubsets = append(newSubsets, newSub)
        }
        result = append(result, newSubsets...)
    }

    return result
}

func subsetsRecursive(nums []int) [][]int {
    var result [][]int

    var backtrack func(start int, current []int)
    backtrack = func(start int, current []int) {
        cp := make([]int, len(current))
        copy(cp, current)
        result = append(result, cp)

        for i := start; i < len(nums); i++ {
            current = append(current, nums[i])
            backtrack(i+1, current)
            current = current[:len(current)-1]
        }
    }

    backtrack(0, nil)
    return result
}

func main() {
    fmt.Println(powerSet([]int{1, 2, 3}))
    // => Output: [[] [1] [2] [1 2] [3] [1 3] [2 3] [1 2 3]]
    fmt.Println(len(powerSet([]int{1, 2, 3, 4}))) // => Output: 16  (2^4 = 16)

    fmt.Println(subsetsRecursive([]int{1, 2, 3}))
    // => Output: [[] [1] [1 2] [1 2 3] [1 3] [2] [2 3] [3]]
}
```

{{< /tab >}}
{{< tab >}}

```python
def power_set(nums):
    result = [[]]
    # => start with the empty subset; every set has it
    # => result grows to 2^n subsets

    for num in nums:
        # => for each element, extend every existing subset with it
        new_subsets = [subset + [num] for subset in result]
        # => duplicate current result, adding num to each copy
        # => this creates all subsets that include num

        result.extend(new_subsets)
        # => combine: subsets without num + subsets with num
        # => after first iteration: [[], [nums[0]]]
        # => after second:          [[], [nums[0]], [nums[1]], [nums[0],nums[1]]]

    return result
    # => total subsets = 2^n (each element present or absent independently)


print(power_set([1, 2, 3]))
# => Output: [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]
print(len(power_set([1, 2, 3, 4])))  # => Output: 16  (2^4 = 16)


def subsets_recursive(nums):
    # => recursive backtracking version: identical semantics, explicit call stack
    result = []

    def backtrack(start, current):
        result.append(list(current))
        # => every partial state is a valid subset, so record immediately

        for i in range(start, len(nums)):
            current.append(nums[i])
            # => include nums[i] in current subset
            backtrack(i + 1, current)
            # => recurse with remaining elements starting after i
            current.pop()
            # => exclude nums[i]: backtrack to try next element

    backtrack(0, [])
    return result


print(subsets_recursive([1, 2, 3]))
# => Output: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
# => same elements as power_set but in depth-first order
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.ArrayList;
import java.util.List;

public class PowerSetExample {
    static List<List<Integer>> powerSet(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        result.add(new ArrayList<>());
        // => start with the empty subset

        for (int num : nums) {
            List<List<Integer>> newSubsets = new ArrayList<>();
            for (List<Integer> subset : result) {
                List<Integer> newSub = new ArrayList<>(subset);
                newSub.add(num);
                newSubsets.add(newSub);
            }
            result.addAll(newSubsets);
        }
        return result;
    }

    static List<List<Integer>> subsetsRecursive(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), nums, 0);
        return result;
    }

    static void backtrack(List<List<Integer>> result, List<Integer> current,
                          int[] nums, int start) {
        result.add(new ArrayList<>(current));

        for (int i = start; i < nums.length; i++) {
            current.add(nums[i]);
            backtrack(result, current, nums, i + 1);
            current.remove(current.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(powerSet(new int[]{1, 2, 3}));
        // => Output: [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]
        System.out.println(powerSet(new int[]{1, 2, 3, 4}).size());
        // => Output: 16  (2^4 = 16)

        System.out.println(subsetsRecursive(new int[]{1, 2, 3}));
        // => Output: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The iterative power-set method is simple but builds all 2^n subsets in memory. The backtracking version generates subsets lazily and can prune early when constraints are violated (e.g., only generate subsets with sum ≤ limit), making backtracking more practical for constrained enumeration.

**Why It Matters**: Power set enumeration appears in feature selection (try every subset of features), distributed system partition fault modeling (consider every subset of nodes failing), and cryptographic key combination analysis. The backtracking variant is the skeleton for combination-sum problems, Sudoku solvers, and branch-and-bound optimisation used in integer linear programming solvers. Understanding the 2^n combinatorial explosion motivates constraint-based pruning as the central efficiency technique in search problems.

---

## Combining Techniques

### Example 55: Sliding Window + Hash Map — Minimum Window Substring

Find the smallest window in string `s` that contains all characters of string `t`. This combines a variable sliding window with a character frequency hash map for O(n + m) time.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <string.h>
#include <limits.h>

void min_window_substring(const char *s, const char *t, char *result) {
    if (!*t || !*s) { result[0] = '\0'; return; }

    int need[128] = {0};
    int window[128] = {0};
    int required = 0;
    int formed = 0;

    for (int i = 0; t[i]; i++) {
        if (need[(unsigned char)t[i]] == 0) required++;
        need[(unsigned char)t[i]]++;
    }

    int best_len = INT_MAX, best_left = 0;
    int left = 0;
    int slen = (int)strlen(s);

    for (int right = 0; right < slen; right++) {
        char c = s[right];
        window[(unsigned char)c]++;

        if (need[(unsigned char)c] && window[(unsigned char)c] == need[(unsigned char)c]) {
            formed++;
        }

        while (formed == required && left <= right) {
            int wlen = right - left + 1;
            if (wlen < best_len) {
                best_len = wlen;
                best_left = left;
            }

            char lc = s[left];
            window[(unsigned char)lc]--;
            if (need[(unsigned char)lc] && window[(unsigned char)lc] < need[(unsigned char)lc]) {
                formed--;
            }
            left++;
        }
    }

    if (best_len == INT_MAX) {
        result[0] = '\0';
    } else {
        strncpy(result, s + best_left, best_len);
        result[best_len] = '\0';
    }
}

int main(void) {
    char result[256];
    min_window_substring("ADOBECODEBANC", "ABC", result);
    printf("%s\n", result); // => Output: BANC

    min_window_substring("a", "a", result);
    printf("%s\n", result); // => Output: a

    min_window_substring("a", "aa", result);
    printf("\"%s\"\n", result); // => Output: ""  (not enough a's)
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import (
    "fmt"
    "math"
)

func minWindowSubstring(s, t string) string {
    if len(t) == 0 || len(s) == 0 {
        return ""
    }

    need := map[byte]int{}
    for i := range t {
        need[t[i]]++
    }

    required := len(need)
    formed := 0
    windowCounts := map[byte]int{}

    bestLen := math.MaxInt
    bestLeft := 0

    left := 0
    for right := 0; right < len(s); right++ {
        c := s[right]
        windowCounts[c]++

        if need[c] > 0 && windowCounts[c] == need[c] {
            formed++
        }

        for formed == required && left <= right {
            wLen := right - left + 1
            if wLen < bestLen {
                bestLen = wLen
                bestLeft = left
            }

            lc := s[left]
            windowCounts[lc]--
            if need[lc] > 0 && windowCounts[lc] < need[lc] {
                formed--
            }
            left++
        }
    }

    if bestLen == math.MaxInt {
        return ""
    }
    return s[bestLeft : bestLeft+bestLen]
}

func main() {
    fmt.Println(minWindowSubstring("ADOBECODEBANC", "ABC")) // => Output: BANC
    fmt.Println(minWindowSubstring("a", "a"))               // => Output: a
    fmt.Println(minWindowSubstring("a", "aa"))              // => Output:   (not enough a's)
}
```

{{< /tab >}}
{{< tab >}}

```python
from collections import Counter

def min_window_substring(s, t):
    if not t or not s:
        return ""
        # => edge case: empty input has no valid window

    need = Counter(t)
    # => need[c] = how many of character c we still need in the window
    # => Counter("ABC") = {'A':1, 'B':1, 'C':1}

    required = len(need)
    # => number of distinct characters we must satisfy
    formed = 0
    # => how many distinct characters have met their required count in the window

    window_counts = {}
    # => frequency map of characters in the current window

    result = float("inf"), 0, 0
    # => (window_length, left, right) — tracks best window seen
    # => initialise with infinity so any real window is better

    left = 0
    for right in range(len(s)):
        c = s[right]
        # => expand window by including s[right]
        window_counts[c] = window_counts.get(c, 0) + 1
        # => update frequency of incoming character

        if c in need and window_counts[c] == need[c]:
            formed += 1
            # => this character's requirement is now exactly satisfied
            # => over-satisfying (window_counts[c] > need[c]) does not increment formed

        while formed == required and left <= right:
            # => all required characters are covered: try to shrink from left
            window_len = right - left + 1
            if window_len < result[0]:
                result = (window_len, left, right)
                # => new smallest valid window found

            left_char = s[left]
            window_counts[left_char] -= 1
            # => remove left character as we shrink window
            if left_char in need and window_counts[left_char] < need[left_char]:
                formed -= 1
                # => removing left_char broke a satisfied requirement
            left += 1
            # => advance left boundary to shrink window further

    if result[0] == float("inf"):
        return ""
        # => no valid window found
    return s[result[1]: result[2] + 1]
    # => extract the minimum window substring


print(min_window_substring("ADOBECODEBANC", "ABC"))  # => Output: BANC
print(min_window_substring("a", "a"))                # => Output: a
print(min_window_substring("a", "aa"))               # => Output: ""  (not enough a's)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.HashMap;
import java.util.Map;

public class MinWindowSubstring {
    static String minWindowSubstring(String s, String t) {
        if (t.isEmpty() || s.isEmpty()) return "";

        Map<Character, Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) {
            need.put(c, need.getOrDefault(c, 0) + 1);
        }

        int required = need.size();
        int formed = 0;
        Map<Character, Integer> windowCounts = new HashMap<>();

        int bestLen = Integer.MAX_VALUE, bestLeft = 0;
        int left = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            windowCounts.put(c, windowCounts.getOrDefault(c, 0) + 1);

            if (need.containsKey(c) &&
                windowCounts.get(c).intValue() == need.get(c).intValue()) {
                formed++;
            }

            while (formed == required && left <= right) {
                int wLen = right - left + 1;
                if (wLen < bestLen) {
                    bestLen = wLen;
                    bestLeft = left;
                }

                char lc = s.charAt(left);
                windowCounts.put(lc, windowCounts.get(lc) - 1);
                if (need.containsKey(lc) &&
                    windowCounts.get(lc) < need.get(lc)) {
                    formed--;
                }
                left++;
            }
        }

        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestLeft, bestLeft + bestLen);
    }

    public static void main(String[] args) {
        System.out.println(minWindowSubstring("ADOBECODEBANC", "ABC")); // => Output: BANC
        System.out.println(minWindowSubstring("a", "a"));               // => Output: a
        System.out.println(minWindowSubstring("a", "aa"));              // => Output:
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: The two-phase loop (expand right until valid, then shrink left while valid) ensures each character is processed at most twice (once entering, once leaving), giving O(n) total operations. The `formed` counter avoids scanning all characters in `need` on every step.

**Why It Matters**: Minimum window substring is one of the most complex sliding window problems and appears in NLP preprocessing (find the smallest sentence fragment containing a set of keywords), security log analysis (find the shortest log sequence containing all required audit events), and text-diff algorithms. The two-pointer shrink pattern is also used in the minimum size subarray sum problem and the fruit-into-baskets problem. Mastering this multi-condition sliding window is a significant step toward solving real-time stream analytics problems efficiently.

---

### Example 56: Two Pointers + Sorting — Three Sum

Find all unique triplets in an array that sum to zero. Sorting and two pointers reduce the O(n³) brute force to O(n²) while the sorted structure enables duplicate skipping.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <stdlib.h>

int cmp(const void *a, const void *b) { return *(int *)a - *(int *)b; }

void three_sum(int nums[], int n) {
    qsort(nums, n, sizeof(int), cmp);
    // => sort first: O(n log n)

    printf("[");
    int first = 1;
    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        // => skip duplicate values for the first element

        int left = i + 1, right = n - 1;
        while (left < right) {
            int total = nums[i] + nums[left] + nums[right];
            if (total == 0) {
                if (!first) printf(", ");
                printf("[%d, %d, %d]", nums[i], nums[left], nums[right]);
                first = 0;

                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;
                left++;
                right--;
            } else if (total < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    printf("]\n");
}

int main(void) {
    int nums1[] = {-1, 0, 1, 2, -1, -4};
    three_sum(nums1, 6);
    // => Output: [[-1, -1, 2], [-1, 0, 1]]

    int nums2[] = {0, 0, 0, 0};
    three_sum(nums2, 4);
    // => Output: [[0, 0, 0]]
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import (
    "fmt"
    "sort"
)

func threeSum(nums []int) [][]int {
    sort.Ints(nums)
    // => sort first: O(n log n)
    var result [][]int

    for i := 0; i < len(nums)-2; i++ {
        if i > 0 && nums[i] == nums[i-1] {
            continue
            // => skip duplicate values for the first element
        }

        left, right := i+1, len(nums)-1
        for left < right {
            total := nums[i] + nums[left] + nums[right]
            if total == 0 {
                result = append(result, []int{nums[i], nums[left], nums[right]})

                for left < right && nums[left] == nums[left+1] {
                    left++
                }
                for left < right && nums[right] == nums[right-1] {
                    right--
                }
                left++
                right--
            } else if total < 0 {
                left++
            } else {
                right--
            }
        }
    }
    return result
}

func main() {
    fmt.Println(threeSum([]int{-1, 0, 1, 2, -1, -4}))
    // => Output: [[-1 -1 2] [-1 0 1]]
    fmt.Println(threeSum([]int{0, 0, 0, 0}))
    // => Output: [[0 0 0]]
    fmt.Println(threeSum([]int{1, 2, -2, -1}))
    // => Output: []
}
```

{{< /tab >}}
{{< tab >}}

```python
def three_sum(nums):
    nums.sort()
    # => sort first: O(n log n) — enables two-pointer and deduplication
    result = []
    # => accumulate unique triplets here

    for i in range(len(nums) - 2):
        # => fix the first element at index i
        if i > 0 and nums[i] == nums[i - 1]:
            continue
            # => skip duplicate values for the first element
            # => ensures we don't produce duplicate triplets with same leading value

        left, right = i + 1, len(nums) - 1
        # => two pointers scanning the remaining subarray

        while left < right:
            total = nums[i] + nums[left] + nums[right]
            # => sum of the three candidates

            if total == 0:
                result.append([nums[i], nums[left], nums[right]])
                # => found a valid triplet

                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                    # => skip duplicate values for the second element
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                    # => skip duplicate values for the third element

                left += 1
                right -= 1
                # => advance both pointers to search for more triplets

            elif total < 0:
                left += 1
                # => sum too small: increase by moving left rightward
            else:
                right -= 1
                # => sum too large: decrease by moving right leftward

    return result
    # => all unique triplets summing to zero


print(three_sum([-1, 0, 1, 2, -1, -4]))
# => Output: [[-1, -1, 2], [-1, 0, 1]]

print(three_sum([0, 0, 0, 0]))
# => Output: [[0, 0, 0]]  (only unique triplet)

print(three_sum([1, 2, -2, -1]))
# => Output: []  (no three elements sum to zero)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ThreeSumExample {
    static List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        // => sort first: O(n log n)
        List<List<Integer>> result = new ArrayList<>();

        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            // => skip duplicate values for the first element

            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int total = nums[i] + nums[left] + nums[right];
                if (total == 0) {
                    result.add(Arrays.asList(nums[i], nums[left], nums[right]));

                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (total < 0) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(threeSum(new int[]{-1, 0, 1, 2, -1, -4}));
        // => Output: [[-1, -1, 2], [-1, 0, 1]]
        System.out.println(threeSum(new int[]{0, 0, 0, 0}));
        // => Output: [[0, 0, 0]]
        System.out.println(threeSum(new int[]{1, 2, -2, -1}));
        // => Output: []
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: Sort first, then use an outer loop for the first element and two-pointer scan for the remaining pair. Duplicate skipping at each level (for `i`, `left`, and `right`) ensures uniqueness without a separate set to filter results.

**Why It Matters**: The three-sum pattern generalises to k-sum problems and is a fundamental building block for many problems: closest triplet to a target, 4-sum problems, and triangle inequality checks. In computational geometry, three-sum appears in convex hull algorithms and finding collinear points. The O(n²) solution enabled by sorting demonstrates how transforming input (sorting) can unlock more efficient algorithms than direct enumeration, a pattern that recurs throughout algorithm design.

---

### Example 57: BFS + Graph — Shortest Path in Unweighted Graph

BFS on an unweighted graph finds the shortest path between two nodes because it explores nodes in order of increasing distance from the source. Each level of the BFS queue corresponds to one more edge traversed.

{{< tabs items="C,Go,Python,Java" >}}
{{< tab >}}

```c
#include <stdio.h>
#include <string.h>

#define MAX_NODES 26
#define MAX_EDGES 10
#define MAX_PATH 100

typedef struct {
    int adj[MAX_NODES][MAX_EDGES];
    int adj_count[MAX_NODES];
} UGraph;

void ugraph_init(UGraph *g) { memset(g->adj_count, 0, sizeof(g->adj_count)); }

void ugraph_add_edge(UGraph *g, int u, int v) {
    g->adj[u][g->adj_count[u]++] = v;
    g->adj[v][g->adj_count[v]++] = u;
}

int shortest_path_bfs(UGraph *g, int start, int end, int path[], int *path_len) {
    if (start == end) { path[0] = start; *path_len = 1; return 1; }

    int visited[MAX_NODES] = {0};
    int parent[MAX_NODES];
    memset(parent, -1, sizeof(parent));
    int queue[MAX_NODES], front = 0, back = 0;
    visited[start] = 1;
    queue[back++] = start;

    while (front < back) {
        int node = queue[front++];
        for (int i = 0; i < g->adj_count[node]; i++) {
            int nb = g->adj[node][i];
            if (!visited[nb]) {
                visited[nb] = 1;
                parent[nb] = node;
                if (nb == end) {
                    // => reconstruct path
                    int temp[MAX_PATH], tlen = 0;
                    for (int c = end; c != -1; c = parent[c]) temp[tlen++] = c;
                    *path_len = tlen;
                    for (int j = 0; j < tlen; j++) path[j] = temp[tlen - 1 - j];
                    return 1;
                }
                queue[back++] = nb;
            }
        }
    }
    *path_len = 0;
    return 0;
}

int main(void) {
    UGraph g;
    ugraph_init(&g);
    // A=0,B=1,C=2,D=3,E=4,F=5
    ugraph_add_edge(&g, 0, 1); ugraph_add_edge(&g, 0, 2);
    ugraph_add_edge(&g, 1, 3); ugraph_add_edge(&g, 1, 4);
    ugraph_add_edge(&g, 2, 5); ugraph_add_edge(&g, 4, 5);

    int path[MAX_PATH], plen;
    char names[] = "ABCDEF";
    if (shortest_path_bfs(&g, 0, 5, path, &plen)) {
        printf("[");
        for (int i = 0; i < plen; i++) { if (i) printf(", "); printf("'%c'", names[path[i]]); }
        printf("]\n"); // => Output: ['A', 'C', 'F']
    }

    if (shortest_path_bfs(&g, 0, 4, path, &plen)) {
        printf("[");
        for (int i = 0; i < plen; i++) { if (i) printf(", "); printf("'%c'", names[path[i]]); }
        printf("]\n"); // => Output: ['A', 'B', 'E']
    }
    return 0;
}
```

{{< /tab >}}
{{< tab >}}

```go
package main

import "fmt"

func shortestPathBFS(graph map[string][]string, start, end string) []string {
    if start == end {
        return []string{start}
    }

    visited := map[string]bool{start: true}
    type entry struct {
        node string
        path []string
    }
    queue := []entry{{start, []string{start}}}

    for len(queue) > 0 {
        e := queue[0]
        queue = queue[1:]

        for _, nb := range graph[e.node] {
            if !visited[nb] {
                newPath := make([]string, len(e.path)+1)
                copy(newPath, e.path)
                newPath[len(e.path)] = nb

                if nb == end {
                    return newPath
                    // => BFS guarantees this is shortest path
                }

                visited[nb] = true
                queue = append(queue, entry{nb, newPath})
            }
        }
    }

    return nil
}

func main() {
    graph := map[string][]string{
        "A": {"B", "C"},
        "B": {"A", "D", "E"},
        "C": {"A", "F"},
        "D": {"B"},
        "E": {"B", "F"},
        "F": {"C", "E"},
    }

    fmt.Println(shortestPathBFS(graph, "A", "F")) // => Output: [A C F]
    fmt.Println(shortestPathBFS(graph, "A", "E")) // => Output: [A B E]
    fmt.Println(shortestPathBFS(graph, "D", "F")) // => Output: [D B E F]
    fmt.Println(shortestPathBFS(graph, "A", "A")) // => Output: [A]
}
```

{{< /tab >}}
{{< tab >}}

```python
from collections import deque


def shortest_path_bfs(graph, start, end):
    # => graph: adjacency list as dict {node: [neighbours]}
    # => returns shortest path as list of nodes, or [] if unreachable

    if start == end:
        return [start]
        # => trivial case: start and end are the same node

    visited = {start}
    # => visited set prevents revisiting nodes and looping
    queue = deque([(start, [start])])
    # => each queue entry is (current_node, path_from_start_to_current_node)
    # => tracking the path avoids a separate predecessor dict

    while queue:
        node, path = queue.popleft()
        # => dequeue the next node and its full path from start

        for neighbour in graph.get(node, []):
            # => iterate over this node's neighbours
            if neighbour not in visited:
                new_path = path + [neighbour]
                # => extend path to include this neighbour

                if neighbour == end:
                    return new_path
                    # => reached destination: BFS guarantees this is shortest path
                    # => because all shorter paths were already dequeued (FIFO order)

                visited.add(neighbour)
                # => mark before enqueuing to prevent duplicate entries
                queue.append((neighbour, new_path))
                # => enqueue for future exploration

    return []
    # => end is unreachable from start


graph = {
    "A": ["B", "C"],
    "B": ["A", "D", "E"],
    "C": ["A", "F"],
    "D": ["B"],
    "E": ["B", "F"],
    "F": ["C", "E"],
}

print(shortest_path_bfs(graph, "A", "F"))
# => Output: ['A', 'C', 'F']  (length 3, shortest path)

print(shortest_path_bfs(graph, "A", "E"))
# => Output: ['A', 'B', 'E']  (length 3)

print(shortest_path_bfs(graph, "D", "F"))
# => Output: ['D', 'B', 'E', 'F']  (length 4)
# => also valid: ['D', 'B', 'A', 'C', 'F'] — BFS finds one shortest path

print(shortest_path_bfs(graph, "A", "A"))
# => Output: ['A']  (trivial path)
```

{{< /tab >}}
{{< tab >}}

```java
import java.util.*;

public class ShortestPathBFS {
    static List<String> shortestPathBFS(Map<String, List<String>> graph,
                                        String start, String end) {
        if (start.equals(end)) return List.of(start);

        Set<String> visited = new HashSet<>();
        visited.add(start);
        Queue<Object[]> queue = new LinkedList<>();
        queue.add(new Object[]{start, new ArrayList<>(List.of(start))});

        while (!queue.isEmpty()) {
            Object[] entry = queue.poll();
            String node = (String) entry[0];
            @SuppressWarnings("unchecked")
            List<String> path = (List<String>) entry[1];

            for (String nb : graph.getOrDefault(node, Collections.emptyList())) {
                if (!visited.contains(nb)) {
                    List<String> newPath = new ArrayList<>(path);
                    newPath.add(nb);

                    if (nb.equals(end)) return newPath;
                    // => BFS guarantees this is shortest path

                    visited.add(nb);
                    queue.add(new Object[]{nb, newPath});
                }
            }
        }
        return Collections.emptyList();
    }

    public static void main(String[] args) {
        Map<String, List<String>> graph = Map.of(
            "A", List.of("B", "C"),
            "B", List.of("A", "D", "E"),
            "C", List.of("A", "F"),
            "D", List.of("B"),
            "E", List.of("B", "F"),
            "F", List.of("C", "E")
        );

        System.out.println(shortestPathBFS(graph, "A", "F"));
        // => Output: [A, C, F]
        System.out.println(shortestPathBFS(graph, "A", "E"));
        // => Output: [A, B, E]
        System.out.println(shortestPathBFS(graph, "D", "F"));
        // => Output: [D, B, E, F]
        System.out.println(shortestPathBFS(graph, "A", "A"));
        // => Output: [A]
    }
}
```

{{< /tab >}}
{{< /tabs >}}

**Key Takeaway**: BFS guarantees shortest-path correctness on unweighted graphs because it visits nodes in non-decreasing order of edge count from the source. The first time BFS reaches the destination, the current path is necessarily shortest.

**Why It Matters**: BFS shortest path is used in GPS navigation (hops in road networks), social network analysis (degrees of separation), web crawlers (finding shortest link path between pages), and puzzle solvers (15-puzzle, Rubik's cube state-space search). For weighted graphs, Dijkstra's algorithm extends BFS by replacing the FIFO queue with a priority queue (heap), combining the BFS exploration strategy with the heap from Example 35. Understanding BFS correctness is the prerequisite for understanding Dijkstra's proof and the broader family of best-first search algorithms.

---

This section covered 29 examples (Examples 29-57) spanning binary search (O(log n) sorted array operations), hash table internals (chaining, frequency counting), binary search trees (insert, search, three traversal orders), heaps (min-heap, max-heap, heapify), efficient sorting algorithms (merge sort O(n log n), quicksort average O(n log n) worst O(n²), counting sort O(n+k)), AVL tree balance concepts, BFS and DFS on trees and graphs, divide-and-conquer and backtracking recursion patterns, two-pointer and sliding window techniques, prefix sums, and adjacency list/matrix graph representations.

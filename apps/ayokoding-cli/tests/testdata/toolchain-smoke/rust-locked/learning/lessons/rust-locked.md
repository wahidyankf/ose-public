# Rust locked dependencies hello

The unit builds one crate from the locked sources and prints a fixed line.

**`learning/code/ex-01-hellors/src/main.rs`**

```rust
fn main() {
    let mut buf = itoa::Buffer::new();
    println!("answer: {}", buf.format(42));
}
```

**Output** (`learning/code/ex-01-hellors/expected/main.stdout.txt`):

```text
answer: 42
```

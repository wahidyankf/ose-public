fn main() {
    let mut buf = itoa::Buffer::new();
    println!("answer: {}", buf.format(42));
}

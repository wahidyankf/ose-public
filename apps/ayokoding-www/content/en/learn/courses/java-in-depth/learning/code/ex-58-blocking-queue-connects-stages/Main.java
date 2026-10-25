// Example 58: BlockingQueue Connects Stages.
// Producer and consumer share a bounded queue: puts block when full,
// takes block when empty, and a pill message ends the stream cleanly.
import java.util.ArrayList; // => the consumed lines in take order
import java.util.List; // => interface on the left as always
import java.util.concurrent.ArrayBlockingQueue; // => the bounded handoff channel
import java.util.concurrent.BlockingQueue; // => the blocking put-take contract

public class Main {

  // => one public class per file, named after the file
  static final String PILL = "STOP"; // => the poison message ending the stream

  public static void main(String[] args) throws InterruptedException {
    // => puts, takes, joins are checked
    BlockingQueue<String> pipe = new ArrayBlockingQueue<>(4); // => bounded: backpressure at four lines
    List<String> eaten = new ArrayList<>(); // => consumer banks takes in order
    Thread producer = new Thread(() -> {
      // => the feeding stage
      try {
        // => puts block when the queue fills
        pipe.put("sari:50"); // => first dues line into the pipe
        pipe.put("budi:75"); // => second dues line into the pipe
        pipe.put("citra:25"); // => third dues line into the pipe
        pipe.put(PILL); // => poison pill ends the stream
      } catch (InterruptedException e) {
        // => blocking calls answer interrupts
        Thread.currentThread().interrupt(); // => restore the flag, exit quietly
      } // => catch ends: stage ends early on interrupt
    }); // => producer defined: three lines plus the pill
    Thread consumer = new Thread(() -> {
      // => the draining stage
      try {
        // => takes block when the queue empties
        String line; // => holds each taken line in turn
        while (!(line = pipe.take()).equals(PILL)) {
          // => pill ends the loop, lines bank first
          eaten.add(line); // => banked in queue order, which is feed order
        } // => loop ends at the pill: three lines banked
      } catch (InterruptedException e) {
        // => blocking calls answer interrupts
        Thread.currentThread().interrupt(); // => restore the flag, exit quietly
      } // => catch ends: stage ends early on interrupt
    }); // => consumer defined: drain until the pill
    producer.start(); // => feeder runs
    consumer.start(); // => drainer runs alongside
    producer.join(); // => feeding complete before main proceeds
    consumer.join(); // => draining complete: pill eaten, loop exited
    System.out.println("eaten: " + eaten); // => Output: eaten: [sari:50, budi:75, citra:25]
    System.out.println("pipe drained: " + pipe.isEmpty()); // => Output: pipe drained: true
  } // => main ends: staged handoff, ordered transcript
}

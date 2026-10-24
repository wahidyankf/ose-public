// Example 77: Cleanup Order in Use Blocks.
// Nested use blocks close inside-out: the inner closes while the outer
// still stands. Acquisition sits beside release; distant cleanup is a leak.
import java.io.File // => the two fixture paths, opened in nesting order

fun main() { // => the entry point the harness runs
    val src = File("src.txt") // => outer resource: opened first, closed last
    val dst = File("dst.txt") // => inner resource: opened second, closed first
    src.writeText("sari:50\n", Charsets.UTF_8) // => fixture bytes, written before the nesting
    src.reader(Charsets.UTF_8).use { reader -> // => outer use: the reader guards the source
        dst.writer(Charsets.UTF_8).use { writer -> // => inner use: the writer guards the copy
            writer.write(reader.readText().uppercase()) // => copy transformed: the nested work
        } // => inner closes first: writer flushed while the reader still stands
    } // => outer closes last: the stack unwinds inside-out, guaranteed
    println("copied: " + dst.readText(Charsets.UTF_8).trim()) // => Output: copied: SARI:50
    println("order: inner-first") // => Output: order: inner-first
    src.delete() // => tidy both fixtures: reruns start identical
    dst.delete() // => inner tidied second, closing order mirrored
} // => main ends: nested work done, inside-out cleanup, no traces

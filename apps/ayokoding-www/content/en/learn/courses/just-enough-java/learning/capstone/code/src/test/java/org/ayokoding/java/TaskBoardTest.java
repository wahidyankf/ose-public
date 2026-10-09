package org.ayokoding.java;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

final class TaskBoardTest {
    @Test
    void reportsOnlySortedOpenTasks() {
        var tasks = List.of(
                new TaskBoard.Task("zebra", new TaskBoard.Open()),
                new TaskBoard.Task("alpha", new TaskBoard.Open()),
                new TaskBoard.Task("done", new TaskBoard.Done()));

        assertEquals(List.of("alpha", "zebra"), TaskBoard.openTaskNames(tasks));
    }

    @Test
    void rendersEverySealedState() {
        assertEquals("write: open", TaskBoard.render(new TaskBoard.Task("write", new TaskBoard.Open())));
        assertEquals("review: done", TaskBoard.render(new TaskBoard.Task("review", new TaskBoard.Done())));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " "})
    void rejectsBlankTaskNames(String name) {
        assertThrows(IllegalArgumentException.class, () -> new TaskBoard.Task(name, new TaskBoard.Open()));
    }

    @Test
    void rejectsMissingTaskState() {
        assertThrows(NullPointerException.class, () -> new TaskBoard.Task("read", null));
    }
}


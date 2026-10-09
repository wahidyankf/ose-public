package org.ayokoding.java;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public final class TaskBoard {
    private TaskBoard() {}

    public record Task(String name, TaskState state) {
        public Task {
            if (name == null || name.isBlank()) {
                throw new IllegalArgumentException("name is required");
            }
            Objects.requireNonNull(state, "state is required");
        }
    }

    public sealed interface TaskState permits Open, Done {}

    public record Open() implements TaskState {}

    public record Done() implements TaskState {}

    public static List<String> openTaskNames(List<Task> tasks) {
        return tasks.stream()
                .filter(task -> task.state() instanceof Open)
                .map(Task::name)
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    public static String render(Task task) {
        return switch (task.state()) {
            case Open open -> task.name() + ": open";
            case Done done -> task.name() + ": done";
        };
    }

    public static void main(String[] args) {
        var tasks = List.of(new Task("write report", new Open()), new Task("review report", new Done()));
        openTaskNames(tasks).forEach(System.out::println);
    }
}


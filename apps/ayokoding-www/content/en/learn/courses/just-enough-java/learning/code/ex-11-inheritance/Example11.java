public final class Example11 {
    static class Task {
        // => The base type provides a label implementation.
        String label() { return "task"; } // => A plain Task reports task before any override.
    }
    static final class DoneTask extends Task {
        // => DoneTask inherits Task but supplies a different label.
        @Override String label() { return "done"; } // => replaces base behavior
    }
    public static void main(String[] args) {
        Task task = new DoneTask(); // => base reference, derived object
        // => The variable's static type is Task; the object's runtime type is DoneTask.
        System.out.println(task.label()); // => done
        // => Dispatch chooses DoneTask.label at runtime.
    }
}

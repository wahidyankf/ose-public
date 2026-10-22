// Example 74: Todo State Machine.
//
// Read this like an operator: the task list is a small machine where each
// command (add, start, finish, drop) is legal in some states and refused
// in others, exactly like the order machine in Example 30. The transcript
// runs a fixed script of six commands and prints each outcome, so the
// legal path and the two refusals are all visible in one reading.
// => commands are an enum: the script below is data, not six loose calls
// => run matches command against state: illegal pairs refuse with reasons

// Task tracks one unit of work from creation to done or dropped.
// => Open waits: nothing has started, everything is still possible
// => Doing carries the starter: accountability rides with the state
// => Done and Dropped are terminal: no command leaves either one
// => Copy lets the script hand the task to run and keep the name below
#[derive(Debug, Clone, Copy)]
enum Task {
    // => four variants, two terminal: the machine's whole shape at a glance
    Open {
        title: &'static str,
    },
    // => Open waits: Done and Dropped below accept no commands
    Doing {
        title: &'static str,
        by: &'static str,
    },
    // => Doing names the actor: accountability rides with the state
    Done {
        title: &'static str,
    },
    // => Done is terminal: Finish already consumed the work
    Dropped {
        title: &'static str,
        reason: &'static str,
    },
    // => Dropped keeps why: the reason outlives the task
}

// Command names the six script steps main runs below, in order.
// => Add carries a title: creation needs nothing else to proceed
// => Start and Drop name their actor: the transcript shows who
#[derive(Debug, Clone, Copy)]
enum Command {
    // => four commands, one per legal move: add, start, finish, drop
    Add(&'static str),
    // => Add carries the title: creation needs a name, nothing else
    Start(&'static str),
    // => Start carries the actor: the transcript shows who began the work
    Finish,
    // => Finish carries nothing: Doing already holds everything needed
    Drop(&'static str),
    // => Drop carries the reason: cancellation records why, not just that
}

// describe renders the task for refusal lines: every field earns its reading.
// => each variant names its data: titles, actors, and reasons all print
// => the catch-all refusal below calls this: no field stays unread
impl Task {
    // => describe is the only method: rendering for refusal lines
    fn describe(&self) -> String {
        // => &self borrows: describing never consumes the task
        match self {
            // => one arm per variant: every state earns its reading
            Task::Open { title } => format!("open {title:?}"),
            // => open lowercases: the transcript reads like a status line
            Task::Doing { title, by } => format!("{title:?} doing by {by}"),
            // => doing names the actor: accountability prints inline
            Task::Done { title } => format!("{title:?} done"),
            // => done stamps the title: the work is complete, recorded
            Task::Dropped { title, reason } => format!("{title:?} dropped: {reason}"),
            // => dropped quotes why: the reason prints beside the title
        }
    }
}

// run applies one command to the current task, evolving or refusing it.
// => Option<Task> input: commands before any Add meet no task at all
// => Ok carries the next task: Err carries the refusal with its reason
fn run(current: Option<Task>, command: Command) -> Result<Option<Task>, String> {
    // => Option in, Result of Option out: absence and refusal stay distinct
    match (current, command) {
        // => the tuple matches state against command: every pair decides once
        // => Add on empty creates the task: the only birth in the machine
        (None, Command::Add(title)) => Ok(Some(Task::Open { title })),
        // => Add on an existing task refuses: one task at a time here
        (Some(_), Command::Add(title)) => {
            Err(format!("refused: {title:?} arrives while a task is open"))
        }
        // => Start moves Open to Doing: the actor's name rides along
        (Some(Task::Open { title }), Command::Start(by)) => Ok(Some(Task::Doing { title, by })),
        // => Finish moves Doing to Done: the work is complete, recorded
        (Some(Task::Doing { title, .. }), Command::Finish) => Ok(Some(Task::Done { title })),
        // => Drop from Open or Doing records why: the reason outlives the task
        (Some(Task::Open { title }), Command::Drop(reason)) => {
            Ok(Some(Task::Dropped { title, reason }))
        }
        (Some(Task::Doing { title, .. }), Command::Drop(reason)) => {
            Ok(Some(Task::Dropped { title, reason }))
        }
        // => every other pair refuses: Done and Dropped accept no commands
        (Some(task), command) => Err(format!("refused: {command:?} on {}", task.describe())),
        // => the catch-all names both: command plus the describing task
        (None, command) => Err(format!("refused: {command:?} with no task")),
        // => no task at all: commands before the first Add land here
    }
}

fn main() {
    // => six commands, six outcomes: the legal path plus three refusals
    // => the fixed script: add, start, finish, then two refusals and a drop
    let script = [
        // => the array is the script: six commands in run order
        Command::Add("grade roster"),
        // => birth: the machine starts empty, Add creates the task
        Command::Start("sari"),
        // => Open to Doing: sari takes accountability here
        Command::Finish,
        // => Doing to Done: the terminal state, recorded
        Command::Start("budi"),
        // => refused: Done accepts no Start, the transcript proves it
        Command::Drop("superseded"),
        // => refused: Done accepts no Drop either, reason unrecorded
        Command::Add("next roster"),
        // => refused: one task at a time, even after Done
    ];
    // => the machine starts empty: the first Add creates the task above
    let mut current: Option<Task> = None;
    // => None starts the machine: no task exists before the first Add
    for command in script {
        // => Command is Copy: run takes it, the name stays printable after
        // => each step prints: the next state, or the refusal with reasons
        match run(current, command) {
            Ok(next) => {
                // => the next state prints whole: Debug shows the machine's memory
                println!("{command:?} -> {next:?}");
                // => command then state: each line reads as cause and effect
                current = next;
                // => install the next state: the machine rests here until stepped
            }
            Err(reason) => println!("{reason}"),
        }
    }
}

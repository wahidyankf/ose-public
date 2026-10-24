# Kata starter: fill the four contract slots, then compare with after/kata.py.
# => The task names one verb plus one object.
task = ""  # => TODO: name the task
# => The scope names the files the agent may touch.
scope = ""  # => TODO: bound the scope
# => The done condition is the check that proves the work finished.
done = ""  # => TODO: state the done condition
# => Guardrails name what must not happen during the task.
guardrails = []
# => Score the four slots exactly like the worked examples do.
# => Four of four is submittable; less means rewrite the brief.
score = sum(
    [bool(task), bool(scope), bool(done), bool(guardrails)]
)  # => count filled slots
# => Print the score so the starting point is on the record.
print("brief-score:", score, "of 4")  # => Output grades the starter

# Kata starter: fill the four contract slots, then compare.
# => The task names one verb plus one object.
task = "speed up checkout"  # => vague: no object, no metric
# => The scope names the files the agent may touch.
scope = ""  # => TODO: bound the scope
# => The done condition is the check that proves it finished.
done = ""  # => TODO: state the done condition
# => Guardrails name what must not happen during the task.
guardrails = []  # => TODO: add limits
# => Score the four slots exactly like the worked examples do.
# => Four of four is submittable; less means rewrite the brief.
score = bool(task) + bool(scope)  # => first half of the slots
score += bool(done) + bool(guardrails)  # => the count completes
# => Print the score so the starting point is on the record.
print("brief-score:", score, "of 4")  # => Output grades the starter

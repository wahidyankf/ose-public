# Kata 1: Scoped Task Brief
# => A task brief is a contract: scope, done, guardrails.
# => Vague prompts breed confident wrong work; briefs prevent it.
# => The shim scores a brief, standing in for your own review.
task = "cut p95 checkout latency under 800ms"  # => verb plus object
# => Scope names the files the agent may touch.
scope = "src/checkout/"  # => the boundary of the job
# => The done condition is the check proving it finished.
done = "p95 under 800ms for 10 minutes"  # => measurable line
# => Guardrails are named limits the run cannot skip.
guardrails = [  # => the limits attached to this task
    "no schema change",  # => first guardrail
    "budget 25 turns",  # => second guardrail
]  # => the closed list
# => Two guardrails beat five the agent will forget.
# => Each filled slot earns one point, no partial credit.
score = bool(task) + bool(scope)  # => first half of the slots
score += bool(done) + bool(guardrails)  # => the count completes
# => Print the score so the result is on the record.
# => The scorer takes seconds; the failures it catches cost hours.
print("brief-score:", score, "of 4")  # => Output grades the brief
# => The verdict names the bar so the reader can reuse it.
print("submittable:", score == 4)  # => True only when complete

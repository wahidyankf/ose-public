# Kata 1: Scoped Task Brief
# => A task brief is a contract: scope, done condition, guardrails.
# => Vague prompts breed confident wrong work; the brief prevents it.
# => The shim scores a brief, standing in for your own review.
task = "cut p95 checkout latency under 800ms"  # => one verb plus one object, never a paragraph
scope = "src/checkout/"  # => the files the agent may touch
done = "k6 p95 under 800ms for 10 minutes"  # => the check that proves the work finished
# => Guardrails are named limits: budget, approval, reversibility.
# => Each guardrail below is one string the scorer can see.
# => Limits turn advice into enforcement the session cannot skip.
guardrails = [
    "no schema change",
    "budget 25 turns",
]  # => the limits attached to this task
# => The scorer checks four slots: task, scope, done, guardrails.
# => A missing slot is not style, it is an unenforceable contract.
score = 0  # => count of contract slots actually filled
score += 1 if task else 0  # => a named task earns one point
score += 1 if scope else 0  # => a named scope earns one point
score += 1 if done else 0  # => a done condition earns one point
score += 1 if guardrails else 0  # => guardrails earn the last point
# => Four of four is submittable; less means rewrite the brief.
print("brief-score:", score, "of 4")  # => Output grades the contract
# => The verdict names the bar so the reader can reuse it.
print("submittable:", score == 4)  # => True only when complete

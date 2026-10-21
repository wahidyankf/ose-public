# Kata 01 starter: retract a color, then read it now and as of before.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Add the retraction, then read the color twice.
db = [(1, "part/color", "red", 70101)]  # => the original color fact
# => TODO: retract red at transaction 70102.
retracted_at = None  # => TODO: replace None with 70102
# => Read the color now: empty only when the retraction exists.
now = [] if retracted_at == 70102 else ["red"]  # => TODO: derive from the retraction
# => Read the color as of 70101: red in both versions.
then = [v for _e, _a, v, t in db if t <= 70101]  # => the past still shows red
# => Print both readings.
print("now:", now)  # => Output is empty after the fix
# => The check the lesson quotes.
print("then:", then)  # => Output shows red

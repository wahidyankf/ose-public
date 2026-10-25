# Kata 01 solution: retract a color, then read it now and as of before.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The retraction ends the present; the past stays readable.
db = [(1, "part/color", "red", 70101)]  # => the original color fact
# => Red is discontinued at transaction 70102.
retracted_at = 70102  # => visibility ends here
# => Now is empty because the retraction landed.
now = [] if retracted_at == 70102 else ["red"]  # => the present reading
# => As of 70101 the retraction had not happened yet.
then = [v for _e, _a, v, t in db if t <= 70101]  # => the past reading
# => Print both readings.
print("now:", now)  # => Output is empty
# => The check the lesson quotes.
print("then:", then)  # => Output shows red

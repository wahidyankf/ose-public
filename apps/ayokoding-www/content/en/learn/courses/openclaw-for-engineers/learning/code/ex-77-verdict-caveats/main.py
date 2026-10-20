# => Verdict plus limits plus sign-off.
# => Unsigned verdicts stay drafts.
verdict = "openclaw wins compare-001"  # => the scored outcome from Example 75
# => verdict is one plain string
limits = ["fixture shims, not live tools", "single task, not a suite"]  # => the two named limits of this verdict
# => limits has 2 entries (type: list)
print("verdict: " + verdict)  # => Output: verdict: openclaw wins compare-001
for limit in limits:  # => state each limit plainly
    print("limit: " + limit)  # => Output: two limit lines
signed = True  # => fixture: a human signs the verdict
# => sign-off is explicit, never assumed
print("signed off: " + str(signed))  # => Output: signed off: True
published = signed  # => publication requires the signature
# => published is True here
print("published: " + str(published))  # => Output: published: True

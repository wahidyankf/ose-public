# => Buggy: the summary decides.
# => A confident lie passes.
summary = "all files archived successfully"  # => the agent's confident claim
# => prose, not evidence
workspace = ["inbox.md"]  # => the only file really present
# => archive.md is missing
trust = "successfully" in summary  # => BUG: verdict reads the prose
# => any confident summary passes
print("summary: " + summary)  # => Output: the confident claim
print("trust: " + str(trust))  # => Output: trust: True, wrongly

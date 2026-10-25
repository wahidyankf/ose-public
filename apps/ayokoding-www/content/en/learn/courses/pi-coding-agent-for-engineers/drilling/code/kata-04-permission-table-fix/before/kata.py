# Kata starter: resolve the tool set for a review task.
# => Pi enables read, bash, edit, write unless told otherwise.
defaults = ["read", "bash", "edit", "write"]  # => startup list
# => TODO: review needs reading tools only; drop the writers.
overrides = []  # => TODO: name the minus flags
print("defaults:", defaults)  # => Output shows the start

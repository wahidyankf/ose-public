# => Buggy: direct indexing crashes.
# => The user sees a KeyError, not guidance.
config = {"agents": {"model": "primary"}}  # => fixture config missing models
# => models section absent
try:  # => attempt the direct read that real code tried
    model = config["models"]["primary"]  # => BUG: KeyError on models
    # => the missing section raises
    print("model: " + model)  # => never reached on this config
    # => the handler runs instead
except KeyError as missing:  # => catch the crash the user would see
    # => missing names the absent section
    print("crashed: KeyError " + str(missing))  # => Output: crashed: KeyError 'models'

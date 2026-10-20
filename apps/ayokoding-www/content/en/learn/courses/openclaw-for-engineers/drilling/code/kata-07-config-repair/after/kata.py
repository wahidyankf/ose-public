# => Fixed: missing sections report clearly.
# => Guidance replaces the traceback.
config = {"agents": {"model": "primary"}}  # => same fixture config, still no models
# => facts did not change
section = config.get("models")  # => FIX: .get() returns None when absent
# => no exception is raised
ok = section is not None and "primary" in section  # => both levels must exist
# => ok is False here
print("models section present: " + str(section is not None))  # => Output: models section present: False
print("run: openclaw configure models")  # => the repair the message prescribes
# => guidance, not traceback
print("config readable: " + str(ok))  # => Output: config readable: False, clearly

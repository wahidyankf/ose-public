# => Example 16: guards exit early; success stays flat.
def register(name, age):  # => validate, then build the record
    if not name:  # => WHY guard: empty names rejected at the door
        return "name required"  # => immediate exit with the reason
    if not isinstance(age, int):  # => WHY guard: wrong type, no point continuing
        return "age must be int"  # => immediate exit, type named
    if age < 0:  # => WHY guard: impossible value rejected before use
        return "age must fit"  # => immediate exit, range named
    return f"registered {name} ({age})"  # => WHY flat: every guard passed above


print(register("", 30))  # => Output: name required, first guard fired
print(register("ada", "old"))  # => Output: age must be int, second guard fired
print(register("ada", -1))  # => Output: age must fit, third guard fired
print(register("ada", 36))  # => Output: registered ada (36), success flat

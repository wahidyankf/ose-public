# => Example 50: fixed shapes cross boundaries intact.
def divide(text):  # => split a key=value pair, exactly two parts
    key, _, value = text.partition("=")  # => WHY partition: always three pieces
    return key, value  # => WHY tuple: the shape is the contract


key, value = divide("retries=3")  # => WHY unpack: both parts named at use
print(key)  # => Output: retries, first field
print(value)  # => Output: 3, second field
pair = ("a", 1)  # => a fixed two-shape held whole
try:  # => WHY try: the failure is the demonstration
    pair[0] = "b"  # => item assignment: tuples refuse this
except TypeError:  # => the guarantee enforced by the runtime
    print("tuples refuse mutation")  # => Output: tuples refuse mutation
print(len(pair))  # => Output: 2, shape intact after the attempt

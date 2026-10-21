# => Example 15: else separates success from the risky call.
def fetch(users, name):  # => look up one user record by name
    try:  # => WHY narrow: only the lookup can raise KeyError
        record = users[name]  # => the single risky statement
    except KeyError:  # => handler names exactly one operation
        return "unknown user"  # => recovery for the lookup alone
    else:  # => WHY else: formatting cannot reach the handler now
        return f"{record['name']} is {record['age']}"  # => success path, isolated


users = {"ada": {"name": "ada", "age": 36}}  # => one complete record
print(fetch(users, "ada"))  # => Output: ada is 36, else road
print(fetch(users, "grace"))  # => Output: unknown user, except road

# => Example 9: each try clause has exactly one job.
def parse_age(raw):  # => convert a raw field to an age in years
    try:  # => WHY try: only the risky conversion sits inside
        value = int(raw)  # => the one call allowed to raise here
    except ValueError:  # => WHY except: non-numeric input is expected
        return "bad input"  # => recovery names the failure, fixed label
    else:  # => WHY else: success path outside the handler reach
        return f"age {value}"  # => runs only when int() succeeded
    finally:  # => WHY finally: cleanup owed by both outcomes
        print("parsed one field")  # => Output twice: always runs


print(parse_age("33"))  # => Output: age 33, success took the else road
print(parse_age("old"))  # => Output: bad input, except recovered

# => Example 12: one base plus leaves gives callers three granularities.
class LedgerError(Exception):  # => WHY base: every ledger failure caught here
    pass  # => the family umbrella: policy-level handling


class Overdrawn(LedgerError):  # => leaf: balance cannot cover the charge
    pass  # => precise type: handlers name this exact failure


class UnknownAccount(LedgerError):  # => leaf: the account id is not held
    pass  # => precise type: routing-level handling


def charge(accounts, name, amount):  # => charge one account, domain errors only
    if name not in accounts:  # => unknown id is a domain failure
        raise UnknownAccount(name)  # => leaf raised: callers can be precise
    if accounts[name] < amount:  # => insufficient funds is a domain failure
        raise Overdrawn(name)  # => leaf raised: distinct from unknown


try:  # => caller handles the leaf precisely
    charge({"ada": 50}, "grace", 10)  # => unknown account: grace not held
except UnknownAccount:  # => precise catch: the exact failure named
    print("unknown account")  # => Output: unknown account
try:  # => caller handles the whole family at once
    charge({"ada": 50}, "ada", 500)  # => overdrawn: 50 cannot cover 500
except LedgerError:  # => WHY base: family policy in one clause
    print("ledger refused")  # => Output: ledger refused

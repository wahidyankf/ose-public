# => Example 70: hash lookup keeps membership constant-time.
ALLOWED = frozenset(["web", "api", "worker"])  # => WHY frozenset: policy immutable


def can_deploy(service):  # => the gate every deploy passes
    return service in ALLOWED  # => WHY set: O(1) regardless of policy size


print(can_deploy("web"))  # => Output: True, listed service passes
print(can_deploy("legacy"))  # => Output: False, unlisted service refused
print(len(ALLOWED))  # => Output: 3, policy size fixed
print("api" in ["web", "api", "worker"])  # => Output: True, lists scan fine small

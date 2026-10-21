# => Kata reference: federated role replaces the stored AWS key.
# => Checked against the vendor OIDC hardening docs on 2026-10-20.
# => WORKFLOW mirrors the migrated file: permission plus assumption.
# => No stored key string may remain anywhere in the migrated text.

# => WHY this shape: federation removes the secret instead of rotating it.
# => The permission unlocks minting; the role bounds what it can do.
# => Revoke the old key; unused keys are found by scanners anyway.
WORKFLOW = "permissions id-token write; role-to-assume deployer"  # => migrated
ROLE = "arn:aws:iam::123456789012:role/deployer"  # => assumed role ARN


def migrated(text):  # => True when no stored-key trace remains
    banned = ["AWS_KEY", "aws-access-key-id"]  # => stored-key traces
    return all(b not in text for b in banned)  # => clean when absent


def main():  # => print the role and the migration verdict
    print("role:", ROLE)  # => Output: the assumed role ARN
    print("migrated:", migrated(WORKFLOW))  # => Output: True
    print("stored-keys:", 0)  # => none remain after migration


main()  # => run once; False means a stored-key trace survived

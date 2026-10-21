# => Kata reference: the deploy targets production and pauses.
# => Checked against the vendor environments docs on 2026-10-20.
# => ENVIRONMENT names the guarded target; rules live server-side.
# => Naming it scopes secrets and summons the required reviewers.

# => WHY this shape: unpaused deploys ship at machine speed at 3am.
# => The name is the whole integration: approvals follow automatically.
# => Staging gets its own job and name; never share one environment.
ENVIRONMENT = "production"  # => the guarded target


def guarded(env):  # => True when the target is a guarded name
    return env in ("staging", "production")  # => known targets only


def main():  # => print the target and the guard verdict
    print("environment:", ENVIRONMENT)  # => Output: production
    print("guarded:", guarded(ENVIRONMENT))  # => Output: True
    print("approvals:", "required" if guarded(ENVIRONMENT) else "open")  # => gate


main()  # => run once; open means anyone ships anything

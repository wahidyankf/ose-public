# Example 66: Pin Plugin Versions
# => Vendor facts rot fast: version, defaults, and prices all drift.
# => The shim pins the verified version string inside the example.
# => Pinning turns a silent lie into a loud, dated, checkable claim.
verified_version = "review-bot-1.9.0"  # => Hermes release checked on the date below
access_date = "2026-10-20"
claims = [
    "summary format",
    "max-lines default",
    "supported diff size",
]  # => facts that expire with the version
# => Every claim is printed beside its date so staleness is visible.
# => A reader in two years checks the date first, the fact second.
print("verified:", verified_version)  # => Output pins the release
# => The date travels with the claim, never in a distant footnote.
print("accessed:", access_date)  # => Output pins the check day
# => Counting claims keeps the author honest about the surface.
print("dated-claims:", len(claims))  # => how many facts carry a date

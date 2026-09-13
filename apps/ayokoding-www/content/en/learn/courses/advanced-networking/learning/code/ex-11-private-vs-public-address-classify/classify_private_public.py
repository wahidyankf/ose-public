# learning/code/ex-11-private-vs-public-address-classify/classify_private_public.py
"""Example 11: Classify Addresses -- RFC 1918 Private vs. Public."""  # => co-06: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic

import ipaddress  # => co-06: stdlib's own IPv4Network -- used both to test containment and to cross-check the classification

PRIVATE_RANGES = [  # => co-06: the exact three RFC 1918 blocks this topic's accuracy notes cite -- nothing outside these is private
    ipaddress.IPv4Network("10.0.0.0/8"),  # => co-06: the largest RFC 1918 block -- 16,777,216 addresses
    ipaddress.IPv4Network("172.16.0.0/12"),  # => co-06: a mid-sized block -- 1,048,576 addresses
    ipaddress.IPv4Network("192.168.0.0/16"),  # => co-06: the smallest, most commonly seen home-router block -- 65,536 addresses
]  # => co-06: closes the multi-line construct opened above


def classify(address: str) -> str:  # => co-06: one address -> "private" or "public", checked against PRIVATE_RANGES only
    """Classify an IPv4 address as "private" (RFC 1918) or "public" (everything else)."""  # => co-06: documents classify's contract -- no runtime output, just sets its __doc__
    ip = ipaddress.IPv4Address(address)  # => co-06: parses and validates the address via the stdlib's own IPv4 parser
    is_private = any(ip in network for network in PRIVATE_RANGES)  # => co-06: `in` on an IPv4Network checks CIDR containment directly
    return "private" if is_private else "public"  # => co-06: RFC 1918 membership is the ENTIRE classification rule here


if __name__ == "__main__":  # => co-06: entry point -- this block runs only when the file executes directly, not on import
    addresses_with_expected = [  # => co-06: a mixed list -- one address per PRIVATE_RANGES block, plus known public addresses
        (str(ipaddress.IPv4Network("10.5.0.0/16")[1]), "private"),  # => co-06: offset 1 of 10.5.0.0/16 -- inside 10.0.0.0/8
        (str(ipaddress.IPv4Network("172.20.3.0/24")[4]), "private"),  # => co-06: offset 4 of 172.20.3.0/24 -- inside 172.16.0.0/12, NOT the same as the broader 172.0.0.0/8
        (str(ipaddress.IPv4Network("192.168.1.0/24")[10]), "private"),  # => co-06: offset 10 of 192.168.1.0/24 -- inside 192.168.0.0/16, the same .10 host number as Example 5's test address
        ("8.8.8.8", "public"),  # => co-06: Google Public DNS -- a well-known real public address
        ("172.66.147.243", "public"),  # => co-06: example.com's own resolved address (networking-essentials topic) -- public
        ("172.32.0.1", "public"),  # => co-06: DELIBERATELY just outside 172.16.0.0/12's upper edge (172.16-172.31) -- a boundary check
    ]  # => co-06: closes the multi-line construct opened above
    print("address -> classification:")  # => co-06: labels the following per-address printout
    for address, expected in addresses_with_expected:  # => co-06: one classification per address, checked against the expected label
        result = classify(address)  # => co-06: runs the classifier under test
        print(f"  {address:<16} -> {result}")  # => co-06: left-aligned address next to its classification
        assert result == expected, f"{address} must classify as {expected!r}, got {result!r}"  # => co-06: the exact-match check
    print(f"All {len(addresses_with_expected)} addresses match their expected classification: True")  # => co-06: every assert passed
    # => co-06: this file is self-verifying: if it exits 0, every assert above passed and the demonstrated claim held

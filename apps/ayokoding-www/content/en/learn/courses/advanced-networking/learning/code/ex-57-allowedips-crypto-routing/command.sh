#!/bin/sh
# ex-57: peer2's own AllowedIPs = 10.x.0.1/32 -- ONLY traffic to that one
# address is permitted to use the tunnel; anything else genuinely fails at
# the KERNEL level, not just "no route found" (co-26, co-25)
ip route            # peer2's OS routing table -- shows the crypto-routing entry wg-quick installed
ping -c 2 10.x.0.99 # an address NEVER listed in any peer's AllowedIPs
ping -c 2 10.x.0.1  # peer1's address -- IS in AllowedIPs

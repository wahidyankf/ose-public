#!/bin/sh
# ex-56: wg genkey generates a Curve25519 private key -- pure userspace
# arithmetic, no kernel module or root needed. wg pubkey derives the matching
# public key from a private key piped into it. wg-quick up reads a config
# file's [Interface]/[Peer] sections and creates the real kernel interface;
# ping proves the encrypted tunnel is actually passing traffic (co-26)
wg genkey                              # peer1's private key
echo "<peer1-private-key>" | wg pubkey # peer1's public key, derived from it

cat /etc/wireguard/wg0.conf # peer1's config
# [Interface]
# PrivateKey = <peer1-private-key>
# Address = 10.x.0.1/24
# ListenPort = 51820
#
# [Peer]
# PublicKey = <peer2-public-key>
# Endpoint = <peer2-container-ip>:51820
# AllowedIPs = 10.x.0.2/32
# PersistentKeepalive = 25

wg-quick up wg0
ping -c 3 10.x.0.1 # run FROM peer2, toward peer1's tunnel address
wg show            # confirms a real handshake and byte counters

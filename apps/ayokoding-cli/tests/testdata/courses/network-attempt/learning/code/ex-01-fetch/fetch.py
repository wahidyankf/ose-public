"""Fetch a web address the isolated network never reaches (fixture)."""

import urllib.request

with urllib.request.urlopen("https://example.com", timeout=5) as response:
    print(response.read().decode())

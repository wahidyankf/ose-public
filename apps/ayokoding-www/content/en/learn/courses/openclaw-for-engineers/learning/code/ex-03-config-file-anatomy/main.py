# => The five sections of openclaw.json, as nested dicts.
# => Values are placeholders; structure is what matters here.
config = {}  # => config starts empty and gains one section at a time
config["agents"] = {"defaults": {"model": "primary"}}  # => which model each agent uses unless overridden
# => agents is the first of five sections
config["channels"] = {"telegram": "paired", "slack": "off"}  # => messaging surfaces and their pairing state
# => two channels show the on/off pattern
config["tools"] = {"exec": "allow", "browser": "ask"}  # => per-tool default policy: allow or ask
# => tools section holds two sample entries
config["models"] = {"primary": "anthropic/claude", "fallbacks": []}  # => provider routing with an empty fallback list
# => models section mirrors the agents default
config["security"] = {"sandbox": True, "audit": True}  # => gateway-wide safety switches live here
# => security is the fifth and last section
print("sections: %d" % len(config))  # => Output: sections: 5
for section in sorted(config):  # => sorted() prints sections in a stable order
    print("section: " + section)  # => Output: section: agents, channels, models, security, tools
print("model: " + config["agents"]["defaults"]["model"])  # => nested lookup reaches the default model
# => Output: model: primary
print("sandbox: " + str(config["security"]["sandbox"]))  # => Output: sandbox: True

"""Example 62: Package the Deployment."""

from dataclasses import asdict, dataclass  # => stdlib only -- packaging a manifest needs no framework


@dataclass
class DeploymentManifest:  # => co-24: the served artefact is weights + runtime + config, versioned as ONE unit
    model_id: str  # => which model -- half of "what's actually running in production"
    model_revision: str  # => co-24: pins the EXACT weight snapshot, not just a model family name
    framework_version_pin: str  # => placeholder -- the deployer must pin the real framework version at deploy time
    gpu_type: str  # => placeholder -- the deployer must pin the real hardware at deploy time
    replica_count: int  # => co-24: how many copies of this EXACT artefact are currently serving traffic
    max_batch_slots: int  # => co-24: a serving-time knob, versioned alongside the weights it runs against


manifest = DeploymentManifest(
    model_id="example-org/example-7b",  # => illustrative model ID -- co-24: every field is versioned together
    model_revision="a1b2c3d",  # => a specific, reproducible weight snapshot -- not "latest"
    framework_version_pin="PLACEHOLDER-pin-at-deploy-time",  # => co-24: pin the REAL version at actual deploy time
    gpu_type="PLACEHOLDER-pin-at-deploy-time",  # => co-24: pin the REAL hardware at actual deploy time
    replica_count=3,  # => an illustrative fleet size for this worked example
    max_batch_slots=64,  # => an illustrative batching cap for this worked example
)
print(asdict(manifest))
# => Output: {'model_id': 'example-org/example-7b', 'model_revision': 'a1b2c3d',
# => Output: 'framework_version_pin': 'PLACEHOLDER-pin-at-deploy-time', 'gpu_type': 'PLACEHOLDER-pin-at-deploy-time',
# => Output: 'replica_count': 3, 'max_batch_slots': 64}
# => co-24: every field a rollback needs to reconstruct EXACTLY what was running, in one dict

assert manifest.replica_count == 3  # => the manifest round-trips through asdict() without losing any field
# => co-24: this ONE dict is what an incident responder needs first when a served model misbehaves
assert "PLACEHOLDER" in manifest.framework_version_pin  # => co-24: volatile fields stay PLACEHOLDER, never hard-guessed
print("ex-62 OK")  # => a self-check marker confirming the manifest holds every field a real deploy needs

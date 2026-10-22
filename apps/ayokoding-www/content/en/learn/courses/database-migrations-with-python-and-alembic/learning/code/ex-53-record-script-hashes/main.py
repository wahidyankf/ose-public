"""Example 53: hash every revision file to catch silent edits."""

import hashlib  # => hashlib fingerprints revision files, catching silent edits
import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from sqlalchemy import create_engine, text  # => engine keeps the hash manifest

# => The database URL comes from the harness, with local-run defaults.
host = os.environ.get("PGHOST", "postgres")  # => service hostname in the unit network
user = os.environ.get("PGUSER", "postgres")  # => trust-auth role, no password needed
database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => fresh database for every unit run
url = f"postgresql+psycopg://{user}@{host}/{database}"  # => psycopg 3 driver URL scheme

# => Two fixed revision files stand in for an applied history.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex53-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(scratch, "versions")  # => the files under tamper watch
os.makedirs(versions)  # => create the versions directory on disk
rev1 = '''"""create ex53 widgets."""

revision = "ex53a1"  # => first revision, no parent yet
down_revision = None  # => no parent: this is where this history starts
'''
rev2 = '''"""add ex53 widget price."""

revision = "ex53a2"  # => second revision, runs after ex53a1
down_revision = "ex53a1"  # => the parent link that orders the chain
'''
files = {  # => revision id to filename: the manifest watches both files
    "ex53a1": os.path.join(
        versions, "ex53a1_create_widgets.py"
    ),  # => first file under watch
    "ex53a2": os.path.join(
        versions, "ex53a2_add_price.py"
    ),  # => second file under watch
}
with open(files["ex53a1"], "w") as handle:  # => write the first watched file
    handle.write(rev1)  # => fixed content: its hash is the trust anchor
with open(files["ex53a2"], "w") as handle:  # => write the second watched file
    handle.write(rev2)  # => fixed content: its hash is the trust anchor
# => two anchors recorded: any byte change in either file breaks the match
print("manifest:", len(files), "files")  # => Output: manifest: 2 files

# => Record every file's hash in a manifest table only writers can change.
# => one engine serves the manifest table and every verification check
engine = create_engine(url)  # => one engine for the manifest and the checks
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex53_manifest")
    )  # => leftovers of a killed run vanish
    # => revision id plus hash: the trust anchors for every applied file
    connection.execute(
        text(
            "CREATE TABLE ex53_manifest (revision_id VARCHAR(32) PRIMARY KEY, sha256 CHAR(64) NOT NULL)"
        )
    )
    for revision_id, path in sorted(
        files.items()
    ):  # => sorted ids keep reruns byte-identical
        with open(path, "rb") as handle:  # => binary read: hashes cover exact bytes
            digest = hashlib.sha256(
                handle.read()
            ).hexdigest()  # => the fingerprint of record
        connection.execute(  # => one manifest row per watched file
            text(
                "INSERT INTO ex53_manifest (revision_id, sha256) VALUES (:rev, :digest)"
            ),
            {
                "rev": revision_id,
                "digest": digest,
            },  # => bound parameters: no string interpolation
        )


def verify():
    """Compare every watched file against its manifest hash."""
    with engine.connect() as connection:  # => fresh connection reads files and manifest
        rows = connection.execute(  # => every recorded fingerprint, id ordered
            # => ORDER BY keeps reruns byte-identical even as rows accumulate
            text("SELECT revision_id, sha256 FROM ex53_manifest ORDER BY revision_id")
        ).fetchall()  # => materialize every row before checking
    for revision_id, recorded in rows:  # => one comparison per watched file
        with open(
            files[revision_id], "rb"
        ) as handle:  # => binary read: exact bytes again
            if (
                hashlib.sha256(handle.read()).hexdigest() != recorded
            ):  # => any byte differs, trust breaks
                return False  # => first mismatch fails the whole verification
    return True  # => every file matches: history is exactly what shipped


# => unedited files match their anchors: trust holds before the edit
print("verify clean:", verify())  # => Output: verify clean: True
# => one appended comment: invisible to history, fatal to the hash
with open(files["ex53a2"], "a") as handle:  # => the silent edit: an appended comment
    handle.write(
        "\n# sneaky edit: a hand tweak with no review\n"
    )  # => invisible to git-style history, visible here
# => the manifest catches what code review missed: one byte changed everything
print("verify after edit:", verify())  # => Output: verify after edit: False
with engine.begin() as connection:  # => cleanup runs in a single transaction
    # => the manifest goes: trust anchors live only as long as the run
    connection.execute(
        text("DROP TABLE ex53_manifest")
    )  # => the example leaves no tables behind
print("cleaned: yes")  # => Output: cleaned: yes

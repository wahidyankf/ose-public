"""Example 56: a merge file names every parent it joins."""

import os  # => os builds the versions path, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic.config import Config  # => Config locates the script directory
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory reads files without a database

# => A scratch script location: revisions only, no database touched here.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex56-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic discovers revisions in this folder
os.makedirs(versions)  # => create the versions directory on disk

# => Two branches plus the merge that joins them: four files, one tip.
links = [  # => each tuple is one link: id, parent, and short action label
    ("ex56a1", None, "widgets"),  # => root link: the shared base both devs built on
    ("ex56b1", "ex56a1", "price"),  # => dev B's link: adds price_cents
    ("ex56c1", "ex56a1", "status"),  # => dev C's link: adds status, same parent
]
for revision_id, parent, action in links:  # => one file per branch link
    parent_line = (
        f'"{parent}"' if parent else "None"
    )  # => root links point at None, others at ids
    body = f'''"""ex56 {action}."""

revision = "{revision_id}"  # => this link's permanent identity in history
down_revision = {parent_line}  # => the parent link that orders the chain


def upgrade():  # => the forward change, run by upgrade
    # => every op call below joins the migration transaction
    pass


def downgrade():  # => the reverse change, run by downgrade
    # => downgrade mirrors upgrade in reverse order
    pass
'''
    with open(
        os.path.join(versions, f"{revision_id}_{action}.py"), "w"
    ) as handle:  # => filename starts with the id
        handle.write(body)  # => the link file now exists for Alembic to read

# => The merge names both parents: a tuple down_revision joins the branches.
merge = '''"""merge ex56 branches."""

revision = "ex56m1"  # => the merge link: one child of two parents
down_revision = ("ex56b1", "ex56c1")  # => both branch tips, sorted for stability


def upgrade():  # => forward: merges carry no DDL of their own
    # => empty upgrade: the branches already hold every change
    pass


def downgrade():  # => reverse: split back into two heads
    # => empty downgrade: splitting restores the branch tips exactly
    pass
'''
with open(
    os.path.join(versions, "ex56m1_merge.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(merge)  # => the merge file joins the two branches on disk

# => Read the merge back and name every parent it joined.
config = Config()  # => bare Config: no alembic.ini needed for inspection
config.set_main_option("script_location", scratch)  # => versions/ lives here
script = ScriptDirectory.from_config(config)  # => parses every revision file found
found = script.get_revision("ex56m1")  # => look up the merge by its fixed id
print("revision:", found.revision)  # => Output: revision: ex56m1
parents = found.down_revision  # => a tuple here: merges have several parents
if isinstance(parents, str):  # => single parents arrive as plain strings
    parents = (parents,)  # => normalize: always work with a tuple below
# => sorted parents keep reruns byte-identical whatever order the file used
print("parents:", ", ".join(sorted(parents)))  # => Output: parents: ex56b1, ex56c1
print("is branchpoint:", found.is_branch_point)  # => Output: is branchpoint: False
print("is mergepoint:", found.is_merge_point)  # => Output: is mergepoint: True

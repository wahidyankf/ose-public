"""Example 55: a merge revision joins two heads into one."""

import os  # => os builds the versions path, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic.config import Config  # => Config locates the script directory
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory reads files without a database

# => A scratch script location: revisions only, no database touched here.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex55-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic discovers revisions in this folder
os.makedirs(versions)  # => create the versions directory on disk

# => Two branches off one root: the conflicted state, measured first.
links = [  # => each tuple is one link: id, parent, and short action label
    ("ex55a1", None, "widgets"),  # => root link: the shared base both devs built on
    ("ex55b1", "ex55a1", "price"),  # => dev B's link: adds price_cents
    ("ex55c1", "ex55a1", "status"),  # => dev C's link: adds status, same parent
]
for revision_id, parent, action in links:  # => one file per branch link
    parent_line = (
        f'"{parent}"' if parent else "None"
    )  # => root links point at None, others at ids
    body = f'''"""ex55 {action}."""

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

config = Config()  # => bare Config: no alembic.ini needed for inspection
config.set_main_option(
    "script_location", scratch
)  # => versions/ lives here for both reads
before = sorted(
    ScriptDirectory.from_config(config).get_heads()
)  # => two tips: the conflicted state
# => two tips on one history means one unmerged branch: merge before deploying
print("before:", ", ".join(before))  # => Output: before: ex55b1, ex55c1

# => The merge names both parents: a tuple down_revision joins the branches.
merge = '''"""merge ex55 branches."""

revision = "ex55m1"  # => the merge link: one child of two parents
down_revision = ("ex55b1", "ex55c1")  # => both branch tips, sorted for stability


def upgrade():  # => forward: merges carry no DDL of their own
    # => empty upgrade: the branches already hold every change
    pass


def downgrade():  # => reverse: split back into two heads
    # => empty downgrade: splitting restores the branch tips exactly
    pass
'''
with open(
    os.path.join(versions, "ex55m1_merge.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(merge)  # => the merge file joins the two branches on disk

after = sorted(
    ScriptDirectory.from_config(config).get_heads()
)  # => re-parse: the merge is the only tip now
# => one tip means one line again: the branches merged without rewriting
print("after:", ", ".join(after))  # => Output: after: ex55m1

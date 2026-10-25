"""Example 57: rebase a branch onto the new tip instead of merging."""

import os  # => os builds the versions path, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic.config import Config  # => Config locates the script directory
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory reads files without a database

# => A scratch script location: revisions only, no database touched here.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex57-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic discovers revisions in this folder
os.makedirs(versions)  # => create the versions directory on disk

# => Root, two same-parent branches: the conflicted state, measured first.
links = [  # => each tuple is one link: id, parent, and short action label
    ("ex57a1", None, "widgets"),  # => root link: the shared base both devs built on
    ("ex57b1", "ex57a1", "price"),  # => our link: branched before the tip moved
    ("ex57c1", "ex57a1", "status"),  # => their link: landed first, the new tip
]
for (
    revision_id,
    parent,
    action,
) in links:  # => one file per link, written in chain order
    parent_line = (
        f'"{parent}"' if parent else "None"
    )  # => root links point at None, others at ids
    body = f'''"""ex57 {action}."""

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
)  # => versions/ lives here for every read
heads = lambda: sorted(
    ScriptDirectory.from_config(config).get_heads()
)  # => fresh parse on every call
print("before:", ", ".join(heads()))  # => Output: before: ex57b1, ex57c1

# => Rebase: point our branch at their tip by rewriting one parent link.
branch_path = os.path.join(
    versions, "ex57b1_price.py"
)  # => our branch file, found by its fixed name
with open(branch_path) as handle:  # => read the file we wrote above
    branch_text = handle.read()  # => full text, edited in memory below
branch_text = branch_text.replace(  # => the rebase itself: one parent link changes
    'down_revision = "ex57a1"',
    'down_revision = "ex57c1"\n    # => rebased: our change now lands on their tip',  # => new size beats stale bytecode
)
with open(branch_path, "w") as handle:  # => same filename: history rewrites this link
    handle.write(branch_text)  # => the branch now descends from the landed tip
# => one tip left: the branch now descends from the landed tip
print("after:", ", ".join(heads()))  # => Output: after: ex57b1
print("linear:", len(heads()) == 1)  # => Output: linear: True

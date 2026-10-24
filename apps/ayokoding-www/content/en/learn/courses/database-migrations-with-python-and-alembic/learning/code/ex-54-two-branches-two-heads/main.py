"""Example 54: two branches off one parent mean two heads."""

import os  # => os builds the versions path, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic.config import Config  # => Config locates the script directory
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory reads files without a database

# => A scratch script location: revisions only, no database touched here.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex54-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic discovers revisions in this folder
os.makedirs(versions)  # => create the versions directory on disk

# => One root, two children with the same parent: the classic branch shape.
chain = [  # => each tuple is one link: id, parent, and short action label
    ("ex54a1", None, "widgets"),  # => root link: the shared base both devs built on
    ("ex54b1", "ex54a1", "price"),  # => dev B's link: adds price_cents
    ("ex54c1", "ex54a1", "status"),  # => dev C's link: adds status, same parent
]
for (
    revision_id,
    parent,
    action,
) in chain:  # => one file per link, written in chain order
    parent_line = (
        f'"{parent}"' if parent else "None"
    )  # => root links point at None, others at ids
    body = f'''"""ex54 {action}."""

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

# => Two children of one parent means two tips: the branch count is heads minus one.
config = Config()  # => bare Config: no alembic.ini needed for inspection
config.set_main_option("script_location", scratch)  # => versions/ lives here
script = ScriptDirectory.from_config(config)  # => parses every revision file found
tips = sorted(script.get_heads())  # => heads are revisions no child points at
print("heads:", ", ".join(tips))  # => Output: heads: ex54b1, ex54c1
# => two tips on one history means one unmerged branch: merge before deploying
print("branches:", len(tips) - 1)  # => Output: branches: 1

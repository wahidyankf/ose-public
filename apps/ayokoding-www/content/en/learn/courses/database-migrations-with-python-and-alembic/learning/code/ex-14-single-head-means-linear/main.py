"""Example 14: one head means the team shares a single line."""

import os  # => os builds the versions path, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic.config import Config  # => Config locates the script directory
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory reads files without a database

# => A scratch script location: revisions only, no database touched here.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex14-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic discovers revisions in this folder
os.makedirs(versions)  # => create the versions directory on disk

# => Three chained revisions: one line from root to tip, so exactly one head.
chain = [  # => each tuple is one link: id, parent, and short action label
    ("ex14a1", None, "widgets"),  # => root link: creates ex14_widgets
    ("ex14a2", "ex14a1", "price"),  # => middle link: adds price_cents
    ("ex14a3", "ex14a2", "status"),  # => tip link: adds status
]
for (
    revision_id,
    parent,
    action,
) in chain:  # => one file per link, written in chain order
    parent_line = (
        f'"{parent}"' if parent else "None"
    )  # => root links point at None, others at ids
    body = f'''"""ex14 {action}."""

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

# => Count the heads: a single linear history has exactly one.
config = Config()  # => bare Config: no alembic.ini needed for inspection
config.set_main_option("script_location", scratch)  # => versions/ lives here
script = ScriptDirectory.from_config(config)  # => parses every revision file found
tips = script.get_heads()  # => heads are revisions no child points at
print("heads:", ", ".join(sorted(tips)))  # => Output: heads: ex14a3
print("linear:", len(tips) == 1)  # => Output: linear: True
base = script.get_base()  # => the one revision with no parent
print("base:", base)  # => Output: base: ex14a1

"""Example 9: three revisions form one ordered chain."""

import os  # => os builds the versions path, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic.config import Config  # => Config locates the script directory
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory reads files without a database

# => A scratch script location: revisions only, no database touched here.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex09-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic discovers revisions in this folder
os.makedirs(versions)  # => create the versions directory on disk

# => Three chained revisions: table, price column, status column.
chain = [  # => each tuple is one link: id, parent, and table action
    ("ex09a1", None, "widgets"),  # => root link: creates ex09_widgets
    ("ex09a2", "ex09a1", "price"),  # => middle link: adds price_cents
    ("ex09a3", "ex09a2", "status"),  # => tip link: adds status
]
for (
    revision_id,
    parent,
    action,
) in chain:  # => one file per link, written in chain order
    parent_line = (
        f'"{parent}"' if parent else "None"
    )  # => root links point at None, others at ids
    body = f'''"""ex09 {action}."""

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

# => Walk the chain through Alembic and print every parent link.
config = Config()  # => bare Config: no alembic.ini needed for inspection
config.set_main_option("script_location", scratch)  # => versions/ lives here
script = ScriptDirectory.from_config(config)  # => parses every revision file found
links = sorted(  # => sort by child id: fixed ids make the order stable
    (
        (
            found.down_revision or "root",
            found.revision,
        )  # => each pair is one chain link
        for found in script.walk_revisions()
    ),  # => walk_revisions yields every file parsed
    key=lambda pair: pair[1],  # => child id order reproduces the chain from root
)
for parent, revision_id in links:  # => one printed line per chain link
    # => the printed chain is the deployment order: upgrade follows it exactly
    print(
        f"{parent} -> {revision_id}"
    )  # => Output: root -> ex09a1, then ex09a1 -> ex09a2, ...

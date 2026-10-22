"""Example 2: a revision file carries its identity, parent, and docstring."""

import os  # => os builds the versions path, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic.config import Config  # => Config locates the script directory
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory reads files without a database

# => A scratch script location: revisions only, no database touched here.
scratch = tempfile.mkdtemp(
    prefix="ex02-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic discovers revisions in this folder
os.makedirs(versions)  # => create the versions directory on disk

# => Revision ex02a1: a gadget table. Three fields carry the whole contract.
revision = '''"""create ex02 gadgets."""

revision = "ex02a1"  # => this revision's permanent identity in history
down_revision = None  # => no parent: the root of this history


def upgrade():  # => the forward change, run by upgrade
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins the migration transaction
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex02_gadgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("label", sa.String(80)),  # => optional human-readable label
    )


def downgrade():  # => the reverse change, run by downgrade
    from alembic import op  # => same op object, opposite direction

    op.drop_table("ex02_gadgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex02a1_create_gadgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(revision)  # => the file above now exists for Alembic to read

# => Read the file back through Alembic: no database connection needed.
config = Config()  # => bare Config: no alembic.ini needed for inspection
config.set_main_option("script_location", scratch)  # => versions/ lives here
script = ScriptDirectory.from_config(config)  # => parses every revision file found
found = script.get_revision("ex02a1")  # => look up one revision by its fixed id
print("revision:", found.revision)  # => Output: revision: ex02a1
print("down_revision:", found.down_revision)  # => Output: down_revision: None
print("doc:", found.doc)  # => Output: doc: create ex02 gadgets.
print("module:", found.module.__name__)  # => Output: module: ex02a1_create_gadgets_py
print(
    "path ends with:", os.path.basename(found.path)
)  # => Output: path ends with: ex02a1_create_gadgets.py

"""Count rows through the shared postgres service (fixture)."""

import os

import psycopg

host = os.environ.get("PGHOST", "postgres")
database = os.environ.get("PGDATABASE", "postgres")
with psycopg.connect(host=host, dbname=database) as connection:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        row = cursor.fetchone()
print("one row" if row == (1,) else "unexpected")

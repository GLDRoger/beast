---
name: data-work
description: Change or query data safely: schema changes and migrations, SQL and analytics questions, backfills, and one-off data fixes in development or production. Use when work reads or writes a database or a dataset rather than only code.
---

# Data work

Data mistakes are the hardest to undo, so reversibility sets the pace.

## Before writing

- Find out which database and environment you're pointed at. Say it in your update. Production is not development.
- Read the schema, constraints, indexes and the code that reads and writes the tables involved.
- Count first: run the `SELECT` version of any `UPDATE` or `DELETE` and check the row count matches what you expect.
- For production writes, have a way back before running: a backup or snapshot, a reversible migration, or a saved copy of the rows you'll change.

## Migrations

- Use the project's migration tool and conventions; never hand-edit a production schema.
- Make changes additive and backward compatible while old code still runs: add, backfill, switch reads, then remove in a later step.
- Large tables: batch backfills, avoid long locks, and check the migration's lock behaviour for your database.
- Run it against a copy or local database first, and run the down migration too.

## Queries and answers

- Answering a data question: show the query with the number, state the time range and filters, and sanity-check against a known total.
- Watch for duplicates from joins, nulls in aggregates, and timezone boundaries.
- Keep heavy analytics queries off the primary in production; use a replica or an export when one exists.

## After

- Verify with a read after the write: counts, a sample of changed rows, and the application path that uses them.
- Report what changed, how many rows, and how to roll it back.

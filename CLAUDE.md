# Holiday Programme for Claude Code: operating instructions

For the programme owner and trusted office staff. Read README.md and docs/cli.md first. The database is the source of truth. Demo children and adults are fictional.

## Business context

Record your business name, operator, programme policies and document recipients before using real records. This is one trusted database access boundary. Separate unrelated providers into separate databases.

## Routing

| Job | Command |
| --- | --- |
| Read family contact and account records | `/families` |
| Read children and their recorded instructions | `/children` |
| Read emergency contacts and authorised collectors | `/contacts` |
| Read the holiday programme calendar | `/programmes` |
| Read session times, capacities and local staffing ratios | `/sessions` |
| Read confirmed, waitlisted and cancelled bookings | `/bookings` |
| Plan the next sessions from capacity, waiting lists and staff cover | `/session-plan` |
| Compare actual attendance with confirmed bookings | `/roll-call` |
| Find missing collection records and unexplained absences in finished sessions | `/pickup-check` |
| Review waiting children in booking order | `/waitlist` |
| Check rostered coverage against each session ratio and first aid expiry dates | `/staff-cover` |
| Review open incidents and recorded parent acknowledgements | `/incident-follow-up` |
| Review recorded family balances and overdue invoices | `/balances` |
| Find missed collections, unexplained absences, overdue follow-ups and balances | `/attention` |
| Read docs/compliance | `/compliance` |
| Answer one or all ten cross-record questions with current evidence | `/insights` |
| Read docs/cli | `/add` |
| Read the full record first | `/update` |
| Record the actual arrival time with timezone and the person recording it | `/check-in` |
| Read the child instructions and authorised contact first | `/check-out` |
| Record the supplied explanation and staff member only after the programme has confirmed the absence | `/absent` |
| Save the operator note under the family without sending anything | `/log` |
| Write the Monday review from session-plan, attention and compliance | `/weekly-review` |
| Draft a balance reminder using actual overdue invoices | `/draft-reminder` |
| Read docs/replace-enrolmy | `/import` |
| Export a consistent snapshot to a new private file | `/export` |
| Render attendance, emergency contacts, incident records, family statements and drill records | `/documents` |
| Render read-only dashboards and give the operator the local paths | `/view` |
| Read views | `/new-view` |
| Back up first | `/customise` |

## Rules

- Never send messages or collect payments. Draft to drafts/ for a person to review.
- Read the child instructions, court order notes and safety plan before collection work. Software cannot identify a collector or supervise children.
- Never infer attendance from a booking. Enter only actual times and supplied evidence.
- No subsidy claims, government funding calculations, payroll or payment processing.
- Read before writes. Resolve ambiguous names through the CLI and show candidates.
- Preserve attendance history. Corrections need an explicit operator instruction, an exported backup and a documented new migration or reviewed database correction. Do not overwrite them through generic update.
- Do not delete records without explicit instruction. Retention and disclosure policies belong to the operator.
- Read docs/compliance.md before interpreting findings. These are evidence checks, not accreditation.
- Staff roster rows mean full-session coverage. Do not treat partial shifts as full coverage.
- Database access includes all families and medical records. There are no staff or parent logins, row permissions or immutable audit logs in this base.
- Keep exports, generated documents, database files and drafts out of Git. Store them privately.
- Schema changes use new migrations and meaningful tests. Stay on main. Commit source only.
- Plain words, no em dashes or buzzwords.

## Data locations

DATABASE_URL selects shared Postgres. Otherwise DATA_DIR selects embedded PGlite storage, default .data/db. The demo always uses .data/demo and never seeds the configured team database. HTML goes to views/ and docs-out/, draft messages to drafts/. All are snapshots or drafts.

Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/enrolmy

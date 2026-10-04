# Holiday Programme for Claude Code

Know who is booked, who arrived, who collected them and what needs attention.
Built by [Enterprise DNA](https://enterprisedna.co).

| Do it yourself | We customise it | We run it for you |
| --- | --- | --- |
| Free under the MIT licence. Install the database and commands. | Your enrolment fields, programme rules, document layouts and Enrolmy export mapping. A web front end or another stack when needed. | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=github&utm_campaign=enrolmy) | [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=github&utm_campaign=enrolmy) |

Works with Claude Code, Codex, OpenCode or Cursor. Read [AGENTS.md](AGENTS.md).

## What is here

Thirteen record types hold families, children, contacts, programmes, sessions, bookings, attendance, staff, rosters, incidents, invoices, drills and notes. Three database views feed the programme plan, daily roll and family balances. Ten analysis questions join those records. Five document types produce attendance registers, emergency lists, incident records, family statements and drill records in your brand.

The office operator plans sessions, checks staff coverage, manages a waitlist, enters actual attendance, records authorised collection, reviews incidents and prepares balance reminders. Nothing sends, collects money or claims government funding. A trusted operator can use the base alongside the programme's physical attendance and emergency procedures.

Children's details and medical instructions belong in a private database with appropriate operator access. This base grants its operator access to the whole database. It has no parent portal, staff logins, immutable audit trail, offline kiosk or electronic signature service. Enterprise DNA scopes those additions with you. Static reports are confidential snapshots.

## Quick start

Node 20 or later, Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/holiday-programme-for-claude-code.git
cd holiday-programme-for-claude-code
npm install
npm test
npm run demo
```

The demo creates fictional records in `.data/demo`, even if a team database is configured. It never seeds that team database. Demo dates are relative to the day the seed first runs. To explore it, put `DATA_DIR=.data/demo` in a local `.env` with no DATABASE_URL, or set the equivalent process environment. Repeated seed runs preserve existing rows.

```bash
npm run holiday -- session-plan
npm run holiday -- pickup-check
npm run holiday -- compliance --json
npm run holiday -- insights
npm run view
npm run docs
```

For real records, use a fresh DATA_DIR and `npm run migrate` without seed. For shared Postgres set DATABASE_URL in your environment or a gitignored .env. Remote TLS certificates are verified. Do not commit records or credentials. Back up the database and source archives before changes.

HTML goes to views/ and docs-out/. Use brand.json for your business name, colours and an absolute file or HTTPS logo URL. Documents are snapshots. Times in reports are UTC. Programme boundaries use Pacific/Auckland. Read [docs/cli.md](docs/cli.md) before writes.

## Recurring commands

| Command | Job |
| --- | --- |
| `/families` | Read family contact and account records. |
| `/children` | Read children and their recorded instructions. |
| `/contacts` | Read emergency contacts and authorised collectors. |
| `/programmes` | Read the holiday programme calendar. |
| `/sessions` | Read session times, capacities and local staffing ratios. |
| `/bookings` | Read confirmed, waitlisted and cancelled bookings. |
| `/session-plan` | Plan the next sessions from capacity, waiting lists and staff cover. |
| `/roll-call` | Compare actual attendance with confirmed bookings. Never infer presence from a booking. |
| `/pickup-check` | Find missing collection records and unexplained absences in finished sessions. Follow the programme procedures immediately when a child is unaccounted for. |
| `/waitlist` | Review waiting children in booking order. Promotion requires an operator instruction and available capacity. |
| `/staff-cover` | Check rostered coverage against each session ratio and first aid expiry dates. The roster assumes staff cover the entire session. |
| `/incident-follow-up` | Review open incidents and recorded parent acknowledgements. Never invent a notification or acknowledgement. |
| `/balances` | Review recorded family balances and overdue invoices. Do not collect payments. |
| `/attention` | Find missed collections, unexplained absences, overdue follow-ups and balances. |
| `/compliance` | Read docs/compliance.md, then report record gaps with their sources. These checks do not certify a programme. |
| `/insights` | Answer one or all ten cross-record questions with current evidence. |
| `/add` | Read docs/cli.md. Add only operator-supplied facts. Use the field dictionary and resolve references first. |
| `/update` | Read the full record first. Update only supplied facts. Attendance changes use the named attendance jobs. |
| `/check-in` | Record the actual arrival time with timezone and the person recording it. Do not default to booked times. |
| `/check-out` | Read the child instructions and authorised contact first. Confirm the actual collection with the operator. The command checks contact authorisation, not the identity of the person standing at the door. |
| `/absent` | Record the supplied explanation and staff member only after the programme has confirmed the absence. |
| `/log` | Save the operator note under the family without sending anything. |
| `/weekly-review` | Write the Monday review from session-plan, attention and compliance. Prioritise child record gaps before administrative work. |
| `/draft-reminder` | Draft a balance reminder using actual overdue invoices. Review family notes first. Never send. |
| `/import` | Read docs/replace-enrolmy.md. Inspect the exported headers and mapping, run the test import first, compare counts, then apply the reviewed import. |
| `/export` | Export a consistent snapshot to a new private file. It contains confidential child records. Do not commit or upload it. |
| `/documents` | Render attendance, emergency contacts, incident records, family statements and drill records. Share only with authorised staff. |
| `/view` | Render read-only dashboards and give the operator the local paths. These are snapshots. |
| `/new-view` | Read views.json and the database views. Add a read-only report for the requested question, render it and inspect the result. |
| `/customise` | Back up first. Translate the requested field or rule into a new migration and update the CLI, tests and command docs. Apply it and run the tests. Never modify an applied migration. |

## Ten questions across your records

Run `npm run holiday -- insights` or select a number. These are specific queries this build answers today, not an unsupported claim that Enrolmy can never produce a similar answer.

1. Which upcoming sessions have a waiting list and no spare places?
2. Which upcoming sessions need more rostered staff under our own ratio?
3. Which booked children have fewer than two contact people?
4. Which children have no authorised collection contact?
5. Which finished sessions still have children recorded on site?
6. Which expected arrivals in past sessions remain unexplained?
7. Which open incidents have no record that the parent was informed?
8. Which families owe money and also have future confirmed bookings?
9. Which upcoming sessions lack a rostered first aider with a current certificate?
10. Which confirmed children need their enrolment details reviewed before returning?

## Your first hour: ten things to ask for

1. Add our next holiday programme and venue.
2. Set our session dates, capacities and approved staffing ratios.
3. Add our staff and certificate review dates.
4. Map a small reviewed sample of our Enrolmy family export.
5. Review each child's contact and collection permissions.
6. Show tomorrow's staff cover and waiting list.
7. Print the emergency contacts for our next outing.
8. Find the incidents missing a parent acknowledgement.
9. Put our name and logo on the family statements.
10. Add the one enrolment field we keep in a separate spreadsheet.

Use `/customise` for fields and rules, and `/new-view` for a read-only report. Changes use new migrations and tests.

## Bringing Enrolmy records across

Enrolmy documents exports, but its public help does not promise one fixed full-record CSV layout. This build imports reviewed families, children, contacts, bookings and invoice CSVs through a column map. It requires stable identifiers. The examples are fictional mapping fixtures. A test run validates every row and rolls back. Repeated imports update matching external identifiers. Invalid later rows roll back the entire file.

```bash
node scripts/holiday.mjs import enrolmy --kind=families --file=examples/enrolmy/families.csv --dry-run
```

After review, remove `--dry-run` to apply it. Read [docs/replace-enrolmy.md](docs/replace-enrolmy.md) for sources, mappings and boundaries. Source attachments, signatures, historic attendance, payment mandates and subsidy claims do not transfer automatically. The one-command import follows export preparation, not a guaranteed whole-business switch in a day.

## Evidence checks, not accreditation

`/compliance` checks selected OSCAR record requirements and separately labelled local rules. Sources and limits are in [docs/compliance.md](docs/compliance.md). Bookings never become attendance automatically. Check-out requires a recorded collector authorised for that child. People still verify identity, staff presence and the child's safety. Staffing recommendations are not presented as universal legal ratios.

[Why no front end](docs/why-no-front-end.md) explains the office workflow and what a parent or front-desk service needs.

## Validation and ownership

`npm test` uses an isolated temporary database, ignoring your configured production database. It tests migrations, idempotent seeds, all reads and writes, invalid collection, capacity, imports, rollback, exports, drafts, documents and views. CI runs Node 20 and 22 on Windows and Linux, plus Postgres 16. Set HOLIDAY_TEST_POSTGRES_URL only for an explicitly disposable test service. The suite creates and removes its own schema there.

MIT licence. No Enrolmy affiliation. Hosting and coding-agent subscriptions are separate costs. Exported JSON is an open snapshot, not an automatic restore service. Test your recovery process before relying on it.

[Talk to Sam for 30 minutes](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=github&utm_campaign=enrolmy). Omni by Enterprise DNA builds and runs your version for a setup fee, then a retainer.

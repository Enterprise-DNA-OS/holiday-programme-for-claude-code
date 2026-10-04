# Command reference

Run `node scripts/holiday.mjs help`. Every command accepts `--json`. Flags use `--name=value`. Quote values containing spaces. Unknown flags and fields fail. Names match without case sensitivity, and partial ids work. Ambiguous matches list candidates and exit 1. Full ids are best for repeated imports.

## Reads and writes

Every record kind is a read command: families, children, contacts, programmes, sessions, bookings, attendance, staff, roster, incidents, invoices, drills and notes. `show <kind> <name-or-id>` returns one full record. `add <kind> --field=value` creates one. `update <kind> <id> --field=value` updates supplied fields. `null` explicitly clears nullable values. References ending in _id resolve the related record. All writes use transactions and database constraints.

Attendance only uses `check-in`, `check-out` and `absent`. Each requires `--by`. Check-in requires `--at`. Check-out requires `--at` and `--collector`. Absence requires `--reason`. Timestamps include timezone, such as `2026-10-03T15:30:00+13:00`. The stored timestamps and reports are UTC. Programme boundary checks use Pacific/Auckland. Never record future attendance. A checked-in booking cannot be cancelled. Corrections require explicit operator review and preserved history.

Session capacity blocks overbooking but not waitlisting. Roster entries mean the staff member covers the entire session. Ratios use confirmed bookings and active staff, not physical headcounts. Check staff presence before relying on any report. Generic records do not provide access controls or an immutable audit trail.

Money is integer cents. No payments are taken. paid_cents is the recorded cumulative amount and cannot exceed the total. Dates use YYYY-MM-DD. Booleans use true/false. Updates keep external_id unless explicitly changed. Keep imported identifiers stable.

```bash
node scripts/holiday.mjs add families --name="Example family" --email=family@example.test
node scripts/holiday.mjs add children --family_id="Example family" --name="Example child" --birth_date=2018-07-15
node scripts/holiday.mjs session-plan
node scripts/holiday.mjs insights 8 --json
node scripts/holiday.mjs log "Example family" "Parent confirmed contact details" --by="Programme manager"
node scripts/holiday.mjs weekly-review
node scripts/holiday.mjs export --out=/private/new-backup.json
```

See docs/replace-enrolmy.md for CSV import. Export writes a consistent JSON snapshot to a new file and refuses to overwrite. Restore is a separate reviewed procedure, not implemented as an automatic command. Keep source files and documents with your backups and test recovery.

## Field dictionary

Each record also has id, external_id, created_at and updated_at. Database defaults and constraints are in supabase/migrations/0001_holiday.sql. The CLI rejects fields outside this list:

- **families**: `name`, `email`, `phone`.
- **children**: `family_id`, `name`, `birth_date`, `medical_notes`, `medical_reviewed_on`, `self_medication`, `medication_instructions`, `medication_plan`, `court_order_notes`, `safety_plan`, `reviewed_on`.
- **contacts**: `child_id`, `name`, `phone`, `relationship`, `authorised_pickup`.
- **programmes**: `name`, `venue`, `starts_on`, `ends_on`, `status`.
- **sessions**: `programme_id`, `name`, `starts_at`, `ends_at`, `capacity`, `children_per_staff`, `offsite`, `risk_plan`, `status`.
- **bookings**: `child_id`, `session_id`, `status`, `consent_on`, `notes`.
- **attendance**: `booking_id`, `child_id`, `signed_in_at`, `signed_in_by`, `signed_out_at`, `collected_by_id`, `recorded_by`, `absence_reason`.
- **staff**: `name`, `first_aid_until`, `safety_check_due`, `active`.
- **roster**: `session_id`, `staff_id`.
- **incidents**: `booking_id`, `occurred_at`, `location`, `details`, `injury`, `treatment`, `staff_id`, `parent_informed_at`, `confirmation`, `follow_up_due`, `status`.
- **invoices**: `family_id`, `name`, `issued_on`, `due_on`, `total_cents`, `paid_cents`, `currency`, `status`.
- **drills**: `programme_id`, `occurred_at`, `name`, `notes`, `recorded_by`.
- **notes**: `family_id`, `name`, `body`, `recorded_by`.

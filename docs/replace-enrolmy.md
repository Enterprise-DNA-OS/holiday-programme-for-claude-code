# Moving records from Enrolmy

## Verified export route

Enrolmy says an outgoing owner can export the customer database in its [business ownership guide](https://helpcentre.enrolmy.com/entkb/business-ownership-change-what-happens-to-your-enr). Its [Age Breakdown report guide](https://helpcentre.enrolmy.com/entkb/age-breakdown-report) describes choosing filters and columns under Insights, then exporting CSV or Excel. Search-indexed copies were read on 4 October 2026. Direct requests to those help URLs returned 404 this run, so confirm the current export route inside your account or with Enrolmy support. The age report is a demographic report, not proof of a complete medical, contact or booking export.

The public help pages do not specify a stable full customer export header set. Obtain your own account's export through its available report tools or ask Enrolmy support for it. Preserve the original. The supplied examples are fictional mapping fixtures, not files represented as actual Enrolmy downloads.

## One import command after column review

The importer accepts UTF-8 CSV with a BOM, quoted commas and multiline fields. Save Excel exports as CSV first. Map your exported headers to the fields in docs/cli.md, using a small JSON object with destination fields as keys and exact source headers as values. No mapping is needed when headers already match the documented fields.

```bash
node scripts/holiday.mjs import enrolmy --kind=families --file=examples/enrolmy/families.csv --dry-run
node scripts/holiday.mjs import enrolmy --kind=families --file=examples/enrolmy/families.csv
node scripts/holiday.mjs import enrolmy --kind=children --file=examples/enrolmy/children.csv --map=examples/enrolmy/children-map.json --dry-run
node scripts/holiday.mjs import enrolmy --kind=children --file=examples/enrolmy/children.csv --map=examples/enrolmy/children-map.json
```

Import families, then children, then contacts. Create programmes and sessions before importing bookings. Import invoices last. Each file is one transaction. An invalid later row rolls the whole file back. Test imports roll back too. Stable external identifiers are required and repeated imports update the same records. Names are not safe identifiers for repeated imports. If the export lacks an identifier, create a reviewed stable mapping and preserve it with the original archive.

References such as family_id, child_id and session_id accept a unique database id, id prefix or case-insensitive name. Use full ids for repeated imports when names are shared. A map maps columns, not values. Convert dates to YYYY-MM-DD, amounts to integer cents and booleans to true/false in a reviewed working copy. Blank cells leave existing values unchanged. Explicit clearing uses update with null where the field permits it.

## What moves

Families: name and contact details. Children: family link, birth date, medical instructions, review dates and safety-plan references. Contacts: named child contacts and collection authorisation. Bookings: child, session, status and consent date. Invoices: reference, family, dates, recorded totals, payments and currency. The exported data must actually include each field before it can be mapped. Missing medical or contact evidence stays missing.

No automatic transfer of attachments, electronic signatures, photographs, parent logins, historic attendance events, card details, payment mandates, Xero connections or WINZ subsidy claims is included. Preserve historic originals separately. This build records invoice balances, not a payment service or tax accounting system. A historic attendance import needs a separately reviewed mapping and audit approach.

Compare record counts, sample siblings and shared surnames, confirm balances against the old system and print tomorrow's emergency list before switching. The import is one command after preparation. A complete business migration is not an unconditional one-day guarantee. Enterprise DNA maps your export, configures the missing workflows and agrees the cutover with you.

[Discuss your version with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=github&utm_campaign=enrolmy). Omni by Enterprise DNA.

---
description: "Read docs/replace-enrolmy.md. Inspect the exported headers and mapping, run the test import first, compare counts, then apply the reviewed import."
---

Read docs/replace-enrolmy.md. Inspect the exported headers and mapping, run the test import first, compare counts, then apply the reviewed import.

```bash
node scripts/holiday.mjs import enrolmy --kind=<kind> --file=<export.csv> --map=<columns.json> --dry-run
```

Read CLAUDE.md. Use current records, report missing facts, and never send messages. Command placeholders need real operator values.

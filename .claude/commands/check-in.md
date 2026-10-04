---
description: "Record the actual arrival time with timezone and the person recording it. Do not default to booked times."
---

Record the actual arrival time with timezone and the person recording it. Do not default to booked times.

```bash
node scripts/holiday.mjs check-in <booking-id> --at=<ISO-time-with-timezone> --by="<person>"
```

Read CLAUDE.md. Use current records, report missing facts, and never send messages. Command placeholders need real operator values.

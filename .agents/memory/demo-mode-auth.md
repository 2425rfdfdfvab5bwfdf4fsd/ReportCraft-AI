---
name: Demo mode auth race condition
description: Using upsert instead of find+create prevents P2002 unique constraint errors when concurrent requests hit the demo agency creation path
---

When no CLERK_SECRET_KEY is set, the auth middleware creates a demo agency. Under concurrent requests, findUnique returns null for both, then both try create → P2002 unique constraint error.

**Fix:** Use `prisma.agency.upsert({ where: { clerkUserId }, create: {...}, update: {} })` — atomic and idempotent.

**Why:** Prisma upsert is a single atomic operation. find+create is two operations with a TOCTOU gap.

**How to apply:** Any "get or create" pattern in middleware that may receive concurrent requests should use upsert.

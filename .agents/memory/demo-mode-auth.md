---
name: Demo mode auth race condition fix
description: find-first + create + P2002 catch is the correct pattern; upsert alone is not atomic enough under concurrent requests
---

When no CLERK_SECRET_KEY is set, the auth middleware creates a demo agency. Under concurrent requests, upsert can still hit P2002 due to Postgres isolation levels.

**Fix (current, working):** Use `findUnique` first, then `create` with a P2002 catch that falls back to `findUniqueOrThrow`:

```ts
const existing = await prisma.agency.findUnique({ where: { clerkUserId: DEMO_CLERK_USER_ID } });
if (existing) return existing;
try {
  return await prisma.agency.create({ data: { ... } });
} catch (e: any) {
  if (e.code === 'P2002') {
    return prisma.agency.findUniqueOrThrow({ where: { clerkUserId: DEMO_CLERK_USER_ID } });
  }
  throw e;
}
```

**Why:** Prisma upsert is NOT fully atomic on Neon serverless Postgres — concurrent requests arriving before the first write commits can both fail with P2002. The find-first pattern short-circuits on the hot path (agency already exists) and handles the cold-start race in the catch.

**How to apply:** Any "get or create" pattern in middleware should use this three-step approach, not bare upsert.

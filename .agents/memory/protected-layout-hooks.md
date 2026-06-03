---
name: ProtectedLayout Clerk hooks rule
description: useAuth from @clerk/clerk-react cannot be called conditionally — must be isolated in a child component that only renders when Clerk is configured
---

React's rules of hooks forbid conditional hook calls. When VITE_CLERK_PUBLISHABLE_KEY is absent (demo mode), importing and calling useAuth at the top level of ProtectedLayout causes a runtime error or invalid hook call.

**Fix:** Create a separate `ClerkGuard` component that calls useAuth unconditionally inside it. ProtectedLayout renders either `<AppShell>` (demo) or `<ClerkGuard>` (Clerk) — never calls useAuth itself.

**Why:** Hooks must be called in the same order on every render. Putting useAuth inside a conditionally-rendered child satisfies this rule.

**How to apply:** Any Clerk hook (useAuth, useUser, useClerk) must live inside a component that is only mounted when ClerkProvider is active.

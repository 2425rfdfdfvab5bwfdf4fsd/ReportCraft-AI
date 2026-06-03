---
name: ReportCraft AI stack and architecture
description: Key decisions, port layout, demo mode behavior, and env var requirements for this project
---

**Ports:** Vite frontend on 5000 (webview), Express backend on 8000 (console). Vite proxies /api → localhost:8000.

**Demo mode:** App fully works without Clerk. When VITE_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY absent, frontend skips ClerkGuard and backend uses a fixed demo agency (clerkUserId = "demo_user_replit").

**Key env vars needed for full production:**
- CLERK_SECRET_KEY + VITE_CLERK_PUBLISHABLE_KEY (auth)
- OPENAI_API_KEY (AI narratives; falls back to mock if absent)
- ANTHROPIC_API_KEY (AI fallback)
- RESEND_API_KEY (email delivery)
- CLOUDINARY_URL (logo/PDF storage)
- LEMON_SQUEEZY_API_KEY + LEMON_SQUEEZY_WEBHOOK_SECRET (billing)
- ENCRYPTION_KEY (AES-256-GCM for connector tokens; defaults to dev key)

**Monorepo:** root package.json uses npm workspaces. `server/` and `client/` have own package.json. Prisma schema at server/prisma/schema.prisma.

**Static file error:** "ENOENT: no such file or directory, stat client/dist/index.html" in backend logs is harmless in dev — only needed in production.

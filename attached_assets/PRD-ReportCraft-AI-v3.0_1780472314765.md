# PRD: ReportCraft AI

| Field | Value |
|-------|-------|
| **Product Name** | ReportCraft AI |
| **Document Version** | 3.0 |
| **Status** | Ready for Development |
| **Created** | June 3, 2026 |
| **Last Updated** | June 3, 2026 |
| **Document Owner** | Founding Engineer / Product Lead |
| **Primary Stakeholders** | Engineering, Design, Marketing, Growth |

### Revision History

| Version | Date | Summary of Changes |
|---------|------|--------------------|
| 1.0 | June 3, 2026 | Initial PRD |
| 1.1–1.6 | June 3, 2026 | Iterative audit passes: tech stack finalized (React 18 + Vite, Neon, Cloudinary), folder structure, data model fixes, role corrections, LinkedIn Ads added, AI failover, PostHog, billing state machine |
| 2.0 | June 3, 2026 | Production readiness audit: SLA corrected 30s→45s; Neon keep-alive; LinkedIn MDP risk; trial state machine; PDF SVG chart spec; Clerk webhook recovery; per-section narrative rating; shareToken entropy; downgrade guard; GDPR §13.4 |
| **3.0** | **June 3, 2026** | **Deep research review applied: (1) competitive AI differentiation reframed — all three named competitors now have AI narrative features, differentiation is now quality/depth (cross-channel causation), not existence; (2) AgencyAnalytics price corrected $239→$229; (3) white-label threshold corrected — available at $159/mo DashThis and $229/mo AgencyAnalytics, not "$400+/mo"; (4) Whatagraph demo requirement corrected — self-serve available for standard plans, demo only for Enterprise; (5) Lemon Squeezy reliability risk and Stripe acquisition documented with outage error case in §12; (6) LinkedIn MDP expanded with no-reapplication rule and Development Tier 5-account cap; (7) Claude model pinned to claude-3-5-sonnet-20241022; (8) Structured Outputs cold-start risk added to Open Questions; (9) Anthropic rate limit exhaustion risk documented; (10) YouTube Analytics connector added as Phase 2 named future connector; (11) Google Search Console (SEO) connector added as Phase 2; (12) Referral Program added as Feature 14 (P2); (13) New §17 Go-to-Market Strategy from validated research; (14) New §18 Validation Criteria and Kill Signals** |

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users](#4-target-users)
5. [Tech Stack & Architecture](#5-tech-stack--architecture)
6. [Features & Requirements](#6-features--requirements)
7. [Data Models](#7-data-models)
8. [API Endpoints](#8-api-endpoints)
9. [Pages & Routes](#9-pages--routes)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Error Handling & Edge Cases](#12-error-handling--edge-cases)
13. [Performance, Security & Compliance](#13-performance-security--compliance)
14. [Out of Scope (v1.0)](#14-out-of-scope-v10)
15. [Implementation Order](#15-implementation-order)
16. [Open Questions](#16-open-questions)
17. [Go-to-Market Strategy](#17-go-to-market-strategy)
18. [Validation Criteria & Kill Signals](#18-validation-criteria--kill-signals)
19. [Glossary](#19-glossary)

---

## 1. EXECUTIVE SUMMARY

ReportCraft AI is an AI-native agency reporting platform built for marketing agencies (2–20 person shops) that automatically connects client data sources — Google Analytics 4, Google Ads, Facebook/Meta Ads, LinkedIn Ads (Agency tier and above), YouTube Analytics, and Google Search Console (Phase 2) — and generates a 300–500 word strategic "Insight Write" narrative that explains not just what changed in the data, but why it changed across channels and what the agency should do next.

The core problem: agency account managers spend 10–15 hours per week manually pulling CSVs, building slide decks, and writing "what this means" commentary for clients. ReportCraft AI compresses that entire workflow to under 15 minutes per client report.

**The competitive differentiation is analytical depth, not feature existence.** Every major competitor (AgencyAnalytics, DashThis, Whatagraph) has shipped AI summary features. The difference is that their AI describes individual metric changes ("CTR increased 12%"); the ReportCraft AI Insight Write explains *cross-channel causation* ("your creative frequency on Meta exceeded 4.0, which suppressed CTR 23% — this is why GA4 bounce rate simultaneously increased despite higher paid traffic volume") and recommends specific actions. No competitor at the sub-$200/mo tier provides this level of cross-channel correlation analysis in plain language. That claim is verifiable by any user who has tried the competitor features, and it must be the anchor for all marketing copy.

The product is designed for a non-technical agency owner to set up, connect, and produce a branded PDF report in under 15 minutes — without a support call or sales demo.

---

## 2. PROBLEM STATEMENT

### 2.1 Current Pain Points

- **Manual reporting consumes 20%+ of agency work week:** Account managers export CSVs from Facebook Ads, Google Analytics, and Google Ads → paste into Google Sheets → screenshot into Google Slides → write narrative in a Google Doc → email to client. For a 10-client agency at $75/hr opportunity cost, this is ~$58,000/year in lost billable time. [Source: AgencyAnalytics Benchmarking Report, Dec 2024]
- **Existing AI reporting features are shallow:** AgencyAnalytics, DashThis (AI Insights Pro), and Whatagraph (IQ Summary) have all shipped AI summary features. However, these tools describe individual metrics channel by channel. They do not correlate across channels ("your Meta frequency increase caused your GA4 bounce spike"), and they do not explain *why* a metric moved or recommend specific next actions. Users describe them as "copy-pasting the stats with adjectives." The gap is not the existence of AI narrative — it is the depth and cross-channel intelligence of the analysis.
- **Setup complexity excludes the bottom 60% of the market:** AgencyAnalytics reports a 30-minute setup time, but users report 2–24 hour data sync delays; some platforms take 2–3 days to fully populate. Whatagraph requires a sales demo for enterprise plans (100+ source credits) — standard self-serve plans are available, but the perceived barrier is real. The 2–10 person agency cannot afford a tool that requires an onboarding call or days of data sync waiting.
- **White-label branding requires a mid-tier commitment:** Full white-labeling (agency subdomain, no vendor branding) is available at AgencyAnalytics's $229/mo Agency plan, DashThis's $159/mo Professional plan, and Whatagraph's $463/mo Boost plan. The market has a clear gap at the $79–$199 price point for a tool that combines white-label PDF delivery with deep AI narrative — not just one or the other.
- **No unified narrative + automation at the entry price:** The specific workflow automation that saves the most time — connect → generate AI narrative → export branded PDF → schedule email delivery — is either split across multiple tools, requires expensive enterprise tiers, or produces shallow AI commentary that still requires manual editing.

### 2.2 Proposed Solution

ReportCraft AI solves the core pain with a single, vertically integrated product: (1) connects GA4, Google Ads, Meta Ads, and LinkedIn Ads (Agency tier and above) via OAuth in under 5 clicks; (2) runs a multi-step AI prompt chain that **cross-correlates metric deltas across all connected channels** to produce a 300–500 word narrative explaining what happened, why it happened (with cross-channel causal links), and what to do next — in the agency's chosen tone; (3) presents the analysis in a professionally designed, white-labeled PDF the agency can send directly to clients; and (4) schedules and delivers reports automatically via email.

At $79/mo Starter and $199/mo Agency, the product undercuts AgencyAnalytics ($229/mo Agency, 10 clients) while delivering materially deeper AI analysis. Every step from data connection to client email is designed to be completed by a non-technical agency owner without documentation or a support call.

---

## 3. GOALS & SUCCESS METRICS

### 3.1 Primary Goals

- [ ] Reach $3,000 MRR within 60 days of launch (approximately 15 Agency plan customers at $199/mo)
- [ ] Reach $10,000 MRR within 90 days of launch (approximately 51 Agency plan customers, or mixed-tier equivalent)
- [ ] Achieve a trial-to-paid conversion rate of ≥ 30% within 30 days of beta launch
- [ ] Report generation (data fetch → AI narrative → PDF ready) completes in under 45 seconds for 95% of reports
- [ ] Agency onboarding (signup → first report generated) completes in under 15 minutes for ≥ 80% of new users

### 3.2 Success Metrics (KPIs)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| MRR at Day 60 | $3,000 | Lemon Squeezy subscription dashboard |
| MRR at Day 90 | $10,000 | Lemon Squeezy subscription dashboard |
| Trial-to-paid conversion rate | ≥ 30% | (Paid signups ÷ trial signups) × 100, PostHog funnel |
| Report generation time (p95) | < 45 seconds | `Report.generationDurationMs` logged per report |
| Time-to-first-report (new user) | < 15 minutes | PostHog: `agency_created` → `report_generated`, median and p90 |
| Monthly churn rate | < 5% | (Cancelled ÷ active at month start) × 100 |
| AI narrative thumbs-up rate | ≥ 80% | (Thumbs-up ÷ total ratings submitted) × 100, monthly |
| OAuth connector success rate | ≥ 98% | Successful token exchanges ÷ total attempts in server logs |
| Onboarding completion rate | ≥ 70% | PostHog funnel: `agency_created` → `onboarding_completed` |
| Referral conversion rate (Phase 2) | ≥ 15% | Referred signups ÷ referral links sent |

> **Note on the 45-second p95 SLA:** Independent benchmarking data confirms GPT-4o P95 latency hits 20–30 seconds during US business hours. Combined with the 12-second parallel data fetch ceiling and PDF rendering, 45 seconds is the honest, defensible target. Do not revert to 30 seconds without a fundamental pipeline change.

---

## 4. TARGET USERS

### 4.1 Primary User Persona

- **Name:** Alex — The Overloaded Account Manager
- **Role:** Account manager or founder at a 2–10 person marketing agency managing 8–12 client accounts across Google Ads, Facebook Ads, LinkedIn Ads, and GA4
- **Goals:** Send professional monthly performance reports to every client without spending more than 2 hours on reporting total; demonstrate ROI clearly; retain clients by being proactively insightful
- **Frustrations:** Spends the last week of every month in "report hell" — pulling exports, copying numbers into slides, writing the same boilerplate commentary for every client; current tool (AgencyAnalytics or DashThis) shows numbers but Alex still has to write what they mean; clients rarely open dashboard links but always read the PDF email
- **Tech Level:** Intermediate — comfortable with OAuth logins and SaaS tools, not a developer. Cannot write code or debug API errors.

### 4.2 Secondary Users

- **Growth Consultant / Fractional CMO:** Manages 4–8 client ad accounts. Needs polished reports as a client deliverable that justifies the retainer. Values executive-tone narrative over raw numbers. Agency or Agency Pro tier.
- **E-commerce Brand Founder:** Runs their own paid ads, needs monthly performance reports for investors or board meetings. Single-user, likely Starter tier. Values simplicity and speed.
- **PPC / SEO Agency:** Manages Google Ads and/or Search Console for 10–20 clients. Needs both paid and organic channel narrative in a single report. Primary driver for adding Google Search Console connector in Phase 2.

---

## 5. TECH STACK & ARCHITECTURE

### 5.1 Recommended Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | **React 18** + Tailwind CSS + shadcn/ui | React 18 concurrent features (Suspense, `useTransition`, `useDeferredValue`) enable non-blocking UI during report generation; Vite for fast local development and clean Vercel-compatible build output |
| Backend API | **Node.js 20 LTS** + Express (REST) | Plain Express with typed request/response shapes. Node 20 LTS — pin with `"engines": { "node": ">=20.0.0" }` and `FROM node:20-alpine` in Dockerfile. |
| ORM | Prisma 5 | Type-safe DB access, migration system, Neon PostgreSQL compatibility |
| Database | **Neon** (serverless PostgreSQL) | Fully managed serverless Postgres; branch-based dev/staging workflow; no infrastructure to manage. Free tier caveat: auto-suspends after 5 min inactivity (2–5s cold-start median ~1.8s) — mitigated by §5.4 keep-alive. Upgrade to Launch plan ($19/mo) removes auto-suspend; budget from Day 60. |
| Auth | Clerk | Email/password + Google SSO, JWT session tokens, webhooks for user lifecycle |
| Billing | **Lemon Squeezy** | Merchant of Record — handles VAT/GST for international agencies. **Risk note:** Lemon Squeezy was acquired by Stripe in July 2024 and is transitioning to "Stripe Managed Payments" (private preview). The service experienced 1,200+ tracked outages in 2024–2025 including a 15-hour API outage (Nov 2024). Evaluate migration to Paddle or native Stripe + Stripe Tax when MRR exceeds $20K. See §12 for outage error handling. |
| AI / LLM | **OpenAI GPT-4o** (primary) + **Anthropic `claude-3-5-sonnet-20241022`** (automatic fallback) | GPT-4o for narrative generation. Claude 3.5 Sonnet v2 (`claude-3-5-sonnet-20241022`) as automatic fallback on OpenAI 429/500/503 or timeout. **Pin the exact model version string** — do not use generic "Claude 3.5 Sonnet" which may resolve to 3.7 on future API updates. Claude 3.7 Sonnet (released Feb 2025) adds "Extended Thinking" but is marginally slower for strict instruction-following at non-thinking mode — 3.5 Sonnet v2 remains the correct fallback choice. |
| PDF Generation | @react-pdf/renderer (react-pdf) | Runs server-side in Node.js without a browser. Charts built using react-pdf's `<Svg>`, `<Rect>`, `<Polyline>` primitives — NOT Recharts (requires browser DOM). See §6 Feature 4. |
| Email Delivery | Resend | Simple API, high deliverability, React Email templates, generous free tier |
| Charts (in-app only) | Recharts | React-native, client-side only — web preview only, never PDF |
| Job Scheduling | node-cron inside Express server | Handles automated report delivery and keep-alive jobs; Railway always-on server required |
| Product Analytics | **PostHog** | Funnel events, conversion, session replay. Required Day 1 — KPIs cannot be measured without it. Free up to 1M events/month. |
| File & Object Storage | **Cloudinary** | Agency logos (permanent) and PDFs (Phase 2). Free tier: 25 GB storage, 25 GB bandwidth/month. |
| Frontend Hosting | Vercel | React 18 + Vite; `vercel.json` (output dir: `dist`, framework: `vite`); edge CDN, HTTPS, preview URLs per branch |
| Backend Hosting | Railway | Always-on Express (not serverless) — required for cron jobs, OAuth token refresh, PDF generation. Hobby plan: $5/mo baseline + usage. |

### 5.2 Project Structure

```
reportcraft-ai/
├── apps/
│   ├── web/                                   # React 18 + Vite frontend (Vercel)
│   │   ├── src/
│   │   │   ├── main.tsx                       # ReactDOM.createRoot, ClerkProvider, QueryClientProvider, PostHogProvider, Router
│   │   │   ├── App.tsx                        # Top-level route tree (public + protected branches)
│   │   │   │
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── pages/
│   │   │   │   │   │   ├── SignIn.tsx
│   │   │   │   │   │   └── SignUp.tsx
│   │   │   │   │   ├── components/
│   │   │   │   │   │   └── AuthCard.tsx
│   │   │   │   │   └── hooks/
│   │   │   │   │       └── useAuth.ts
│   │   │   │   │
│   │   │   │   ├── onboarding/
│   │   │   │   │   ├── pages/
│   │   │   │   │   │   └── Onboarding.tsx
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── OnboardingStep1Agency.tsx
│   │   │   │   │   │   ├── OnboardingStep2Client.tsx
│   │   │   │   │   │   ├── OnboardingStep3Connect.tsx
│   │   │   │   │   │   ├── OnboardingStep4Report.tsx
│   │   │   │   │   │   └── StepProgressBar.tsx
│   │   │   │   │   └── hooks/
│   │   │   │   │       └── useOnboarding.ts
│   │   │   │   │
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── pages/
│   │   │   │   │   │   └── Dashboard.tsx
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ClientTable.tsx
│   │   │   │   │   │   ├── ClientRow.tsx
│   │   │   │   │   │   ├── TierUsageBar.tsx
│   │   │   │   │   │   └── EmptyDashboard.tsx
│   │   │   │   │   └── hooks/
│   │   │   │   │       └── useDashboard.ts
│   │   │   │   │
│   │   │   │   ├── clients/
│   │   │   │   │   ├── pages/
│   │   │   │   │   │   ├── ClientDetail.tsx
│   │   │   │   │   │   └── ClientSettings.tsx
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ClientForm.tsx
│   │   │   │   │   │   ├── ClientGoalsForm.tsx
│   │   │   │   │   │   ├── ConnectorAssignmentPanel.tsx
│   │   │   │   │   │   ├── ReportHistoryList.tsx
│   │   │   │   │   │   └── TierLimitModal.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useClients.ts
│   │   │   │   │   │   └── useClientConnectors.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── clients.api.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── client.types.ts
│   │   │   │   │
│   │   │   │   ├── reports/
│   │   │   │   │   ├── pages/
│   │   │   │   │   │   ├── Reports.tsx
│   │   │   │   │   │   └── ReportPreview.tsx
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ReportCanvas.tsx
│   │   │   │   │   │   ├── NarrativeSection.tsx
│   │   │   │   │   │   ├── NarrativeRatingWidget.tsx
│   │   │   │   │   │   ├── MetricCard.tsx
│   │   │   │   │   │   ├── DeltaBadge.tsx
│   │   │   │   │   │   ├── ReportControlSidebar.tsx
│   │   │   │   │   │   ├── GenerateReportModal.tsx
│   │   │   │   │   │   └── SendReportModal.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useReports.ts
│   │   │   │   │   │   └── useReportGeneration.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── reports.api.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── report.types.ts
│   │   │   │   │
│   │   │   │   ├── connectors/
│   │   │   │   │   ├── pages/
│   │   │   │   │   │   └── Connectors.tsx
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ConnectorCard.tsx
│   │   │   │   │   │   ├── ConnectorGrid.tsx
│   │   │   │   │   │   └── ReconnectBanner.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useConnectors.ts
│   │   │   │   │   └── api/
│   │   │   │   │       └── connectors.api.ts
│   │   │   │   │
│   │   │   │   ├── settings/
│   │   │   │   │   ├── pages/
│   │   │   │   │   │   ├── Settings.tsx
│   │   │   │   │   │   ├── Billing.tsx
│   │   │   │   │   │   └── Team.tsx
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── AgencyProfileForm.tsx
│   │   │   │   │   │   ├── LogoUpload.tsx
│   │   │   │   │   │   ├── BrandColorPicker.tsx
│   │   │   │   │   │   ├── TrialBanner.tsx
│   │   │   │   │   │   ├── PastDueBanner.tsx
│   │   │   │   │   │   ├── PlanCard.tsx
│   │   │   │   │   │   ├── PlanComparisonTable.tsx
│   │   │   │   │   │   ├── TeamMemberTable.tsx
│   │   │   │   │   │   └── InviteMemberModal.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useAgency.ts
│   │   │   │   │   │   ├── useBilling.ts
│   │   │   │   │   │   └── useTeam.ts
│   │   │   │   │   └── api/
│   │   │   │   │       ├── agency.api.ts
│   │   │   │   │       └── team.api.ts
│   │   │   │   │
│   │   │   │   ├── landing/
│   │   │   │   │   ├── pages/
│   │   │   │   │   │   └── Landing.tsx
│   │   │   │   │   └── components/
│   │   │   │   │       ├── HeroSection.tsx
│   │   │   │   │       ├── FeatureGrid.tsx
│   │   │   │   │       ├── PricingSection.tsx
│   │   │   │   │       └── DemoVideo.tsx
│   │   │   │   │
│   │   │   │   └── public-report/
│   │   │   │       ├── pages/
│   │   │   │       │   └── PublicReport.tsx
│   │   │   │       └── components/
│   │   │   │           └── PublicReportView.tsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/                         # shadcn/ui — do not edit manually
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Topbar.tsx
│   │   │   │   │   ├── ProtectedLayout.tsx
│   │   │   │   │   └── PublicLayout.tsx
│   │   │   │   ├── shared/
│   │   │   │   │   ├── StatusBadge.tsx
│   │   │   │   │   ├── EmptyState.tsx
│   │   │   │   │   ├── SkeletonRow.tsx
│   │   │   │   │   ├── ConfirmModal.tsx
│   │   │   │   │   ├── UpgradeModal.tsx
│   │   │   │   │   └── FileUpload.tsx
│   │   │   │   └── charts/
│   │   │   │       ├── MetricLineChart.tsx     # Recharts — web preview only
│   │   │   │       └── MetricBarChart.tsx      # Recharts — web preview only
│   │   │   │
│   │   │   ├── router/
│   │   │   │   └── index.tsx
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts
│   │   │   │   ├── query-client.ts
│   │   │   │   ├── clerk.ts
│   │   │   │   └── posthog.ts
│   │   │   ├── utils/
│   │   │   │   ├── cn.ts
│   │   │   │   ├── format-currency.ts
│   │   │   │   ├── format-percent.ts
│   │   │   │   ├── format-date.ts
│   │   │   │   └── validate-hex-color.ts
│   │   │   ├── config/
│   │   │   │   └── constants.ts
│   │   │   ├── types/
│   │   │   │   ├── api.types.ts
│   │   │   │   └── env.d.ts
│   │   │   └── index.css
│   │   │
│   │   ├── public/fonts/inter/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── vercel.json
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── server/
│       ├── src/
│       │   ├── index.ts
│       │   ├── app.ts
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   │   ├── ga4.service.ts
│       │   │   ├── google-ads.service.ts
│       │   │   ├── meta-ads.service.ts
│       │   │   ├── linkedin-ads.service.ts
│       │   │   ├── narrative-engine.service.ts
│       │   │   ├── prompts.ts
│       │   │   ├── report-pdf.service.ts
│       │   │   ├── pdf-charts.service.ts       # Pure SVG chart builders for react-pdf
│       │   │   ├── report-scheduler.service.ts
│       │   │   ├── anomaly-detection.service.ts
│       │   │   ├── referral.service.ts          # Phase 2
│       │   │   ├── resend.service.ts
│       │   │   ├── storage.service.ts
│       │   │   └── token-refresh.service.ts
│       │   ├── jobs/
│       │   │   ├── scheduled-reports.job.ts
│       │   │   ├── anomaly-detection.job.ts
│       │   │   ├── monthly-reset.job.ts
│       │   │   └── db-keepalive.job.ts          # SELECT 1 every 4 min — prevents Neon cold-start
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── validate.middleware.ts
│       │   │   ├── upload.middleware.ts
│       │   │   ├── rate-limit.middleware.ts
│       │   │   └── error-handler.middleware.ts
│       │   ├── schemas/
│       │   ├── lib/
│       │   │   ├── prisma.ts
│       │   │   ├── cloudinary.ts
│       │   │   ├── encryption.ts
│       │   │   └── logger.ts
│       │   ├── config/
│       │   │   └── env.ts                       # Zod-validated process.env — fails fast on missing vars
│       │   └── types/
│       │       └── express.d.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── Dockerfile
│       ├── railway.toml
│       ├── tsconfig.json
│       ├── package.json
│       └── .env.example
│
├── packages/
│   └── types/                                   # Phase 2 — shared TS types between web and server
│
├── .gitignore
├── .npmrc                                        # shameful-hoist=true; strict-peer-dependencies=false
├── package.json                                  # pnpm workspace root
├── pnpm-workspace.yaml
└── README.md
```

> **Monorepo note:** `packages/types` shared package is Phase 2 only. In Phase 1, accept type duplication between `apps/web` and `apps/server` to reduce tooling overhead. Graduate to shared types only when cross-package type drift causes an actual bug.

### 5.2.1 Path Aliases

| Alias | Resolves to | Example |
|-------|-------------|---------|
| `@/*` | `src/*` | `import { cn } from '@/utils/cn'` |
| `@features/*` | `src/features/*` | `import { useClients } from '@features/clients/hooks/useClients'` |
| `@components/*` | `src/components/*` | `import { Button } from '@components/ui/button'` |
| `@lib/*` | `src/lib/*` | `import { apiClient } from '@lib/api-client'` |
| `@utils/*` | `src/utils/*` | `import { formatCurrency } from '@utils/format-currency'` |
| `@config/*` | `src/config/*` | `import { PLAN_LIMITS } from '@config/constants'` |

### 5.3 Key Environment Variables

**Frontend (`apps/web/.env`):**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-app.railway.app
VITE_LEMONSQUEEZY_STORE_ID=your_store_id
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://app.posthog.com
# NOTE: Never add secrets to apps/web/.env. Vite embeds ALL VITE_ vars into the client bundle.
```

**Backend (`apps/server/.env`):**
```
PORT=3001
NODE_ENV=production

# Database — Neon serverless PostgreSQL (use POOLED connection string)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/reportcraft?sslmode=require

# Clerk
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# AI — Exact model version strings must be pinned here to prevent silent upgrades
# AI_PROVIDER is a staging-only override. In production it must always be "openai".
# "openai"    → OpenAI GPT-4o primary, Claude fallback (production default)
# "anthropic" → Claude only, no GPT-4o fallback (staging cost control)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
AI_PROVIDER=openai

# OAuth — Google (shared for GA4 + Google Ads)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.railway.app/api/connectors/google/callback

# OAuth — Meta Ads
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://your-app.railway.app/api/connectors/meta/callback

# OAuth — LinkedIn Ads (P1 — initiate MDP approval on Day 1 of development)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://your-app.railway.app/api/connectors/linkedin/callback

# Token Encryption — AES-256-GCM
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_character_hex_encryption_key

# Email
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=your_resend_webhook_secret
EMAIL_FROM=reports@yourdomain.com

# Lemon Squeezy
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app

# ⚠️ OAuth redirect URIs must be registered EXACTLY in developer consoles.
# A single-character mismatch causes redirect_uri_mismatch errors.
```

### 5.4 Infrastructure Considerations

#### Neon Auto-Suspend Mitigation

Neon's free tier suspends compute after 5 minutes of inactivity. Cold-start median is approximately 1.8 seconds. Left unaddressed, this causes two problems: (1) `GET /health` making a DB query may timeout and trigger Railway to misinterpret the server as crashed; (2) the first user-facing request after inactivity hits a visible delay.

**Both mitigations are required:**
- `GET /health` returns `200` from process liveness only — it must NOT query the database
- `jobs/db-keepalive.job.ts` runs `*/4 * * * *` (every 4 minutes) executing `SELECT 1` via Prisma to keep compute warm

If `Report.rawData` JSON growth approaches Neon's free tier limit (500 MB), upgrade to the Launch plan ($19/mo) which removes auto-suspend entirely. Budget for this from Day 60 onward.

#### LinkedIn Marketing Developer Platform Approval

LinkedIn MDP requires a business verification review. Standard access typically takes **2–4 weeks**; partner/enterprise access can take **3–6 months**. New companies with limited online presence are frequently rejected. LinkedIn Ads is a P1 feature (Agency tier value proposition).

**Required actions before writing a line of LinkedIn connector code:**

1. **Submit the MDP application on Day 1 of development.** Do not wait until the connector is coded.

2. **The application itself is the most critical artifact.** If the application is rejected, the team **cannot re-apply using the same LinkedIn app ID** — a new app must be created and a new application submitted. This resets the review queue. Common rejection reasons: vague use case description, identity vetting failure (insufficient verifiable business history), app name containing "LinkedIn" or "Microsoft." The application must be reviewed by someone who has successfully navigated the process — draft it carefully, not quickly.

3. **Understand the Development Tier constraint during QA.** LinkedIn grants Development Tier access first, which limits POST (write) operations to a maximum of **5 ad accounts**. The QA plan for the LinkedIn connector must work within this constraint — unlimited GET access is available, but write operations are capped until Standard Tier is granted.

4. **Do not gate the Agency tier launch on LinkedIn approval.** Launch Agency tier with GA4 + Google Ads + Meta Ads. Surface a "LinkedIn Ads — Coming Soon" connector card with a tooltip if approval is pending. The Agency tier is valuable without LinkedIn.

---

## 6. FEATURES & REQUIREMENTS

---

### Feature 1: OAuth Data Connectors

- **Priority:** P0
- **User Story:** As an agency owner, I want to connect my clients' Google Analytics 4, Google Ads, and Facebook/Meta Ads accounts via OAuth so that ReportCraft AI can automatically pull their performance data without me exporting CSVs.
- **Acceptance Criteria:**
  - [ ] Clicking "Connect Google Analytics" initiates an OAuth 2.0 flow and returns a valid access token + refresh token on completion
  - [ ] Clicking "Connect Google Ads" initiates an OAuth 2.0 flow scoped to the `adwords` API
  - [ ] Clicking "Connect Meta Ads" initiates a Facebook OAuth flow with `ads_read` and `read_insights` permissions
  - [ ] Access tokens are encrypted with AES-256-GCM before storage and decrypted only at the moment of API calls — the raw token value is never written to the database or logs
  - [ ] When an access token expires, the system automatically uses the stored refresh token to obtain a new token without user interaction
  - [ ] Each connector card shows one of three states: "Connected" (green dot, account name shown), "Expired / Error" (red dot, "Reconnect" button), or "Not Connected" (grey, "Connect" button)
  - [ ] A user can connect multiple accounts per platform and assign different ones to different clients
  - [ ] The complete connection flow (click → consent → redirect → token stored → "Connected" shown) completes in under 60 seconds
- **UI Notes:** The Connectors page (`/connectors`) shows a grid of connector cards — one per platform. Each card shows platform logo, status badge, connected account name, "Disconnect" link, and "Connect" / "Reconnect" CTA. Below the grid, a "Your connected accounts" table lists: Platform, Account Name, Connected At, Status, Actions.
- **API/Logic Notes:**
  - OAuth state parameter is a signed, time-limited token (HMAC-SHA256, 10-minute TTL) containing the agency user ID to prevent CSRF
  - GA4 uses Google's `googleapis` Node.js library; Google Ads uses `google-ads-api`; Meta uses direct `https://graph.facebook.com` REST calls
  - Token refresh: check if `tokenExpiresAt < now + 5 minutes` before every data fetch; refresh if so
  - Google tokens expire in 1 hour. Meta user access tokens expire in 60 days — email the agency owner 7 days before expiry
  - Store encrypted tokens in `OAuthToken` table; never log decrypted token values
- **Dependencies:** Feature 8 (Auth), Feature 6 (Client Management)

---

### Feature 2: AI Narrative Engine ("The Insight Write")

- **Priority:** P0
- **User Story:** As an agency account manager, I want the platform to automatically write the strategic "What Happened & Why & What To Do" section of my client report — with cross-channel causal analysis — so I don't spend 60–90 minutes per client manually interpreting data.
- **Acceptance Criteria:**
  - [ ] Given a date range and connected data sources, the system produces a narrative of 300–500 words within 45 seconds (p95)
  - [ ] The narrative is split into exactly five sections: Executive Summary, Campaign Performance, Key Wins, Areas of Concern, Recommendations
  - [ ] When a metric change of >10% occurs, the narrative **must provide a cross-channel correlation explanation** — e.g., "Meta creative frequency exceeded 4.0 on Week 3, which correlates with the 23% CTR drop and the simultaneous GA4 bounce rate increase from paid traffic." This is the core differentiation from all competitor AI features.
  - [ ] Each section contains specific metric references (e.g., "Google Ads CTR improved 18% week-over-week, from 2.3% to 2.7%") — no generic statements
  - [ ] The tone selector (Professional / Conversational / Executive) visibly changes vocabulary and sentence structure — testable by comparing the same data across three tones
  - [ ] If both AI providers fail (>30 seconds each), the system returns a graceful error message and logs both failure reasons; no partial or garbled narrative is served
  - [ ] The generated narrative is stored in the database and re-displayed without re-calling the AI on subsequent page loads
- **UI Notes:** The AI narrative appears as a styled "Insight Write" card with a gradient header. Each section has a bold heading and 2–4 sentences of body text. A "Regenerate" button triggers a new AI call. A tone selector (segmented control) appears above the narrative. A rating widget (thumbs-up/down) appears below — see Feature 3 for rating UX detail.
- **API/Logic Notes:**
  - **Prompt chain:** Step 1 — fetch and normalize raw metrics from all connected sources into a standardized JSON structure. Step 2 — compute delta vs. previous period for every metric. Step 3 — identify top 3 cross-channel movers and compute correlation signals (e.g., where a metric spike in Channel A coincides with a metric shift in Channel B within the same week). Step 4 — pass normalized deltas + cross-channel correlation signals + agency goals + tone setting to GPT-4o with a structured system prompt. Step 5 — parse JSON response into five sections. Step 6 — store in `Report.narrative`.
  - Use OpenAI's `response_format: { type: "json_object" }` to guarantee parseable output. **Do not migrate to Structured Outputs (`response_format: { type: "json_schema", ... }`) without benchmarking in pre-production first** — Structured Outputs has a first-call schema compilation latency of up to 60 seconds, which would breach the 45-second SLA. See §16 Open Questions.
  - **AI provider strategy — automatic failover:** OpenAI GPT-4o (model: `process.env.OPENAI_MODEL`, default `gpt-4o`) is the primary. If OpenAI returns 429, 500, 503, or a network timeout, the system **automatically retries once** using Anthropic Claude (model: `process.env.ANTHROPIC_MODEL`, default `claude-3-5-sonnet-20241022`) via the Messages API. Never hardcode model strings — always read from env vars so model upgrades require only a config change, not a code deploy. Both providers require equivalent prompt structures.
  - Never expose which AI model generated a specific narrative to the end user
  - Rate limit narrative generation to 1 concurrent generation per agency (DB check on `Report.status = 'generating'`); return HTTP 409 if already in progress
- **Dependencies:** Feature 1 (OAuth Connectors), Feature 3 (Report Builder)

---

### Feature 3: Report Builder & Preview

- **Priority:** P0
- **User Story:** As an agency owner, I want to preview exactly how my client's report will look — with my logo and brand colors — before exporting or sending it.
- **Acceptance Criteria:**
  - [ ] The report preview renders in-browser within 3 seconds of page load for a report with cached data
  - [ ] Preview shows: agency logo, agency name, report title, date range, footer with agency name and page numbers
  - [ ] Metric cards display current value, previous value, and delta ("+18.3% ↑" in green or "-7.2% ↓" in red with both color AND directional arrow — never color alone)
  - [ ] Date range selector: Last 7 Days, Last 30 Days, Last 90 Days, Custom Range; changing the range triggers a re-fetch and re-render
  - [ ] Agency brand color applied to section headings, metric card borders, and header bar
  - [ ] Report preview layout is pixel-identical to the exported PDF — no layout drift between preview and PDF
  - [ ] If a data source is not connected, the section shows a placeholder with a "Connect [Platform]" CTA
  - [ ] **Narrative rating:** Thumbs-up records `narrativeRating: 'up'` with no further interaction. Thumbs-down opens a popover with a **required** dropdown — "Which section was least useful?" (Executive Summary / Campaign Performance / Key Wins / Areas of Concern / Recommendations / Overall quality) — and an **optional** free-text field "What was wrong?" (max 500 chars). Records `narrativeRating: 'down'`, `narrativeRatingSection`, and `narrativeRatingNote`. Per-section attribution is essential for improving the prompt chain over time.
- **UI Notes:** The report preview page (`/reports/:id`) uses a two-column layout: left narrow control sidebar (date range selector, Refresh Data button, tone selector, Regenerate Narrative button, Export PDF button, Send Now button, Schedule button, Share button); right full report preview. Section order: 1) Header, 2) KPI Cards row, 3) Channel Performance sections per connected source, 4) AI Insight Write, 5) Recommendations, 6) Footer.
- **API/Logic Notes:**
  - All connected connector services fetched in parallel using `Promise.allSettled` — one failing platform does not cancel others
  - Data cached in `Report.rawData` after first fetch; subsequent loads serve cached data unless "Refresh Data" is clicked
  - Custom date range validation: start < end; max 90 days; min 7 days; inline errors below the date picker
  - Delta: `((current - previous) / previous) * 100`, 1 decimal place; when `previous === 0`, show "N/A"
- **Dependencies:** Feature 1, Feature 2, Feature 6

---

### Feature 4: White-Labeled PDF Export

- **Priority:** P0
- **User Story:** As an agency owner, I want to export my client's report as a clean, professional PDF with my branding so I can email it directly to clients without it looking like a third-party tool.
- **Acceptance Criteria:**
  - [ ] Clicking "Export PDF" generates and downloads a PDF within 10 seconds
  - [ ] PDF contains the agency's logo in the top-left header on every page
  - [ ] PDF uses the agency's brand color for section headings, dividers, and metric card borders
  - [ ] On Agency tier and above: zero ReportCraft AI branding
  - [ ] On Starter tier: a small "Generated with ReportCraft AI" footer line (10pt, grey)
  - [ ] PDF is A4 size (210mm × 297mm), portrait orientation, 20mm margins
  - [ ] Charts in the PDF are rendered as vector SVG elements — not rasterized screenshots — and display correctly at 300 DPI
  - [ ] *(Phase 2)* Generated PDFs stored in Cloudinary and accessible via signed URL for 7 days
- **UI Notes:** "Export PDF" button shows a spinner during generation. On completion, browser downloads `[ClientName]-Report-[DateRange].pdf`.
- **API/Logic Notes:**
  - PDF generated server-side with `@react-pdf/renderer`. **Critical constraint:** react-pdf uses its own primitives (`<Document>`, `<Page>`, `<View>`, `<Text>`, `<Image>`, `<Svg>`, `<Path>`, `<Rect>`, `<Polyline>`) — not HTML or Tailwind. The web preview (React + Recharts) and PDF (react-pdf primitives) are two entirely separate render trees sharing the same data.
  - **PDF chart rendering:** `pdf-charts.service.ts` contains pure TypeScript functions accepting normalized metric arrays and returning react-pdf `<Svg>` elements. Bar charts: iterate data points, emit `<Rect>` elements scaled to available width. Line charts: compute points and emit `<Polyline>`. Both types include `<Text>` axis labels. MVP supports grouped bar chart and line chart — no pie charts, no gradient legends.
  - Logo: fetch from Cloudinary URL, convert to base64, embed directly — no external requests at render time
  - Font (Inter): registered with react-pdf via `Font.register()` pointing to self-hosted files in `public/fonts/inter/` — do not use Google Fonts URLs (blocked in Railway's server environment at render time)
  - v1.0 MVP: stream PDF as binary response (`Content-Type: application/pdf`, `Content-Disposition: attachment`). Nothing persisted to Cloudinary.
  - Phase 2: upload to Cloudinary under `reportcraft/pdfs/{agencyId}/{reportId}` with `resource_type: "raw"` and return 7-day signed URL
- **Dependencies:** Feature 3, Feature 7 (tier check for branding), Feature 8

---

### Feature 5: Client Email Delivery

- **Priority:** P0
- **User Story:** As an agency owner, I want reports automatically emailed to clients on a schedule so I never forget to send a report and clients receive consistent, timely updates.
- **Acceptance Criteria:**
  - [ ] Schedule options per client: Weekly (every Monday 9:00am in client's timezone), Monthly (1st of month 9:00am), or Custom (specific day + time)
  - [ ] "Send Now" triggers an immediate email delivery and records the send timestamp
  - [ ] Email subject line is customizable per client (default: "[Client Name] — Performance Report — [Month Year]")
  - [ ] Email body intro is customizable per client (default: "Hi [Contact Name], please find your performance report for [date range] attached.")
  - [ ] Email contains the PDF as an attachment
  - [ ] Delivery history shows: Date Sent, Status (Scheduled / Sent / Delivered / Opened / Bounced / Failed), Opened At
  - [ ] On delivery failure (bounce or failure), the agency sees the status badge and failure reason with a "Retry" button
  - [ ] Automated sends continue on schedule even when the agency is not logged in
- **UI Notes:** Each client profile page shows a "Report Delivery" section with a schedule toggle, next scheduled send date/time, and a history table. "Send Now" is always visible. An email preview modal shows before sending.
- **API/Logic Notes:**
  - **Timezone handling:** `Client.reportSchedule` stores the cron expression in the client's local timezone; `Client.reportScheduleTimezone` stores the IANA string (e.g., `"America/New_York"`). `report-scheduler.service.ts` uses `luxon` (`DateTime.fromObject({...}, { zone: client.reportScheduleTimezone })`) to compute next run time in the client's timezone, convert to UTC, and compare against `now`. "Due" = `Math.abs(nextRunUTC - now) < 60000`. This correctly handles DST transitions.
  - React Email template: agency logo, agency name, intro message, "View Report" button, PDF as base64 attachment (max 10MB per send)
  - Email open tracking: Resend `email.opened` webhook → updates `ReportDelivery.openedAt`
- **Dependencies:** Feature 3, Feature 4, Feature 6, Feature 8

---

### Feature 6: Client Management

- **Priority:** P0
- **User Story:** As an agency owner, I want to create and manage client profiles with contact info, connected data sources, and monthly goals so I can generate accurate, goal-aware reports for each client independently.
- **Acceptance Criteria:**
  - [ ] Create a client with: Client Name (required, max 100 chars), Industry (dropdown), Website URL (optional), Contact Name (required), Contact Email (required, validated)
  - [ ] Each client allows assigning one or more OAuth accounts per platform
  - [ ] Monthly goals can be set per client per channel (GA4, Google Ads, Meta Ads, LinkedIn Ads)
  - [ ] Client dashboard table shows: Client Name, Connected Platforms, Last Report Date, Next Scheduled Report, Status
  - [ ] **Tier usage counter:** Dashboard header shows a persistent "X of Y clients used" progress bar at all times — not only when the limit is hit. Users must never be surprised by a limit.
  - [ ] Tier enforcement: creating a client beyond the tier limit shows an upgrade modal — the client is not created
  - [ ] Agency can archive (soft-delete) a client; archived clients do not count toward the tier limit
  - [ ] Agency can edit all client fields after creation
  - [ ] LinkedIn Ads goals section is shown only when the client has a LinkedIn connector assigned and the agency is on Agency tier or above
- **UI Notes:** Client creation is a slide-over panel with four sections: Basic Info, Contact, Connected Data Sources, Monthly Goals (optional, expandable per platform). Each client row is clickable → `/clients/:id`.
- **API/Logic Notes:**
  - All client records scoped to the agency via `agencyId` FK — every query enforces `WHERE agencyId = currentAgencyId`
  - Monthly goals stored as JSON in `Client.goals`
  - Active client count: `SELECT COUNT(*) FROM Client WHERE agencyId = ? AND archivedAt IS NULL`
- **Dependencies:** Feature 1, Feature 7, Feature 8

---

### Feature 7: Subscription Billing (Lemon Squeezy)

- **Priority:** P0
- **User Story:** As an agency owner, I want to subscribe to a plan, manage my subscription, and have the product automatically enforce my plan's limits so I understand what I'm paying for and can upgrade when I need more capacity.
- **Acceptance Criteria:**
  - [ ] Three paid tiers: **Starter** ($79/mo — 5 clients, 5 AI reports/month, logo-only white-label), **Agency** ($199/mo — 15 clients, unlimited AI reports, full white-label), **Agency Pro** ($349/mo — unlimited clients, unlimited AI reports, full white-label, shareable client portal link, referral program access)
  - [ ] **14-day free trial:** All new agencies start on `FREE_TRIAL` with Agency-tier feature limits, no credit card required. A trial countdown banner ("X days left in your free trial") is shown on all authenticated pages starting 7 days before expiry. At expiry without subscription, account enters read-only mode.
  - [ ] Clicking "Upgrade" redirects to a Lemon Squeezy checkout pre-filled with the user's email
  - [ ] After successful payment, `Agency.subscriptionTier` and `Agency.subscriptionStatus` update within 5 seconds of the LS webhook being received and processed
  - [ ] Billing settings page shows: current plan, next billing date, monthly price, "Manage Subscription" link, plan comparison table
  - [ ] **Downgrade guard:** If active client count exceeds the new tier's limit, a warning modal lists excess clients that will be archived. Downgrade proceeds only after agency selects which clients to archive and confirms. API validates client count before completing the downgrade. Returns HTTP 400 with `{ error: "CLIENT_LIMIT_EXCEEDED", activeClients: number, newLimit: number, excessClients: Client[] }` if unresolved.
  - [ ] `past_due` grace period: 3 days of full access after a failed payment. A persistent banner shows on all pages: "Your payment failed — update your payment method to avoid losing access." After 3 days, account enters read-only mode.
  - [ ] All webhooks verified using HMAC-SHA256 signature before processing
- **UI Notes:** Billing page shows a card for the current plan with a green "Active" badge, billing date, and amount. A three-column plan comparison table highlights the current plan. "Cancel Subscription" link in small grey text at the bottom.

> **Lemon Squeezy operational risk:** Lemon Squeezy was acquired by Stripe in July 2024 and has experienced over 1,200 tracked outages in 2024–2025, including a 15-hour API outage (November 2024). The service is transitioning to "Stripe Managed Payments." For MVP and early growth, LS remains the right choice for its Merchant of Record tax handling. Begin evaluating Paddle or Stripe + Stripe Tax when MRR exceeds $20,000. See §12 for LS outage handling.

#### 7.1 Subscription State Machine

All state transitions are driven exclusively by Lemon Squeezy webhook events. The backend never changes `subscriptionStatus` based on client-side requests.

```
                                    ┌─────────────────────────┐
                     signup         │       FREE_TRIAL         │
               ─────────────────►  │  All Agency features     │
                                    │  14-day countdown        │
                                    └────────────┬────────────┘
                                                 │
                      ┌──────────────────────────┼──────────────────────────┐
                      │ trial expires            │ user subscribes           │
                      ▼ (no payment)             ▼                           │
              ┌───────────────┐       ┌──────────────────┐                  │
              │  READ-ONLY    │       │  STARTER /        │                  │
              │  (expired     │       │  AGENCY /         │                  │
              │   trial)      │       │  AGENCY_PRO       │                  │
              └───────┬───────┘       │  status: active   │                  │
                      │ user subscribes└────────┬──────────┘                 │
                      └──────────────────────── │ ──────────────────────────┘
                                               ▼ payment fails
                                    ┌──────────────────────┐
                                    │  status: past_due    │
                                    │  Full access 3 days  │
                                    │  Persistent banner   │
                                    └────────┬─────────────┘
                                             │
                     ┌───────────────────────┼────────────────────┐
                     │ payment recovered     │ 3 days elapsed     │
                     ▼                       ▼                    │
               ┌──────────┐       ┌──────────────────┐           │
               │  active  │       │  READ-ONLY        │ user cancels
               └──────────┘       │  (payment failed) │           │
                                  └──────────────────┘           │
                                                                  ▼
                                                        ┌──────────────────┐
                                                        │  cancelled       │
                                                        │  Access until    │
                                                        │  period ends     │
                                                        └──────────────────┘
```

**Webhook events to handle:** `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `order_refunded`

**READ-ONLY mode:** Agency can view all existing reports, clients, and settings. All write actions return HTTP 403 with `{ error: "ACCOUNT_READ_ONLY", reason: "trial_expired" | "payment_failed" | "subscription_cancelled" }`. Frontend shows an upgrade modal.

- **API/Logic Notes:**
  - `Agency.subscriptionTier`: `FREE_TRIAL` | `STARTER` | `AGENCY` | `AGENCY_PRO`
  - `Agency.subscriptionStatus`: `active` | `past_due` | `cancelled` | `paused`
  - `Agency.aiReportsUsedThisMonth` resets to 0 on 1st of each month via `monthly-reset.job.ts`
  - All tier limit checks enforced server-side — never trust the client
  - Unknown `variantId` in LS webhook: log `WARN` with full raw payload, return HTTP 200 immediately. Never return non-200 to LS webhook endpoints — LS retries non-200 indefinitely.
- **Dependencies:** Feature 8

---

### Feature 8: Auth & Onboarding

- **Priority:** P0
- **User Story:** As a new agency owner, I want to sign up, set up my agency profile, and generate my first report through a guided wizard so I can see the product's value within 15 minutes.
- **Acceptance Criteria:**
  - [ ] Sign up with email + password or Google SSO via Clerk
  - [ ] After signup, user is redirected to `/onboarding` — cannot access dashboard routes until onboarding is complete
  - [ ] Onboarding wizard has exactly 4 steps: Step 1 "Your Agency" (name, logo, brand color), Step 2 "Add First Client" (name, contact email), Step 3 "Connect Data Source" (at least one OAuth connector), Step 4 "Generate First Report" (date range + generate with live progress indicator)
  - [ ] "Back" button on each step preserves previously entered data
  - [ ] Logo upload: PNG, JPG, SVG up to 2MB; files exceeding this show an inline error; accepted files uploaded to Cloudinary at `reportcraft/logos/{agencyId}`
  - [ ] Brand color hex input validates format (`/^#[0-9A-Fa-f]{6}$/`); invalid values show inline error
  - [ ] After Step 4, user is redirected to the report preview with a "Welcome!" toast
  - [ ] Clerk `user.created` webhook creates an `Agency` record with `subscriptionTier: FREE_TRIAL` and `trialEndsAt: now + 14 days`
- **UI Notes:** Clean centered card layout (max-width 560px) on dark background — not the full dashboard shell. Progress bar shows "Step 1 of 4". "Continue" button disabled until required fields are filled.
- **API/Logic Notes:**
  - Clerk JWT verified on every backend request via `clerkClient.verifyToken()`
  - **Clerk webhook failure recovery:** If the `user.created` webhook fails (transient outage, deploy overlap), a user exists in Clerk with no `Agency` record. Clerk retries with backoff, usually resolving within minutes — but there is a gap. Auth middleware must handle this: if JWT is valid but no `Agency` record exists, create a minimal Agency on-the-fly (`name: null`, `subscriptionTier: FREE_TRIAL`, `trialEndsAt: now + 14 days`, `onboardingCompletedAt: null`), redirect to `/onboarding`, and log `WARN "webhook_recovery: created agency on-the-fly"`. This prevents permanent broken state.
  - Agency slug is auto-generated from agency name (lowercase, spaces to hyphens, unique suffix on collision)
  - `ProtectedLayout.tsx` must handle three states: (1) `!isLoaded` — full-page spinner; (2) `isLoaded && !isSignedIn` — `<Navigate to="/sign-in" replace />`; (3) `isLoaded && isSignedIn` — render route. Do not redirect before Clerk determines auth state — causes visible flash redirect on every page refresh.
  - `Agency.onboardingCompletedAt` null → frontend redirects to `/onboarding`. Backend never performs HTTP redirects for SPA routes.
- **Dependencies:** None (foundation for all other features)

---

### Feature 9: LinkedIn Ads Connector

- **Priority:** P1
- **User Story:** As an agency owner running LinkedIn campaigns for B2B clients, I want to connect LinkedIn Ads so my reports include LinkedIn performance data alongside Google and Meta.
- **Acceptance Criteria:**
  - [ ] OAuth 2.0 flow connects to LinkedIn Marketing API with `r_ads` and `r_ads_reporting` scopes
  - [ ] Metrics: impressions, clicks, CTR, spend, CPM, CPC, conversions, lead gen form completions
  - [ ] LinkedIn data appears as a separate "LinkedIn Ads" section in both report preview and PDF
  - [ ] LinkedIn Ads goals can be set per client (impressions target, CPC target, monthly spend budget)
  - [ ] Available on Agency tier and above only; Starter users see the connector card with a lock icon and "Agency plan required"
  - [ ] Feature is server-side disabled if `LINKEDIN_CLIENT_ID` is not set in env vars
- **UI Notes:** LinkedIn connector card matches existing connector card layout. On Starter tier, the card is visually greyed out with a lock icon overlay.
- **API/Logic Notes:**
  - LinkedIn access tokens expire in 60 days. Verify current refresh token lifecycle in LinkedIn's Marketing API documentation before implementing — this has changed across API versions.
  - ⚠️ **MDP Approval dependency:** Cannot implement without LinkedIn MDP approval. See §5.4 for the full approval process, no-reapplication rule, and Development Tier 5-account cap.
- **Dependencies:** Feature 1 (base connector architecture), Feature 7 (tier check)

---

### Feature 10: Client Portal View (Shareable Link)

- **Priority:** P1
- **User Story:** As an agency owner, I want to send clients a link where they can view their latest report in a browser without logging in, so clients can reference their report anytime.
- **Acceptance Criteria:**
  - [ ] Each report can have a unique, unguessable shareable link. `Report.shareToken` is generated as `crypto.randomBytes(32).toString('base64url')` (256 bits of entropy) the first time "Enable client link" is toggled on. It is `null` by default.
  - [ ] The shareable link shows the full report (branding, metrics, AI narrative) without login and without any ReportCraft AI chrome
  - [ ] Agency can revoke a link at any time; revoked links return HTTP 404
  - [ ] `Report.shareEnabled` defaults to `false` — reports are private by default
  - [ ] Available on Agency Pro tier only
- **UI Notes:** "Share" button in the control sidebar opens a modal with the URL, a "Copy Link" button, and a "Revoke Link" option.
- **API/Logic Notes:**
  - `GET /api/public/reports/:token` validates `Report.shareToken` and `Report.shareEnabled`. Returns HTTP 404 for both "not found" and `shareEnabled = false` — do not distinguish (prevents token enumeration).
  - Never return sensitive fields in the public response: `agencyId`, `aiModel`, `narrativeRating`, `narrativeRatingSection`, `narrativeRatingNote`, `generationDurationMs`, `status`, `shareToken`.
- **Dependencies:** Feature 3, Feature 7

---

### Feature 11: Anomaly Detection Alerts

- **Priority:** P1
- **User Story:** As an agency owner, I want to be automatically alerted when a client's metric drops or spikes more than 20% week-over-week so I can proactively address issues before the client notices.
- **Acceptance Criteria:**
  - [ ] System checks all connected client metrics every Monday at 6:00am UTC. "Current period" = 7 days ending Sunday 23:59:59 UTC; "Previous period" = 7 days immediately before. Monday 6am ensures both periods are complete calendar weeks.
  - [ ] Any metric change of more than ±20% vs. prior 7-day period triggers an alert email to the agency owner
  - [ ] Alert email specifies: client name, metric name, current value, previous value, percentage change, and a link to the report
  - [ ] Agency can enable/disable alerts globally (Settings) or per client (Client settings)
  - [ ] Available on all paid tiers and during FREE_TRIAL
  - [ ] Threshold is fixed at ±20% for MVP — not user-configurable
- **API/Logic Notes:** Triggered by `jobs/anomaly-detection.job.ts` (cron `0 6 * * 1`) → `anomaly-detection.service.ts`. Uses Resend for email delivery.
- **Dependencies:** Feature 1, Feature 5, Feature 6

---

### Feature 12: Multi-User Team Access

- **Priority:** P1
- **User Story:** As an agency owner, I want to invite team members with specific roles so account managers can manage client reports without accessing billing or agency settings.
- **Acceptance Criteria:**
  - [ ] Agency owner can invite team members by email; invited users receive a sign-up link pre-linked to the agency
  - [ ] Four roles: **Owner** (full access; one per agency; cannot be removed or transferred), **Admin** (full access including billing; cannot delete agency or change owner), **Analyst** (create/edit/send reports; manage clients; connect/disconnect data sources; no billing or team), **Viewer** (read-only)
  - [ ] `PUT /api/team/:memberId` returns HTTP 403 if target member has `role = 'owner'`
  - [ ] Removing a team member sets `TeamMember.removedAt`. Subsequent requests from that user return HTTP 403. JWT revocation takes up to 1 hour (Clerk TTL) — acceptable for MVP.
- **UI Notes:** Settings → Team. Table: Name, Email, Role (editable dropdown), Last Active, Remove button.
- **API/Logic Notes:** Roles stored in `TeamMember`. All API middleware checks `req.teamMember.role` before write operations.
- **Dependencies:** Feature 8

---

### Feature 13: Product Analytics Instrumentation

- **Priority:** P0 (Required from Day 1 — KPIs in §3.2 cannot be measured without this)
- **User Story:** As the founding engineer, I need to track key funnel events from Day 1 so that trial-to-paid conversion rate, time-to-first-report, and onboarding completion can be measured and improved.
- **Acceptance Criteria:**
  - [ ] PostHog initialized in `apps/web/src/lib/posthog.ts` using `posthog-js` with `autocapture: false`
  - [ ] The following 7 events tracked via `posthog.capture()`:

| Event Name | When | Key Properties |
|-----------|------|----------------|
| `agency_created` | After Clerk signup + Agency record created | `{ subscriptionTier: "FREE_TRIAL" }` |
| `onboarding_completed` | After Step 4 report generation completes | `{ connectors: string[], timeToCompleteMs: number }` |
| `connector_connected` | After OAuth callback succeeds | `{ platform: string }` |
| `report_generated` | After `Report.status` → `'ready'` | `{ clientId, narrativeTone, generationDurationMs }` |
| `report_exported` | After "Export PDF" download begins | `{ clientId, reportId }` |
| `report_sent` | After delivery confirmed | `{ clientId, reportId }` |
| `upgrade_clicked` | When any upgrade CTA is clicked | `{ source, currentTier, targetTier }` |

  - [ ] `posthog.identify(clerkUserId, { agencyId, subscriptionTier })` called on every authenticated page load after Agency data is loaded
  - [ ] `autocapture: false` prevents capturing sensitive form field content
- **Dependencies:** Feature 8

---

### Feature 14: Referral Program

- **Priority:** P2
- **User Story:** As a paying agency owner, I want to refer other agencies to ReportCraft AI and receive 1 month of free subscription credit for each referred customer who converts, so I have an incentive to advocate for the product.
- **Acceptance Criteria:**
  - [ ] Each agency on a paid plan (not FREE_TRIAL) has a unique referral link available from the Settings page or Billing page
  - [ ] Referral link is of the form `https://app.reportcraft.ai/signup?ref=[referralCode]` where `referralCode` is a short, human-readable code (e.g., `ALEX-XF4K`)
  - [ ] When a referred user signs up and converts to a paid plan within 30 days, the referring agency receives a 1-month subscription credit applied to their next billing cycle
  - [ ] The Settings → Billing page shows: "Your referral code," "Referrals sent," "Converted referrals," "Credits earned"
  - [ ] Referral tracking is attributed via `Agency.referredByCode` stored at signup; referral credit is triggered by the referred agency's first `subscription_created` Lemon Squeezy webhook event
  - [ ] Referral credits are applied as a coupon/discount via the Lemon Squeezy API; the referring agency receives an email notification when credit is earned
  - [ ] Available on Agency and Agency Pro tiers only (not Starter — prevents low-value referral gaming)
- **API/Logic Notes:**
  - `Agency.referralCode` — a unique short code generated at first paid activation (`NANOID` or `crypto.randomBytes(4).toString('hex').toUpperCase()` prefixed with agency initials)
  - `Agency.referredByCode` — populated at signup if `ref` query param is present; stored before the agency's own subscription is activated
  - `referral.service.ts` handles credit issuance via Lemon Squeezy discount API
  - Referral chains (A refers B who refers C) award credit only one level deep — B earns credit for C's conversion; A does not
- **Dependencies:** Feature 7 (billing), Feature 8 (auth)

---

## 7. DATA MODELS

### Agency
```typescript
interface Agency {
  id: string;                    // UUID, primary key
  clerkUserId: string;           // Clerk user ID of the owner, unique
  name: string | null;           // null for on-the-fly created records (webhook recovery)
  slug: string;                  // URL-safe unique identifier, auto-generated
  logoUrl: string | null;        // Cloudinary secure_url
  brandColor: string;            // Hex color code, default "#6366F1"
  timezone: string;              // IANA timezone, default "America/New_York"
  subscriptionTier: 'FREE_TRIAL' | 'STARTER' | 'AGENCY' | 'AGENCY_PRO';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'paused';
  lemonSqueezyCustomerId: string | null;
  lemonSqueezySubscriptionId: string | null;
  trialEndsAt: Date | null;      // null after paid subscription activated
  pastDueAt: Date | null;        // Timestamp of first failed payment — 3-day grace period computed from this
  aiReportsUsedThisMonth: number;
  onboardingCompletedAt: Date | null;
  narrativeTone: 'professional' | 'conversational' | 'executive';
  anomalyAlertsEnabled: boolean;
  referralCode: string | null;   // Unique short code for referral program — set at first paid activation
  referredByCode: string | null; // Referral code from the referring agency at signup
  createdAt: Date;
  updatedAt: Date;
}
```

### Client
```typescript
interface Client {
  id: string;
  agencyId: string;              // Foreign key → Agency.id
  name: string;                  // Max 100 chars
  industry: 'ecommerce' | 'saas' | 'local_business' | 'b2b' | 'healthcare' | 'other';
  websiteUrl: string | null;
  contactName: string;
  contactEmail: string;
  goals: ClientGoals | null;
  reportSchedule: string | null; // Cron expression in client's local timezone
  reportScheduleTimezone: string; // IANA timezone, e.g., "America/Chicago"
  status: 'active' | 'paused' | 'archived';
  archivedAt: Date | null;
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  anomalyAlertsEnabled: boolean;
  lastReportAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientGoals {
  ga4?: { sessions?: number; conversionRate?: number; };
  googleAds?: { roas?: number; cpc?: number; budget?: number; };
  meta?: { roas?: number; cpm?: number; budget?: number; };
  linkedin?: { impressions?: number; cpc?: number; budget?: number; };
}
```

### OAuthToken
```typescript
interface OAuthToken {
  id: string;
  agencyId: string;
  platform: 'google_analytics' | 'google_ads' | 'meta_ads' | 'linkedin_ads';
  accountId: string;
  accountName: string;
  encryptedAccessToken: string;   // AES-256-GCM encrypted — NEVER serialized to API response
  encryptedRefreshToken: string | null; // AES-256-GCM encrypted — NEVER serialized to API response
  tokenExpiresAt: Date;
  scopes: string[];
  status: 'active' | 'expired' | 'error';
  lastRefreshedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### ClientConnector
```typescript
interface ClientConnector {
  id: string;
  clientId: string;
  oauthTokenId: string;
  createdAt: Date;
}
```

### Report
```typescript
interface Report {
  id: string;
  clientId: string;
  agencyId: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  status: 'draft' | 'generating' | 'ready' | 'error';
  rawData: ReportRawData | null;
  narrative: ReportNarrative | null;
  narrativeTone: 'professional' | 'conversational' | 'executive';
  aiModel: string | null;           // e.g., "gpt-4o", "claude-3-5-sonnet-20241022" — never exposed to end user
  narrativeRating: 'up' | 'down' | null;
  narrativeRatingSection: 'executive_summary' | 'campaign_performance' | 'key_wins' | 'areas_of_concern' | 'recommendations' | 'overall' | null;
  narrativeRatingNote: string | null; // Optional free-text, max 500 chars
  shareToken: string | null;        // crypto.randomBytes(32).toString('base64url') — generated on first enable
  shareEnabled: boolean;
  generationDurationMs: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReportNarrative {
  executiveSummary: string;
  campaignPerformance: string;
  keyWins: string;
  areasOfConcern: string;
  recommendations: string;
  wordCount: number;
  generatedAt: Date;
}

interface ReportRawData {
  period: { start: string; end: string; };
  prevPeriod: { start: string; end: string; };
  ga4?: {
    sessions: number; sessionsPrev: number;
    users: number; usersPrev: number;
    bounceRate: number; bounceRatePrev: number;
    conversionRate: number; conversionRatePrev: number;
    avgSessionDuration: number; avgSessionDurationPrev: number;
    topChannels: Array<{ channel: string; sessions: number }>;
    error?: string;
  };
  googleAds?: {
    impressions: number; impressionsPrev: number;
    clicks: number; clicksPrev: number;
    ctr: number; ctrPrev: number;
    spend: number; spendPrev: number;
    cpc: number; cpcPrev: number;
    conversions: number; conversionsPrev: number;
    roas: number; roasPrev: number;
    error?: string;
  };
  meta?: {
    impressions: number; impressionsPrev: number;
    reach: number; reachPrev: number;
    clicks: number; clicksPrev: number;
    ctr: number; ctrPrev: number;
    spend: number; spendPrev: number;
    cpm: number; cpmPrev: number;
    roas: number; roasPrev: number;
    error?: string;
  };
  linkedin?: {
    impressions: number; impressionsPrev: number;
    clicks: number; clicksPrev: number;
    ctr: number; ctrPrev: number;
    spend: number; spendPrev: number;
    cpc: number; cpcPrev: number;
    cpm: number; cpmPrev: number;
    conversions: number; conversionsPrev: number;
    leadGenFormCompletions: number; leadGenFormCompletionsPrev: number;
    error?: string;
  };
}
```

### ReportDelivery
```typescript
interface ReportDelivery {
  id: string;
  reportId: string;
  agencyId: string;              // Denormalized for efficient agency-level queries without JOIN
  clientId: string;
  status: 'scheduled' | 'sending' | 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed';
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  failureReason: string | null;
  resendEmailId: string | null;  // Resend message ID for webhook correlation
  createdAt: Date;
  updatedAt: Date;
}
```

### TeamMember
```typescript
interface TeamMember {
  id: string;
  agencyId: string;
  clerkUserId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'analyst' | 'viewer';
  invitedAt: Date;
  acceptedAt: Date | null;
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 8. API ENDPOINTS

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| GET | /health | No | — | `{ status: "ok", timestamp: string }` | Process liveness — does NOT query DB (prevents Neon cold-start from triggering Railway restart) |
| POST | /api/webhooks/clerk | Clerk sig | Clerk event | `{ received: true }` | `user.created`, `user.deleted` |
| POST | /api/webhooks/lemonsqueezy | LS HMAC sig | LS event | `{ received: true }` | Billing subscription events |
| POST | /api/webhooks/resend | Resend sig | Resend event | `{ received: true }` | Email delivery status |
| GET | /api/agencies/me | Yes | — | `Agency` | Get current agency profile |
| PUT | /api/agencies/me | Yes | `{ name?, logoUrl?, brandColor?, timezone?, narrativeTone?, anomalyAlertsEnabled? }` | `Agency` | Update agency profile |
| POST | /api/agencies/me/logo | Yes | `FormData { file: File }` | `{ url: string }` | Upload logo to Cloudinary (max 2MB, PNG/JPG/SVG) |
| GET | /api/clients | Yes | — | `Client[]` | List active clients for agency |
| POST | /api/clients | Yes | `{ name, industry, websiteUrl?, contactName, contactEmail }` | `Client` | Create client (tier limit enforced server-side) |
| GET | /api/clients/:id | Yes | — | `Client` | Get single client |
| PUT | /api/clients/:id | Yes | `{ name?, industry?, contactName?, contactEmail?, goals?, emailSubjectTemplate?, emailBodyTemplate?, anomalyAlertsEnabled?, status? }` | `Client` | Update client |
| DELETE | /api/clients/:id | Yes | — | `{ success: true }` | Archive client (soft delete) |
| GET | /api/clients/:id/connectors | Yes | — | `ClientConnector[]` | List connectors assigned to client |
| POST | /api/clients/:id/connectors | Yes | `{ oauthTokenId: string }` | `ClientConnector` | Assign connector to client |
| DELETE | /api/clients/:clientId/connectors/:connectorId | Yes | — | `{ success: true }` | Remove connector from client |
| PUT | /api/clients/:id/schedule | Yes | `{ schedule: string, timezone: string }` | `Client` | Update delivery schedule — cron in client's local timezone |
| GET | /api/clients/:id/deliveries | Yes | `?page=&limit=` | `{ deliveries: ReportDelivery[], total: number }` | Paginated delivery history, sorted `createdAt DESC` |
| GET | /api/connectors | Yes | — | `OAuthToken[]` (⚠ strip `encryptedAccessToken` and `encryptedRefreshToken` before serializing) | List all agency OAuth connections |
| GET | /api/connectors/google/auth-url | Yes | `?platform=google_analytics\|google_ads` | `{ url: string }` | Generate Google OAuth URL with signed HMAC state |
| GET | /api/connectors/google/callback | No (signed state) | Query: `code, state` | Redirect to `/connectors` | Handle Google OAuth callback |
| GET | /api/connectors/meta/auth-url | Yes | — | `{ url: string }` | Generate Meta OAuth URL |
| GET | /api/connectors/meta/callback | No (signed state) | Query: `code, state` | Redirect to `/connectors` | Handle Meta OAuth callback |
| GET | /api/connectors/linkedin/auth-url | Yes | — | `{ url: string }` | LinkedIn OAuth URL (P1; disabled if `LINKEDIN_CLIENT_ID` not set) |
| GET | /api/connectors/linkedin/callback | No (signed state) | Query: `code, state` | Redirect to `/connectors` | Handle LinkedIn OAuth callback (P1) |
| DELETE | /api/connectors/:id | Yes | — | `{ success: true }` | Disconnect OAuth token |
| POST | /api/connectors/:id/refresh | Yes | — | `OAuthToken` | Manually trigger token refresh |
| GET | /api/reports | Yes | `?clientId=&page=&limit=` | `{ reports: Report[], total: number }` | List reports (paginated, 20/page) |
| POST | /api/reports | Yes | `{ clientId, dateRangeStart, dateRangeEnd, narrativeTone? }` | `{ id: string, status: 'generating' }` | Create report + start async generation; poll `GET /api/reports/:id` for status |
| GET | /api/reports/:id | Yes | — | `Report` | Get report |
| POST | /api/reports/:id/regenerate-narrative | Yes | `{ tone?: string }` | `Report` | Re-run AI narrative |
| POST | /api/reports/:id/export-pdf | Yes | — | Binary PDF stream (`Content-Type: application/pdf`) | Generate and stream PDF |
| POST | /api/reports/:id/send | Yes | `{ email?: string }` | `ReportDelivery` | Send report email |
| PUT | /api/reports/:id/rating | Yes | `{ rating: 'up'\|'down', section?: string, note?: string }` | `Report` | Rate AI narrative; `section` required when `rating = 'down'` |
| PUT | /api/reports/:id/share | Yes | `{ enabled: boolean }` | `Report` | Enable/disable shareable link |
| GET | /api/public/reports/:shareToken | No | — | Public report fields | Public view — HTTP 404 if not found or `shareEnabled = false` |
| GET | /api/team | Yes (Admin or Owner) | — | `TeamMember[]` | List team members |
| POST | /api/team/invite | Yes (Admin or Owner) | `{ email, name, role }` | `TeamMember` | Invite team member |
| PUT | /api/team/:memberId | Yes (Admin or Owner) | `{ role: 'admin'\|'analyst'\|'viewer' }` | `TeamMember` | Update role — HTTP 403 if target is owner |
| DELETE | /api/team/:memberId | Yes (Admin or Owner) | — | `{ success: true }` | Remove member — HTTP 403 if target is owner |
| GET | /api/referrals/me | Yes (Agency/Agency Pro) | — | `{ referralCode, referralsSent, converted, creditsEarned }` | Get referral stats |

---

## 9. PAGES & ROUTES

| Route | Page | Auth Required | Description |
|-------|------|---------------|-------------|
| `/` | Landing Page | No | Marketing page: headline, demo GIF, competitor comparison table, pricing, CTA |
| `/sign-in` | Sign In | No | Clerk sign-in component |
| `/sign-up` | Sign Up | No | Clerk sign-up component |
| `/sign-up?ref=:code` | Sign Up (Referred) | No | Sign up with referral attribution — `ref` param stored to `Agency.referredByCode` |
| `/onboarding` | Onboarding Wizard | Yes (incomplete onboarding) | 4-step wizard; redirected here until `onboardingCompletedAt` is set |
| `/dashboard` | Client Dashboard | Yes | Client table, tier usage bar, last report, next scheduled, status badges |
| `/clients/new` | Add Client | Yes | Slide-over panel; closes to `/dashboard` on save |
| `/clients/:id` | Client Detail | Yes | Client info, connectors, report history, delivery schedule |
| `/clients/:id/settings` | Client Settings | Yes | Edit profile, goals, email templates, schedule, archive |
| `/reports` | All Reports | Yes | Paginated report list across all clients |
| `/reports/:id` | Report Preview | Yes | Full report preview + control sidebar |
| `/connectors` | Data Connectors | Yes | Connector cards grid and connected accounts table |
| `/settings` | Agency Settings | Yes | Profile, logo, brand color, timezone, narrative tone, anomaly alerts |
| `/settings/billing` | Billing | Yes | Plan, trial status, billing date, upgrade/manage, referral code |
| `/settings/team` | Team | Yes (Admin or Owner) | Invite, list, manage team members |
| `/p/:shareToken` | Public Report | No | Client-facing shareable report — no ReportCraft AI chrome |
| `*` (catch-all) | 404 Not Found | No | "Page not found" with link to `/dashboard` (authenticated) or `/` |

---

## 10. UI/UX REQUIREMENTS

### 10.1 Design Principles

- **Desktop-first, mobile-responsive:** Primary work surface designed for 1280px+. All pages usable on tablets (768px+). Mobile (< 768px): simplified view with key actions, no full report preview.
- **Dark mode default with light mode toggle:** Default theme is dark (`#0F172A`). Toggle in topbar. Preference saved to `localStorage` key `'rc-theme'` (values: `'dark'` | `'light'`). All theme-reading code must use this exact key.
- **Data clarity over decoration:** Charts and metric cards communicate data first. Delta indicators (↑ / ↓) use both color AND directional arrows — never color alone (colorblind accessibility).
- **Zero-state guidance:** Every empty state (no clients, no reports, no connectors) shows a specific, actionable next step.
- **Inline error feedback:** Form errors appear below the specific field within 300ms of blur or submission. Toasts are for success confirmations only — never the sole error surface.
- **Keyboard accessibility:** All interactive elements reachable by keyboard. Tab order follows visual layout. Modal dialogs trap focus and restore it to the trigger element on close. All icon-only buttons include `aria-label`.
- **Predictable tier awareness:** Users must never be surprised by a limit. The dashboard always shows the tier usage counter. Trial countdown begins 7 days before expiry.

### 10.2 Color & Theme

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| Primary | `#6366F1` | `#6366F1` | CTAs, active nav, accents, progress bars |
| Primary Hover | `#4F46E5` | `#4F46E5` | Hover state |
| Background | `#0F172A` | `#F8FAFC` | Page background |
| Surface | `#1E293B` | `#FFFFFF` | Cards, panels, sidebars |
| Border | `#334155` | `#E2E8F0` | Dividers, card borders |
| Text Primary | `#F8FAFC` | `#0F172A` | Body text, headings |
| Text Secondary | `#94A3B8` | `#64748B` | Labels, captions |
| Success | `#22C55E` | `#16A34A` | Positive deltas, Connected status |
| Error | `#EF4444` | `#DC2626` | Negative deltas, error states |
| Warning | `#F59E0B` | `#D97706` | Trial ending, expiring tokens |

- **Typography:** Inter — self-hosted via `/public/fonts/inter/` (do not use Google Fonts CDN in production builds — CORS and CSP issues)
- **Component Library:** shadcn/ui generated into `apps/web/src/components/ui/` — do not edit these files manually. Apply customizations via Tailwind variant props or wrapper components.

### 10.3 Key UI Flows

**Flow 1: New User Generates First Report (Onboarding)**
1. User lands on `/sign-up`, creates account with Google SSO → redirected to `/onboarding`
2. Step 1: Enters agency name, uploads logo, selects brand color → "Continue"
3. Step 2: Enters client name and contact email → "Continue"
4. Step 3: Clicks "Connect Google Analytics" → popup opens Google consent → user approves → popup closes → "Connected" → "Continue"
5. Step 4: Selects "Last 30 Days" → "Generate First Report" → progress bar animates: "Fetching data… Analyzing performance… Writing narrative… Building report…" → 30–45 seconds
6. Redirected to `/reports/:id` — sees full report with agency logo, brand color, AI narrative — "Welcome!" toast appears

**Flow 2: Monthly Report Sent to Client**
1. Navigate to `/clients/:id`
2. Click "Generate Report" → "Last 30 Days" → "Generate" → progress indicator → ready in ~30–45 seconds
3. Preview report → thumbs-up rating
4. "Export PDF" → PDF downloads → review
5. "Send to Client" → email preview modal → "Send Now"
6. "Sent" toast → client list shows "Last Report: Today"

**Flow 3: Client Limit Hit — Upgrade**
1. Starter plan with 5/5 clients used (visible in the tier usage bar) → clicks "Add Client"
2. Upgrade modal: "You've reached your 5-client limit. Upgrade to Agency ($199/mo) for up to 15 clients." → "Not Now" or "Upgrade to Agency"
3. User clicks "Upgrade" → Lemon Squeezy checkout pre-filled with email → payment completes
4. LS webhook fires → within 5 seconds, account tier updates to `AGENCY`
5. Dashboard shows "5 of 15 clients used" — billing page shows "Agency Plan — Active"

**Flow 4: Trial Expiry**
1. 7 days before expiry: yellow banner on all authenticated pages: "Your free trial ends in 7 days. Upgrade now to keep access."
2. At expiry (midnight UTC at `Agency.trialEndsAt`): all write actions return HTTP 403
3. Attempting to generate a report → upgrade modal: "Your free trial has ended. Choose a plan to continue."
4. User subscribes → webhook fires → account status immediately returns to `active`

---

## 11. AUTHENTICATION & AUTHORIZATION

- **Auth Method:** Clerk JWT verified on every backend request via `clerkClient.verifyToken()`. No server-side sessions.
- **Frontend auth:** `<ClerkProvider>` wraps the React app root in `main.tsx`. `ProtectedLayout.tsx` via `useAuth()`: (1) `!isLoaded` → full-page spinner; (2) `isLoaded && !isSignedIn` → `<Navigate to="/sign-in" replace />`; (3) `isLoaded && isSignedIn` → render route. Never redirect before Clerk determines auth state.
- **Backend auth middleware:** Every Express route (except `/health`, `/api/webhooks/*`, `/api/public/*`) passes through `auth.middleware.ts`: (a) extract Bearer token from `Authorization` header; (b) `clerkClient.verifyToken()`; (c) look up `Agency` by `clerkUserId`; (d) attach `req.agencyId` and `req.teamMember`.
  - **Webhook recovery edge case:** Valid JWT + no Agency record → create minimal Agency on-the-fly → redirect to `/onboarding` → log WARN. See Feature 8.
- **Clerk `user.deleted` webhook:** (1) find `Agency` by `clerkUserId`; (2) cancel LS subscription if `lemonSqueezySubscriptionId` is set; (3) set `subscriptionStatus = 'cancelled'`. Agency data retained for 90 days. Return HTTP 200 always — prevent Clerk retry loops.

**Roles & Permissions:**

| Role | Client Mgmt | Report Generate | Report Send | Export | Connectors | Billing | Team |
|------|-------------|----------------|-------------|--------|------------|---------|------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analyst | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Viewer | ❌ (read only) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> Analyst can connect and disconnect data sources but cannot access billing settings or invite/remove team members.

---

## 12. ERROR HANDLING & EDGE CASES

- [ ] **Empty form submission:** Required fields show inline red errors on submission attempt. Form does not submit. No toast-only errors.
- [ ] **OAuth callback failure (user cancels consent):** Callback receives `error` query param → redirect to `/connectors` with toast: "Connection cancelled. Please try again." Clean up OAuth state.
- [ ] **OAuth token refresh failure:** Mark `OAuthToken.status = 'error'`; email agency owner: "Your [Platform] connection for [Client] has expired and needs to be reconnected." Connector card shows "Reconnect" in red.
- [ ] **AI narrative generation timeout:** `AbortController` cancels after 30 seconds per provider. Set `Report.status = 'error'`. Return: "Report generation timed out. Please try again." Do not leave report in `'generating'` state.
- [ ] **Both AI providers fail:** HTTP 500 with `{ error: "Narrative generation failed. Please try again." }` — log both failure reasons and error codes. During an extended OpenAI outage, all generation requests fall through to Anthropic simultaneously; Anthropic rate limits will be hit. See §16 Open Questions.
- [ ] **AI returns malformed JSON:** Retry once with a more constrained prompt. If second attempt fails, return error and log raw response. Never surface raw AI output.
- [ ] **Platform API unavailable (e.g., GA4 500):** Proceed with `Promise.allSettled` — generate report from sources that succeeded. Display a warning banner naming the failed platform(s). Each failed section shows an error placeholder with "Retry Data Fetch." Log HTTP status and error body.
- [ ] **Cross-agency resource access:** HTTP 403 with `{ error: "Forbidden" }` — do not reveal whether the resource exists.
- [ ] **Logo upload exceeds 2MB:** HTTP 400 before uploading to Cloudinary: `{ error: "File too large. Maximum size is 2MB." }`
- [ ] **PDF generation failure:** HTTP 500 with `{ error: "PDF generation failed. Please try again." }` — log full stack trace. Do not serve corrupted or partial PDF.
- [ ] **Report scheduled but connector token expired:** Skip automated send → email agency owner: "Automated report for [Client] was not sent because your [Platform] connection has expired. Please reconnect and send manually."
- [ ] **Duplicate report generation:** If same `clientId + dateRangeStart + dateRangeEnd` has `status = 'generating'`, return HTTP 409: "A report is already being generated for this client and date range."
- [ ] **Stale `generating` report (server crash recovery):** On server startup in `index.ts`, before `app.listen()`, run cleanup: reset any `Report` with `status = 'generating'` and `updatedAt < NOW() - INTERVAL '35 seconds'` to `status = 'error'`. Without this, a crash leaves reports permanently stuck in `'generating'`, causing every subsequent attempt to 409.
- [ ] **Trial expired — write action attempted:** HTTP 403 `{ error: "ACCOUNT_READ_ONLY", reason: "trial_expired" }`. Frontend shows upgrade modal.
- [ ] **Tier limit hit (AI reports/month):** HTTP 403 `{ error: "REPORT_LIMIT_REACHED", upgradeUrl: "..." }`. Frontend shows upgrade modal.
- [ ] **Downgrade client count conflict:** HTTP 400 `{ error: "CLIENT_LIMIT_EXCEEDED", activeClients: number, newLimit: number, excessClients: Client[] }`. Frontend shows archive-selection modal.
- [ ] **Resend email bounce:** `email.bounced` webhook → `ReportDelivery.status = 'bounced'`, store reason in `failureReason`. Do not send a notification email (prevents loops). "Retry" button allows manual resend.
- [ ] **Frontend network failure:** `fetch()` throws `TypeError: Failed to fetch` → persistent banner: "Unable to connect to the server. Please check your internet connection." Never silently fail or show a blank page.
- [ ] **Unknown Lemon Squeezy `variantId`:** Log `WARN` with full raw payload, return HTTP 200 immediately. Never update any Agency record. Never return non-200 to LS webhooks — LS retries indefinitely on non-200.
- [ ] **Rate limit exceeded (HTTP 429):** Frontend shows toast: "Too many requests — please wait a moment." Auto-retry after 5 seconds for non-destructive reads. Do not auto-retry report generation.
- [ ] **Clerk JWT expired mid-session (HTTP 401):** Call `getToken({ skipCache: true })`. If returns null, redirect to `/sign-in?reason=session_expired` which displays: "Your session has expired. Please sign in again."
- [ ] **Lemon Squeezy API unavailable (extended outage):** When the LS API is unreachable: (a) the upgrade CTA must redirect to a status-page URL (`https://status.lemonsqueezy.com`) rather than a broken checkout page; (b) new subscription webhook processing failures must be queued (LS retries automatically); (c) display a banner on the billing page: "Our payment provider is experiencing issues. Subscriptions and upgrades may be delayed — your access is not affected." Do not assume the subscription state has changed during an outage — wait for the webhook to resolve. Monitor LS status page from Day 1 via Railway alerts.

---

## 13. PERFORMANCE, SECURITY & COMPLIANCE

### 13.1 Performance Requirements

- [ ] React 18 app: LCP < 2.5 seconds on 10Mbps — React Query with stale-while-revalidate caching; measure with Vercel Speed Insights
- [ ] Report data fetch (GA4 + Google Ads + Meta + LinkedIn in parallel via `Promise.allSettled`): < 15 seconds for date ranges up to 30 days; each connector has an independent 12-second timeout
- [ ] AI narrative generation: < 45 seconds p95; logged per report in `Report.generationDurationMs`
- [ ] PDF export: < 10 seconds for a standard 5-section report
- [ ] Dashboard client table: < 1 second after initial data load — React Query with 60-second stale time; skeleton loader on first load only
- [ ] Neon cold-starts must never affect user-facing requests — enforced by `db-keepalive.job.ts`

### 13.2 Required Database Indexes

Define in `schema.prisma` using `@@index([...])`:

| Model | Index Fields | Query Justification |
|-------|-------------|---------------------|
| Client | `[agencyId]` | All client list queries |
| Client | `[agencyId, status]` | Active-only filter |
| Report | `[clientId]` | Report list per client |
| Report | `[agencyId]` | Report list across all clients |
| Report | `[agencyId, createdAt DESC]` | Report list sorted by date |
| Report | `[clientId, dateRangeStart, dateRangeEnd, status]` | Duplicate generation check |
| OAuthToken | `[agencyId]` | Connector list per agency |
| OAuthToken | `[agencyId, status]` | Cron jobs — active tokens only |
| ReportDelivery | `[reportId]` | Delivery status per report |
| ReportDelivery | `[agencyId]` | Agency-level delivery history |
| TeamMember | `[agencyId, removedAt]` | Active team member list |

### 13.3 Security Requirements

- [ ] All OAuth tokens encrypted at rest with AES-256-GCM using `ENCRYPTION_KEY` env var — never stored as plaintext
- [ ] `ENCRYPTION_KEY` lives only in `apps/server/.env` — never in `apps/web/.env`
- [ ] All inputs validated server-side with `zod` on every API route before processing
- [ ] CORS: Express configured for `FRONTEND_URL` only — no wildcard `*` in production
- [ ] Webhook HMAC verification: Clerk uses `svix`; Lemon Squeezy uses `crypto.timingSafeEqual` with HMAC-SHA256; Resend uses their webhook signing secret
- [ ] Express `helmet()` middleware: X-Content-Type-Options, X-Frame-Options, HSTS, CSP
- [ ] Rate limiting via `express-rate-limit`: (1) IP-based — 100 req/min for unauthenticated routes; (2) Agency-based — `keyGenerator: (req) => req.agencyId ?? req.ip` for authenticated routes; report generation limited to 10 req/min per agency. Both return HTTP 429 with `Retry-After` header.
- [ ] `Report.shareToken`: `crypto.randomBytes(32).toString('base64url')` — 256 bits of cryptographic randomness. Never use `Math.random()`, `Date.now()`, or sequential IDs as share tokens.
- [ ] PostHog initialized with `autocapture: false` — prevents capture of OAuth tokens, contact emails, credential inputs in form fields
- [ ] Output sanitization: AI-generated narrative HTML-escaped before rendering. Prefer structured JSON to typed fields — never render raw AI output as unescaped HTML.

### 13.4 Data, Privacy & GDPR Compliance

ReportCraft AI processes personal data including agency owner emails, client contact details (names, emails), and advertising performance data belonging to the agency's clients. The following requirements apply for all users, and are especially relevant for EU-based agencies.

**Data residency:** All data stored in the US (Neon on AWS US-East, Cloudinary US region). EU agencies must be informed in the Privacy Policy before signup. EU data residency is deferred to Phase 2.

**Third-party data processors (all require DPA):**

| Processor | What They Process | DPA Reference |
|-----------|-------------------|---------------|
| Neon | Database contents incl. encrypted OAuth tokens, client contact data, report data | neon.tech/legal/dpa |
| Cloudinary | Agency logos and (Phase 2) PDF files | Cloudinary legal portal |
| OpenAI | Normalized ad performance metrics (NOT raw credentials or PII) | openai.com/policies/data-processing-addendum |
| Anthropic | Same as OpenAI when used as fallback | Anthropic enterprise legal page |
| Resend | Client contact email addresses for report delivery | Resend legal/DPA |
| Clerk | Agency owner and team member identities | Clerk legal/DPA |
| Lemon Squeezy | Billing information as Merchant of Record | LS legal portal |

**What is never sent to AI providers:** OAuth tokens, billing information, client passwords or credentials, PII beyond what is required in the prompt context. Only normalized aggregate metric numbers (e.g., `{ sessions: 12400, ctr: 0.023, ... }`) are sent.

**Data retention:** Agency data retained for minimum 90 days after cancellation. OAuth tokens deleted immediately on disconnect. Hard deletion after 90 days via a scheduled cleanup job (Phase 2).

**Right to deletion:** `user.deleted` webhook cancels subscription; full data deletion is performed 90 days post-cancellation. Document the 90-day window in the Privacy Policy.

**Required before beta launch:** Privacy Policy (`/privacy`) and Terms of Service (`/terms`) must be live. Use GDPR-compliant templates (Termly, iubenda) customized to reflect the above processor list.

---

## 14. OUT OF SCOPE (v1.0)

Explicitly deferred — named so future scope discussions have a shared vocabulary:

| Feature | Target Phase | Notes |
|---------|-------------|-------|
| **YouTube Analytics connector** | Phase 2 (Week 8) | High demand from agencies managing organic video alongside paid. Reserve `'youtube_analytics'` in `OAuthToken.platform` enum. |
| **Google Search Console (SEO) connector** | Phase 2 (Week 8) | Critical for PPC/SEO agencies who manage both paid and organic search. Reserve `'google_search_console'` in enum. |
| **TikTok Ads connector** | Phase 2 | Reserve `'tiktok_ads'` in enum; API access requires TikTok for Business approval similar to LinkedIn MDP. |
| **PDF persistent storage + signed URL** | Phase 2 | Cloudinary `reportcraft/pdfs/` path; 7-day signed delivery URL. v1.0 streams directly. |
| **Client portal with client auth** | Phase 2 | The shareable link (Feature 10) is read-only and unauthenticated. A full client-facing portal with login, comment threads, and approval flows is Phase 2. |
| **White-label custom domain** | Phase 2 | `reports.agencyname.com` — requires DNS CNAME setup and per-agency SSL provisioning. |
| **Report templates** | Phase 2 | Agencies choosing from multiple PDF layouts (Executive, Detailed, Summary). MVP uses one fixed professional template. |
| **AI Competitive Benchmarking** | Phase 3 | Comparing client metrics against industry benchmarks (e.g., "your GA4 bounce rate is 12% below the e-commerce average"). Requires building benchmark data sets. |
| **EU data residency** | Phase 2 | Neon EU region + Cloudinary EU region. |
| **Hard data deletion on cancellation** | Phase 2 | MVP retains data 90 days; scheduled cleanup job is Phase 2. |
| **`packages/types` shared TypeScript** | Phase 2 | Graduate to shared types only when cross-package type drift causes a real bug. |
| **Server-side PostHog tracking** | Phase 2 | Frontend-only for MVP. |
| **Zapier / API integration** | Phase 3 | External workflow automation. |
| **Multi-currency billing** | Phase 3 | LS as MoR handles VAT/GST automatically; explicit multi-currency display is deferred. |

---

## 15. IMPLEMENTATION ORDER

Build in this strict sequence. Each phase unlocks the next.

### Phase 1: Foundation (Weeks 1–2)
1. pnpm monorepo scaffold: `apps/web` (Vite + React 18 + Tailwind + shadcn/ui), `apps/server` (Express + TypeScript + Prisma)
2. Neon PostgreSQL connection; Prisma schema (all models including `referralCode` and `referredByCode` on Agency); initial migration
3. **`db-keepalive.job.ts`** — implement immediately after DB setup; do not deploy without it
4. Clerk auth: `ClerkProvider` in frontend; `verifyToken()` middleware; `ProtectedLayout.tsx` (all three states); `user.created` webhook + Agency creation; webhook recovery fallback
5. PostHog: init with `autocapture: false`; `identify()` on auth; `agency_created` event
6. `GET /health`: process liveness only — no DB query

### Phase 2: Core Product (Weeks 3–5)
7. Cloudinary: `storage.service.ts`; logo upload endpoint; `lib/cloudinary.ts`
8. Onboarding wizard (Feature 8): all 4 steps; step validation; progress bar; redirect logic
9. Client Management (Feature 6): CRUD; tier enforcement; slide-over panel; tier usage bar
10. OAuth Connectors (Feature 1): Google (GA4 + Ads); Meta — OAuth flow; callback; token encryption; connector cards
11. Report Builder (Feature 3): `Promise.allSettled` data fetch; `Report.rawData` caching; date range selector; preview layout; stale-generating cleanup on startup
12. AI Narrative Engine (Feature 2): prompt chain with cross-channel correlation signals; OpenAI primary + `claude-3-5-sonnet-20241022` automatic fallback; five-section JSON parsing; narrative rating with section attribution
13. PostHog events: `connector_connected`, `report_generated`

### Phase 3: Delivery & Monetization (Week 6)
14. PDF Export (Feature 4): react-pdf parallel component tree; `pdf-charts.service.ts` with SVG primitives (bar + line); Inter font registration; tier-based branding; binary stream response
15. Email Delivery (Feature 5): Resend; React Email template; per-client schedule with luxon timezone resolution; `report-scheduler.service.ts`; `scheduled-reports.job.ts` cron
16. Billing (Feature 7): LS checkout redirect; full webhook handler for all subscription events; state machine; trial countdown banner; `past_due` banner; downgrade flow with archive-selection modal; read-only mode enforcement; LS outage error handling (§12)
17. PostHog events: `report_exported`, `report_sent`, `upgrade_clicked`

### Phase 4: Growth Features (Weeks 7–9)
18. LinkedIn Ads Connector (Feature 9): **begin implementation only after MDP Standard Tier is granted** — Development Tier (5-account cap) is suitable for QA only
19. Client Portal / Shareable Link (Feature 10): `shareToken` generation; public report route; revocation
20. Anomaly Detection (Feature 11): weekly cron; metric comparison; email alerts
21. Multi-User Team Access (Feature 12): invite flow; role enforcement in middleware; team management UI
22. Referral Program (Feature 14): referral code generation at first paid activation; `ref` signup param; `subscription_created` webhook handler for credit issuance; referral stats API + billing page UI

### Phase 5: Launch Readiness
23. Resend webhook handler: bounce tracking, open tracking
24. Lemon Squeezy `user.deleted` subscription cancellation
25. Error tracking: Sentry (or equivalent) integrated in both `apps/web` and `apps/server` — required before public launch
26. Privacy Policy and Terms of Service live at `/privacy` and `/terms`
27. End-to-end testing of all critical paths
28. Railway deployment: `railway.toml` with `prisma migrate deploy` pre-deploy hook
29. Vercel deployment: `vercel.json` with SPA rewrite rules
30. Rate limiting in production: verify IP-based and agency-based limiters under realistic load

### Phase 6: Phase 2 Features (Weeks 10+)
31. YouTube Analytics connector
32. Google Search Console (SEO) connector
33. PDF persistent storage + Cloudinary signed URLs
34. Full client portal with login (Phase 2 of Feature 10)
35. White-label custom domain

---

## 16. OPEN QUESTIONS

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | **Sentry pricing:** Which Sentry plan for launch-scale error volume? Estimated: $26/mo Team plan (100K errors/month). | Engineering | Open |
| 2 | **LinkedIn MDP status:** Has the application been submitted? What is the current review status? This directly determines whether Feature 9 can be included at launch. | Founder | Open |
| 3 | **Downgrade archive selection UX:** When downgrading from 15 clients to 5, does the user manually pick which 5 to keep, or is it alphabetical default? | Product | Open |
| 4 | **Trial credit card requirement:** No credit card required at signup (current spec). Revisit after 30 days of data — CCR at signup increases conversion-day quality but reduces top-of-funnel volume. | Founder | Open |
| 5 | **Structured Outputs cold-start risk:** Migrating from `response_format: { type: "json_object" }` (JSON Mode) to `response_format: { type: "json_schema", ... }` (Structured Outputs) requires pre-production benchmarking. First-call schema compilation latency can reach 60 seconds, which would breach the 45-second SLA. Do not migrate without a dedicated benchmark run. | Engineering | Open — do not migrate without explicit approval |
| 6 | **Anthropic rate limit exhaustion during extended OpenAI outages:** When OpenAI experiences a systemic outage (as in December 2024 — 9 hours, and June 2025 — 12+ hours), all report generation attempts across all users simultaneously fall through to Anthropic. At MVP scale this is manageable. Evaluate a per-agency fallback queue with exponential backoff before the product reaches 200+ agencies. | Engineering | Open — revisit at $20K MRR |
| 7 | **Lemon Squeezy long-term independence:** LS was acquired by Stripe in July 2024 and is transitioning to "Stripe Managed Payments." Begin migration contingency analysis (Paddle or Stripe + Stripe Tax) when MRR exceeds $20,000. | Founder | Open — revisit at $20K MRR |
| 8 | **PDF attachment size:** Resend supports up to 40MB total attachment size. Standard 5-section report estimated at 0.5–2MB. Add a server-side check: if PDF exceeds 10MB, warn the agency owner and offer a download link instead of an attachment. | Engineering | Open |
| 9 | **YouTube Analytics API quota:** The YouTube Analytics API has a default daily quota of 10,000 units per project. For agencies with many clients generating reports on the same day, this may require a quota increase request to Google. Investigate before Phase 6 build. | Engineering | Open — Phase 2 |

---

## 17. GO-TO-MARKET STRATEGY

This section captures the validated distribution and launch strategy from the pre-build market research. It belongs in the PRD so the entire team operates from the same plan and development sequencing is aligned with launch timing.

### 17.1 Positioning Statement

*"For marketing agency owners and account managers who lose an entire working day every week to manual client reports, ReportCraft AI is an agency reporting platform that automatically connects your client data sources and writes the insight narrative — not just the dashboard — so you send a polished, client-ready report in 15 minutes instead of 15 hours. Unlike AgencyAnalytics, DashThis, and Whatagraph, which describe what changed in your data, ReportCraft AI explains why it changed across channels and tells you exactly what to do next."*

This positioning must survive being fact-checked by an agency owner who has used the competitor products. It is anchored on analytical depth (cross-channel correlation + causal explanation), not the mere existence of AI narrative — all three competitors now have AI summary features.

### 17.2 Pricing Anchor

AgencyAnalytics Agency plan: $229/mo for 10 clients, no AI cross-channel analysis. ReportCraft AI Agency plan: $199/mo for 15 clients, full white-label, unlimited AI reports with cross-channel correlation. The anchor is defensible on both price (–13%) and client count (+50%) and AI depth.

### 17.3 First 10 Customers (Warm Network)

The fastest path to the first 10 paying customers is the existing client network (29 past clients). Identify contacts who: (a) are digital marketing agencies; (b) mentioned reporting pain during previous engagements; (c) currently use AgencyAnalytics, DashThis, or a manual workflow. Send a personalized 4-sentence email referencing their specific pain:

*"Hi [Name], we just shipped something based on the reporting headache you mentioned when we worked together — an AI that writes the 'what does this mean and what should we do' section of your client reports. The part that takes you 60–90 minutes per client. We're offering our first 10 beta users free access for 60 days in exchange for 30 minutes of weekly feedback. Want to be one of them?"*

Do not send this as a mass email. Personalize each one. Track responses within 5 business days.

**Target client types to email first:**
1. Digital marketing agencies the team built analytics dashboards or ad integrations for
2. E-commerce brand founders running paid ads who need investor/board reporting
3. Growth consultants / fractional CMOs managing multiple client accounts
4. PPC or SEO agencies managing Google and/or Meta campaigns as core services
5. Web/dev agencies that also manage client analytics as an ongoing retainer

### 17.4 Build-in-Public Content Engine (Weeks 1–10)

Post 5× per week on X during the build. Specific high-performing content angles for this product:

1. **"The 15-hour problem"** — Lead with the stat: "Marketing agencies spend 20% of their week on manual reporting. We're building the fix." Attach a Figma mockup.
2. **"Building the Meta Ads OAuth connector"** — Real code post: "Took 6 hours to get Meta's OAuth working. Here's the exact error we hit and how we fixed it." Builds developer credibility and attracts agency technical leads.
3. **"The prompt that writes a marketing report"** — Share the redacted prompt chain that turns GA4 data into a narrative. "Prompt engineering thread for agency owners."
4. **"We showed 10 agency owners our prototype"** — Qualitative post about discovery calls: what they said, what surprised us, what we're changing. Social proof before launch.
5. **"Agency report before and after"** — Side-by-side: 3-hour Google Slides manual report vs. ReportCraft AI PDF. Visual, shareable, drives DMs.
6. **"Why AgencyAnalytics is winning — and exactly where the gap is"** — Honest competitor analysis post. Drives organic search clicks and positions the founding team as thoughtful analysts, not just builders.
7. **"Day 21: We launched. Here are our first 5 customers and what they said"** — Launch day thread with screenshot testimonials (with permission) and first conversion data.

### 17.5 First 100 Customers (Content + Community)

- **SEO:** Target low-competition, high-intent keywords: "AgencyAnalytics alternative," "AI marketing report generator," "automated client reporting tool." Three long-form posts targeting these terms, live by Week 7.
- **Reddit:** Answer questions in r/PPC, r/SEO, r/marketing authentically. Mention the tool only when directly relevant. Do not spam.
- **Product Hunt:** Launch in Week 6 (Month 2) after the first 10 paying customers can provide testimonials and at least one case study with specific time-saved data.
- **Cold email:** Build a list of 500 agencies from LinkedIn (agency.com domains, 2–15 employees, "founder" or "owner" title). Personalize using visible client count or niche: "I saw you're running Google Ads for e-commerce clients — we built a tool that writes your monthly reports in 15 minutes instead of 15 hours."
- **Agency newsletter sponsorships:** Small newsletters covering PPC/SEO for agencies typically have $200–$500 sponsorship slots. Negotiate on value-exchange (case study write-up) before spending cash.
- **Referral program activation (Week 8):** Once Feature 14 is live, announce the referral program to existing paying customers: "Refer another agency and get 1 month free. They get 14 days free trial." Attribution is automatic via the `?ref=` URL parameter.

### 17.6 Week-by-Week Build + Launch Timeline

| Period | Build Focus | GTM Focus | Target |
|--------|------------|-----------|--------|
| Week 1–2 | Foundation, auth, Neon, PostHog | Landing page live, 29-client emails sent, 10 discovery calls booked | 5+ positive beta interest responses |
| Week 3–4 | Core product: connectors, report builder, AI narrative | 10 discovery calls completed, 5 pre-sale commitments | 5 beta commitments |
| Week 5 | PDF export, email delivery, billing | Private beta to 10 agency contacts | First paying customer |
| Week 6 | LinkedIn connector (if MDP approved), anomaly detection | Product Hunt launch + X/IH coordination + cold email blast | 25 paying customers, $2,500 MRR |
| Week 7 | SEO content (3 articles), client portal view, bug fixes | First SEO articles live, referral program in development | $3,000 MRR |
| Week 8 | Referral program (Feature 14), team access (Feature 12) | Announce referral program to existing customers | $4,000–$5,000 MRR |
| Week 9–10 | YouTube + Search Console connectors (Phase 2 prep) | Agency partnership outreach (3 white-label tools), second cold email batch (500 contacts) | $8,000–$10,000 MRR |

---

## 18. VALIDATION CRITERIA & KILL SIGNALS

This section defines explicit go/no-go thresholds for each major phase. A team that has defined kill signals before a launch does not rationalize failure — it acts on it.

### 18.1 Pre-Build Validation (This Week — Before Writing Code)

**Experiment:** Email all 29 past clients + post on X + run $200 Twitter/X ads targeting "marketing agency owner" + "PPC agency" + "SEO agency" keywords pointing to a landing page with a 60-second Loom demo and a Calendly link. Budget: ~$300 total.

**Go signal:** 3 agency owners pre-pay for 3 months (≥$237 each) by Day 7, OR 15 agency owners sign up for a free trial on the first beta release.

**No-go signal:** Fewer than 3 positive responses to 50+ outreach attempts. If this happens, the problem is real but the positioning is wrong — test a different ICP (larger agencies, a specific vertical like PPC agencies) before building.

### 18.2 Kill Criteria by Phase

| Phase | Timeframe | Kill Signal | Interpretation | Response |
|-------|-----------|------------|----------------|----------|
| Beta | Day 30 | Fewer than 5 paying customers despite 50+ demos | Problem is real but ICP or positioning is wrong | Pivot the ICP: try larger agencies (20–50 person shops) or a specific vertical (PPC-only agencies) |
| Early Growth | Day 60 | Churn exceeds 30% of trial users | Product is not delivering promised time savings | Pause growth; invest in onboarding quality, connector reliability, and AI narrative depth before growing |
| Growth | Day 90 | Stuck below $3K MRR despite strong trial-to-paid conversion (>30%) | Distribution channel is wrong | Double down on cold email and SEO; reduce dependence on organic X posts |
| Scale | Day 120 | Churn exceeds 15% of paying customers monthly | Retention problem — product is not sticky | Deep customer interviews; likely missing a key integration or the AI narrative is not meeting quality bar |

### 18.3 Assumptions to Test in Discovery Calls (Before Code, Not After)

Before the team writes a single line of code, 10 discovery calls must validate or invalidate the following assumptions:

1. **"Agency owners will pay for AI-generated narrative, not just dashboards."** In the call, show the current AgencyAnalytics AI Summary and ask: "Is this good enough, or would you pay for something smarter?" If 7/10 say "this is good enough," kill the AI narrative wedge and pivot to connector + white-label price angle.

2. **"Setup complexity is a real switching barrier."** Ask: "How long did your current reporting tool take to set up?" If the answer is "10 minutes," speed is not a differentiator. If the answer is "2 days and it still breaks," speed is the wedge.

3. **"Agencies will commit to a 14-day free trial without a credit card."** Ask: "Would you try a tool for 14 days with no credit card required?" If 8/10 say yes, keep the no-CC trial. If more than 3/10 say they'd prefer to pay a small amount to ensure access, test a $1 trial.

4. **"The existing 29-client network includes at least 3 marketing agencies."** Audit the network now. If fewer than 3 are digital marketing agencies, the warm-network GTM relies on secondary connections — add 2 weeks to the first 10 customer target.

---

## 19. GLOSSARY

| Term | Definition |
|------|-----------|
| Agency | A ReportCraft AI account representing a marketing agency. One Agency record per signup. All clients, reports, and connectors belong to an Agency. |
| Client | A brand or business whose advertising performance is managed by the Agency. Each Client has its own data connectors, report history, and delivery schedule. |
| Connector | An authenticated OAuth connection to a third-party platform (GA4, Google Ads, Meta Ads, LinkedIn Ads, YouTube Analytics, Google Search Console). One connector can be assigned to multiple clients. |
| Insight Write | ReportCraft AI's proprietary name for the AI-generated strategic narrative section of the report. Consists of five sub-sections: Executive Summary, Campaign Performance, Key Wins, Areas of Concern, Recommendations. Differentiated by cross-channel correlation analysis — explaining why metrics moved, not just that they moved. |
| Cross-Channel Correlation | The Insight Write's core analytical capability: identifying causal relationships across data sources (e.g., Meta creative frequency increase → CTR drop AND simultaneous GA4 bounce rate increase from paid traffic). No competitor at sub-$200/mo tier provides this level of automated cross-channel causal analysis. |
| FREE_TRIAL | Initial state for all new agencies. 14 days. Agency-tier feature limits. No credit card required. Transitions to a paid tier on subscription, or read-only mode on expiry. |
| Read-Only Mode | Account state where viewing actions are permitted but all write actions (generate report, add client, send email, change settings) are blocked with HTTP 403. Triggered by: trial expiry without subscription, or `past_due` exceeding 3 days. |
| Narrative Tone | Writing style for the AI narrative. Three options: **Professional** (formal, data-driven), **Conversational** (warm, accessible, first-person), **Executive** (concise, strategic, C-suite-focused). Stored per Agency as default; overridable per report. |
| Tier | Subscription level: FREE_TRIAL, STARTER ($79/mo), AGENCY ($199/mo), AGENCY_PRO ($349/mo). |
| Share Token | A 256-bit cryptographically random URL-safe string (`crypto.randomBytes(32).toString('base64url')`) granting public access to a specific report. Generated on first enable, not at report creation time. |
| MDP | LinkedIn Marketing Developer Platform — the approval process required to access LinkedIn's Ads API. Standard access takes 2–4 weeks. If rejected, the same app ID cannot be resubmitted — a new app must be created. Development Tier is capped at 5 ad accounts for write operations. |
| Development Tier (LinkedIn) | The initial LinkedIn API access level granted after MDP application. Supports unlimited GET (read) operations but limits POST (write/manage) operations to 5 ad accounts. Sufficient for QA but not production. Standard Tier (unlimited) requires a secondary approval after the integration is built and tested. |
| Referral Code | A unique short code (e.g., `ALEX-XF4K`) assigned to each Agency on a paid plan. When a referred user signs up via `?ref=[code]` and converts to paid within 30 days, the referring agency earns 1 month of subscription credit. |
| OAuth 2.0 | The authorization protocol used to connect advertising platforms. The user grants permissions on the platform's consent screen; the server stores the resulting access and refresh tokens encrypted in the OAuthToken table. |
| Neon Cold-Start | A 1.8–5 second delay when Neon serverless PostgreSQL compute resumes after auto-suspension. Mitigated by `db-keepalive.job.ts`. Never affects user-facing requests when the keep-alive job is running. |
| react-pdf SVG Primitives | The `<Svg>`, `<Path>`, `<Rect>`, `<Polyline>`, `<Text>` components in `@react-pdf/renderer` for vector graphics in PDF documents. Distinct from browser SVG elements — cannot be mixed with DOM-based chart libraries like Recharts. |
| `Promise.allSettled` | JavaScript method that runs multiple promises in parallel and resolves with all results regardless of individual rejections. Used for parallel data fetching across ad platforms — one failure does not cancel others. |
| Delta | Percentage change between current and prior period: `((current - previous) / previous) × 100`, 1 decimal place. Displayed with directional arrows (↑ / ↓) and color (green / red) — both required for colorblind accessibility. |
| Stale-While-Revalidate | React Query caching strategy where cached data is displayed immediately while a background refetch runs. Prevents loading spinners on repeat navigations. |
| Cron Expression | String defining a scheduled task's run frequency (e.g., `"0 9 * * 1"` = every Monday at 9:00am). Stored in `Client.reportSchedule` in the client's local timezone and resolved to UTC at runtime using `luxon`. |
| HMAC-SHA256 | Hash-based Message Authentication Code using SHA-256 — used to sign OAuth state parameters and verify webhook payloads from Clerk, Lemon Squeezy, and Resend. Prevents CSRF on OAuth callbacks and ensures webhook authenticity. |
| DPA | Data Processing Agreement — legal contract between a data controller (ReportCraft AI) and a data processor (Neon, Cloudinary, OpenAI, etc.) specifying how personal data is handled. Required under GDPR Article 28. |
| Past-Due Grace Period | 3-day window after a failed subscription payment during which the agency retains full access. A persistent banner prompts payment update. After 3 days without payment recovery, the account enters read-only mode. |
| JSON Mode | OpenAI's `response_format: { type: "json_object" }` — guarantees a JSON-parseable response without requiring a schema. Used in v1.0. Do not confuse with Structured Outputs, which carries a first-call 60-second schema compilation latency. |

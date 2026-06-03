---
name: PRD audit v3 gaps
description: All gaps found and fixed during the full PRD v3.0 audit — error codes, encryption, routes, webhook events, ReportPreview controls.
---

# PRD v3.0 Audit — Gaps Fixed

**Why:** Full codebase audit vs PRD — documents non-obvious decisions for future consistency.

## Error code: ACCOUNT_READ_ONLY (not READ_ONLY_MODE)
- `readonly.middleware.ts` must return `error: 'ACCOUNT_READ_ONLY'` (PRD §11)
- Was: `READ_ONLY_MODE` — fixed all 3 occurrences

## GET /api/reports/:id must include agency
- The `agency` relation must be included (select: name, brandColor, logoUrl, narrativeTone)
- Without it, ReportPreview falls back to default brandColor `#6366F1` — the agency branding never shows

## ENCRYPTION_KEY — 64-char hex support
- PRD §5.3 specifies the key as a 64-char hex string (= 32 bytes)
- `encryption.ts` now detects `/^[0-9a-fA-F]{64}$/` and uses `Buffer.from(key, 'hex')`
- Shorter/non-hex strings fall back to utf8 padded to 32 chars (backward compat)
- Dev-only default key logs a console.error in production

## Missing route: /clients/new
- App.tsx was missing this route (PRD §9)
- Added `NewClient.tsx` page at `client/src/features/clients/pages/NewClient.tsx`
- On success, redirects to `/clients/:id`; on CLIENT_LIMIT_EXCEEDED shows UpgradeModal

## ReportPreview sidebar additions (PRD §6.3)
- Added `ToneSelector` segmented control (professional / conversational / executive)
  - Calls `reportsApi.regenerate(id, newTone)` when changed
- Added `DateRangeSelector` with 7d / 30d / 90d presets + custom date pickers
  - Creates a NEW report via `reportsApi.create(...)` then navigates to the new report
- Renamed "Regenerate AI" → "Refresh Data" (same endpoint; clearer intent)
- Sidebar now also shows date range and aiModel in Info section

## Webhook: order_refunded
- Added `order_refunded` Lemon Squeezy event → sets `subscriptionStatus: 'cancelled'`, `subscriptionTier: 'FREE_TRIAL'`

## .env.example files
- Both `server/.env.example` and `client/.env.example` already existed; updated ENCRYPTION_KEY comment to say "64-char hex, generate with openssl rand -hex 32"

## Schema indexes — all present
- All PRD §13.2 indexes are in the schema: Client[agencyId], Client[agencyId,archivedAt], OAuthToken[agencyId,status], Report compound indexes, ReportDelivery[clientId,agencyId], TeamMember[agencyId,role]

## Stale report cleanup — already implemented
- `startStaleReportCleanup()` is called in `index.ts` on startup; resets generating reports older than 35s to error

---

## Third-pass gaps (all implemented)

**429 auto-retry in api.ts:** intercepts 429 → toast + auto-retry GET after 5s. Never retries writes. `react-hot-toast` imported directly in `api.ts`.

**user.deleted LS cancellation (webhooks.ts):** calls `fetch(.../subscriptions/:id, DELETE)` with `LEMONSQUEEZY_API_KEY` before setting `subscriptionStatus: 'cancelled'`. Error caught and logged, status update still proceeds.

**?ref= capture in SignUp.tsx:** uses `useSearchParams()`, stores `ref` param to `sessionStorage('rc_ref_code')` in `useEffect`. Onboarding already reads this key.

**Delivery history + Retry button in ClientDetail.tsx:** `DeliveryHistory` sub-component at bottom of right column. Fetches `clientsApi.getDeliveries(clientId)`. Shows table: sentAt, status, openedAt. Retry button (for `failed`/`bounced`) calls `reportsApi.send(delivery.reportId)`.

**Downgrade guard — new billing router:** `server/src/routes/billing.ts` mounted at `/api/billing`:
  - `GET /ls-status` — hits LS API with 5s timeout, returns `{ available: bool }`
  - `POST /check-downgrade` — counts active clients, returns `CLIENT_LIMIT_EXCEEDED` + `excessClients[]` if over new limit
  Tier limits: STARTER=5, AGENCY=15, FREE_TRIAL/AGENCY_PRO=∞
  `Billing.tsx` calls `checkDowngrade` before any "Switch" that reduces tier. Shows `DowngradeModal` with checkboxes → archives selected → re-checks → opens LS checkout.

**LS outage banner in Billing.tsx:** `LsOutageBanner` queries `billingApi.getLsStatus()` (staleTime 2min). Shows yellow banner + link to status.lemonsqueezy.com when `available === false`.

**billingApi added to api.ts:** `getLsStatus()` and `checkDowngrade(newTier)`.

---

## Fourth-pass gaps (all implemented)

**PDF attachment in sendReportEmail (reports.ts):** dynamically imports `generatePDF`, generates buffer, attaches via Resend `attachments: [{ filename, content: pdfBuffer }]`. PDF failure is caught + logged — email still sends without attachment rather than failing entirely. Email body template now respects `client.emailBodyTemplate` with `{client}`, `{contact}`, `{date}` substitutions.

**LinkedIn "Coming Soon" connector card (Connectors.tsx):** `PLATFORMS` array has `comingSoon: true` on `linkedin_ads`. Card rendered with muted border, descriptive copy ("MDP Standard Tier API approval in review"), clock icon badge, and a disabled "Coming Soon" button. The `handleConnect` guard still exits early for LinkedIn without showing a toast.

**`connector_connected` PostHog on callback (Connectors.tsx):** `useEffect` on mount reads `?success=platform` query param via `useSearchParams`. Fires `trackEvent('connector_connected', { platform: success })` and `toast.success(...)` on success, fires `toast.error(...)` with human-readable message on `?error=...`. Clears both params from URL with `setSearchParams({}, { replace: true })`. Previously fired on OAuth start — now fires only on actual callback completion.

**Client paused status + anomaly alerts toggle (ClientSettings.tsx + clients.ts):** Added `status: z.enum(['active', 'paused']).optional()` to `updateClientSchema`. UI has Pause/Resume button (yellow/green border) that calls `clientsApi.update(id, { status })`. Anomaly alerts toggle calls `clientsApi.update(id, { anomalyAlertsEnabled })` and shows Bell/BellOff icon. "Paused" badge appears in the header when client is paused.

**"Connect [Platform]" CTA in ReportPreview:** Each platform section (GA4, Google Ads, Meta Ads) now shows a `ConnectPlatformCTA` dashed-border card if that platform has no `rawData`, instead of just hiding the section. Card links to `/connectors`. Not shown while report is generating.

**report_exported PostHog — already existed (line 252):** `trackEvent('report_exported', ...)` was already firing in `handleExportPdf`. No change needed.

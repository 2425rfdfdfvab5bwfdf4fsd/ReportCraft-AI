import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, Image,
  Svg, Rect, Circle, Defs, LinearGradient, Stop, G, Line,
} from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';

/* ════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
════════════════════════════════════════════════════════ */

const A4_W        = 595;
const COVER_BAND  = 315;   // height of brand-colored top band on cover
const PAGE_H_PAD  = 44;
const PAGE_V_PAD  = 52;

function fmt(v: number | undefined | null, dec = 0): string {
  if (v == null || isNaN(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDur(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

type Delta = { label: string; isPos: boolean; isNA: boolean };
function calcDelta(cur: number, prev: number): Delta {
  if (!prev) return { label: 'N/A', isPos: true, isNA: true };
  const pct = ((cur - prev) / prev) * 100;
  return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, isPos: pct >= 0, isNA: false };
}

/* ════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════ */

const S = StyleSheet.create({
  /* ── Cover ── */
  coverPage:         { padding: 0, backgroundColor: '#ffffff' },
  coverBand:         { width: A4_W, height: COVER_BAND, position: 'relative', overflow: 'hidden' },
  coverBandContent:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 48, paddingTop: 44, flexDirection: 'column', justifyContent: 'space-between' },
  coverLogo:         { height: 26, maxWidth: 130, objectFit: 'contain' },
  coverAgencyText:   { fontSize: 12, color: '#ffffff', fontFamily: 'Helvetica-Bold', letterSpacing: 0.3 },
  coverLabel:        { fontSize: 8.5, color: 'rgba(255,255,255,0.55)', fontFamily: 'Helvetica', letterSpacing: 2.8, textTransform: 'uppercase', marginBottom: 12 },
  coverClient:       { fontSize: 33, color: '#ffffff', fontFamily: 'Helvetica-Bold', lineHeight: 1.08 },
  coverDate:         { fontSize: 10.5, color: 'rgba(255,255,255,0.65)', fontFamily: 'Helvetica', marginTop: 10 },
  coverMeta:         { paddingHorizontal: 48, paddingTop: 32, paddingBottom: 36, flex: 1, flexDirection: 'column', justifyContent: 'space-between' },
  coverMetaRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  coverMetaLabel:    { fontSize: 7.5, color: '#94A3B8', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, width: 88 },
  coverMetaValue:    { fontSize: 9.5, color: '#1E293B', fontFamily: 'Helvetica', flex: 1 },
  coverTagRow:       { flexDirection: 'row', gap: 8, marginTop: 2 },
  coverTag:          { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  coverTagText:      { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1.2 },
  coverBottomBar:    { height: 5, position: 'absolute', bottom: 0, left: 0, right: 0 },

  /* ── Content Page ── */
  contentPage:       { paddingHorizontal: PAGE_H_PAD, paddingTop: 62, paddingBottom: PAGE_V_PAD, backgroundColor: '#ffffff' },

  /* ── Running Header (fixed) ── */
  runHeader:         { position: 'absolute', top: 0, left: 0, right: 0 },
  runHeaderBar:      { height: 3 },
  runHeaderRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: PAGE_H_PAD, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  runHeaderLeft:     { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.6 },
  runHeaderRight:    { fontSize: 7.5, fontFamily: 'Helvetica', color: '#94A3B8' },

  /* ── Running Footer (fixed) ── */
  runFooter:         { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: PAGE_H_PAD, paddingBottom: 14 },
  runFooterLine:     { height: 0.5, backgroundColor: '#E2E8F0', marginBottom: 7 },
  runFooterRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  runFooterText:     { fontSize: 7, color: '#94A3B8', fontFamily: 'Helvetica' },

  /* ── Section Heading ── */
  sectionWrap:       { marginTop: 22, marginBottom: 10 },
  sectionRow:        { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  sectionDot:        { width: 9, height: 9, borderRadius: 5 },
  sectionTitle:      { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionRule:       { height: 1 },

  /* ── Platform Summary Table ── */
  tableWrap:         { marginBottom: 20 },
  tableHead:         { flexDirection: 'row', backgroundColor: '#F1F5F9', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginBottom: 1 },
  tableHeadCell:     { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.6 },
  tableRow:          { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  tableCellPlatform: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0F172A', flex: 2 },
  tableCellMetric:   { fontSize: 8.5, fontFamily: 'Helvetica', color: '#334155', flex: 1.5, textAlign: 'right' },
  tableCellDeltaPos: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16A34A', flex: 1, textAlign: 'right' },
  tableCellDeltaNeg: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#DC2626', flex: 1, textAlign: 'right' },
  tableCellNeutral:  { fontSize: 8, fontFamily: 'Helvetica', color: '#94A3B8', flex: 1, textAlign: 'right' },

  /* ── KPI Cards ── */
  kpiGrid:           { flexDirection: 'row', gap: 7, marginBottom: 7 },
  kpiCard:           { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 6, borderLeftWidth: 3, paddingTop: 9, paddingBottom: 9, paddingRight: 9, paddingLeft: 10 },
  kpiLabel:          { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4 },
  kpiValue:          { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#0F172A', lineHeight: 1.1, marginBottom: 3 },
  kpiDeltaPos:       { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#16A34A' },
  kpiDeltaNeg:       { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#DC2626' },
  kpiDeltaNeutral:   { fontSize: 7.5, fontFamily: 'Helvetica', color: '#94A3B8' },
  kpiDeltaSuffix:    { fontSize: 7, fontFamily: 'Helvetica', color: '#94A3B8', marginLeft: 2 },

  /* ── AI Narrative ── */
  narrativeHeaderRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 6, marginBottom: 10, borderWidth: 1 },
  narrativeBadge:      { width: 30, height: 30, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  narrativeBadgeText:  { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  narrativeHeaderTitle:{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  narrativeHeaderSub:  { fontSize: 8, fontFamily: 'Helvetica', color: '#64748B', marginTop: 2 },
  narrativeBlock:      { marginBottom: 9, paddingLeft: 11, borderLeftWidth: 2.5 },
  narrativeSectionTitle:{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  narrativeBody:       { fontSize: 9, color: '#334155', fontFamily: 'Helvetica', lineHeight: 1.75 },

  /* ── Watermark ── */
  watermark:         { fontSize: 6.5, color: '#CBD5E1', textAlign: 'center', marginTop: 28, fontFamily: 'Helvetica' },
});

/* ════════════════════════════════════════════════════════
   COVER BACKGROUND SVG
════════════════════════════════════════════════════════ */

function CoverBandSvg({ color }: { color: string }) {
  return React.createElement(Svg,
    { viewBox: `0 0 ${A4_W} ${COVER_BAND}`, width: A4_W, height: COVER_BAND, style: { position: 'absolute', top: 0, left: 0 } },
    // Background fill
    React.createElement(Rect, { x: 0, y: 0, width: A4_W, height: COVER_BAND, fill: color }),
    // Decorative large circle — top right
    React.createElement(Circle, { cx: 520, cy: -30, r: 210, fill: 'white', fillOpacity: 0.055 }),
    // Medium circle — bottom right
    React.createElement(Circle, { cx: 540, cy: COVER_BAND + 20, r: 160, fill: 'white', fillOpacity: 0.045 }),
    // Small circle — mid left
    React.createElement(Circle, { cx: -20, cy: 210, r: 130, fill: 'white', fillOpacity: 0.04 }),
    // Subtle rect accent — bottom edge
    React.createElement(Rect, { x: 0, y: COVER_BAND - 4, width: A4_W, height: 4, fill: 'white', fillOpacity: 0.12 }),
    // Diagonal stripe
    React.createElement(G, { opacity: 0.04 },
      React.createElement(Rect, { x: 340, y: -40, width: 35, height: COVER_BAND + 80, fill: 'white', transform: 'rotate(-18 340 0)' }),
      React.createElement(Rect, { x: 430, y: -40, width: 20, height: COVER_BAND + 80, fill: 'white', transform: 'rotate(-18 430 0)' }),
    ),
  );
}

/* ════════════════════════════════════════════════════════
   KPI CARD
════════════════════════════════════════════════════════ */

interface KpiProps {
  label: string; value: string;
  delta: Delta; invertGood?: boolean; color: string;
}
function KpiCard({ label, value, delta, invertGood, color }: KpiProps) {
  const isGood  = invertGood ? !delta.isPos : delta.isPos;
  const dStyle  = delta.isNA ? S.kpiDeltaNeutral : (isGood ? S.kpiDeltaPos : S.kpiDeltaNeg);
  const dLabel  = delta.isNA ? 'N/A' : (delta.isPos ? '↑' : '↓') + ' ' + delta.label.replace(/^[+-]/, '');
  return React.createElement(View, { style: [S.kpiCard, { borderLeftColor: color }] },
    React.createElement(Text, { style: S.kpiLabel }, label),
    React.createElement(Text, { style: S.kpiValue }, value),
    React.createElement(Text, { style: dStyle }, dLabel),
  );
}

/* ════════════════════════════════════════════════════════
   KPI GRID (N columns, row-wrapped)
════════════════════════════════════════════════════════ */

function KpiGrid({ metrics, color, perRow = 4 }: {
  metrics: Omit<KpiProps, 'color'>[]; color: string; perRow?: number;
}) {
  const rows: (typeof metrics)[] = [];
  for (let i = 0; i < metrics.length; i += perRow) rows.push(metrics.slice(i, i + perRow));
  return React.createElement(View, {},
    ...rows.map((row, ri) =>
      React.createElement(View, { key: ri, style: [S.kpiGrid, { marginBottom: ri < rows.length - 1 ? 7 : 16 }] },
        ...row.map(m => React.createElement(KpiCard, { key: m.label, ...m, color })),
        // Fill remaining slots so flex doesn't stretch last row oddly
        ...(row.length < perRow
          ? Array.from({ length: perRow - row.length }).map((_, i) =>
              React.createElement(View, { key: `pad_${i}`, style: { flex: 1 } })
            )
          : []
        ),
      )
    )
  );
}

/* ════════════════════════════════════════════════════════
   SECTION HEADING
════════════════════════════════════════════════════════ */

function SectionHeading({ title, color }: { title: string; color: string }) {
  return React.createElement(View, { style: S.sectionWrap },
    React.createElement(View, { style: S.sectionRow },
      React.createElement(View, { style: [S.sectionDot, { backgroundColor: color }] }),
      React.createElement(Text, { style: [S.sectionTitle, { color }] }, title),
    ),
    React.createElement(View, { style: [S.sectionRule, { backgroundColor: color + '28' }] }),
  );
}

/* ════════════════════════════════════════════════════════
   NARRATIVE BLOCK
════════════════════════════════════════════════════════ */

function NarrativeBlock({ title, body, color }: { title: string; body: string; color: string }) {
  const clean = title.replace(/^[\p{Emoji}\s]+/u, '').trim();
  return React.createElement(View, { style: [S.narrativeBlock, { borderLeftColor: color + 'aa' }] },
    React.createElement(Text, { style: [S.narrativeSectionTitle, { color }] }, clean),
    React.createElement(Text, { style: S.narrativeBody }, body),
  );
}

/* ════════════════════════════════════════════════════════
   PLATFORM SUMMARY TABLE
════════════════════════════════════════════════════════ */

function PlatformSummaryTable({ rawData, color }: { rawData: any; color: string }) {
  type Row = { platform: string; primaryLabel: string; primary: string; secondaryLabel: string; secondary: string; d: Delta };
  const rows: Row[] = [];

  if (rawData?.ga4) {
    rows.push({
      platform: 'Google Analytics 4',
      primaryLabel:   'Sessions',    primary:   fmt(rawData.ga4.sessions),
      secondaryLabel: 'Users',       secondary: fmt(rawData.ga4.users),
      d: calcDelta(rawData.ga4.sessions, rawData.ga4.sessionsPrev),
    });
  }
  if (rawData?.googleAds) {
    rows.push({
      platform: 'Google Ads',
      primaryLabel:   'Spend',       primary:   `$${fmt(rawData.googleAds.spend, 0)}`,
      secondaryLabel: 'ROAS',        secondary: `${fmt(rawData.googleAds.roas, 2)}x`,
      d: calcDelta(rawData.googleAds.roas, rawData.googleAds.roasPrev),
    });
  }
  if (rawData?.meta) {
    rows.push({
      platform: 'Meta Ads',
      primaryLabel:   'Spend',       primary:   `$${fmt(rawData.meta.spend, 0)}`,
      secondaryLabel: 'ROAS',        secondary: `${fmt(rawData.meta.roas, 2)}x`,
      d: calcDelta(rawData.meta.roas, rawData.meta.roasPrev),
    });
  }

  if (rows.length === 0) return null;

  return React.createElement(View, { style: S.tableWrap },
    // Header
    React.createElement(View, { style: [S.tableHead, { backgroundColor: color + '12' }] },
      React.createElement(Text, { style: [S.tableHeadCell, { flex: 2, color }] }, 'Platform'),
      React.createElement(Text, { style: [S.tableHeadCell, { flex: 1.5, textAlign: 'right', color }] }, 'Primary'),
      React.createElement(Text, { style: [S.tableHeadCell, { flex: 1.5, textAlign: 'right', color }] }, 'Secondary'),
      React.createElement(Text, { style: [S.tableHeadCell, { flex: 1, textAlign: 'right', color }] }, 'MoM'),
    ),
    // Rows
    ...rows.map((r, i) => {
      const dStyle = r.d.isNA ? S.tableCellNeutral : (r.d.isPos ? S.tableCellDeltaPos : S.tableCellDeltaNeg);
      const dText  = r.d.isNA ? 'N/A' : (r.d.isPos ? '↑ ' : '↓ ') + r.d.label.replace(/^[+-]/, '');
      return React.createElement(View, { key: i, style: [S.tableRow, { backgroundColor: i % 2 === 0 ? '#FAFAFA' : '#ffffff' }] },
        React.createElement(Text, { style: S.tableCellPlatform }, r.platform),
        React.createElement(View, { style: { flex: 1.5, alignItems: 'flex-end' } },
          React.createElement(Text, { style: S.tableCellMetric }, r.primary),
          React.createElement(Text, { style: [S.tableCellNeutral, { fontSize: 6.5 }] }, r.primaryLabel),
        ),
        React.createElement(View, { style: { flex: 1.5, alignItems: 'flex-end' } },
          React.createElement(Text, { style: S.tableCellMetric }, r.secondary),
          React.createElement(Text, { style: [S.tableCellNeutral, { fontSize: 6.5 }] }, r.secondaryLabel),
        ),
        React.createElement(Text, { style: [dStyle, { flex: 1, textAlign: 'right' }] }, dText),
      );
    }),
  );
}

/* ════════════════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════════════════ */

export async function generatePDF(report: any, agency: any, client: any): Promise<Buffer> {
  const rawData   = report.rawData  as any;
  const narrative = report.narrative as any;
  const color     = agency?.brandColor || '#6366F1';
  const isAgency  = ['AGENCY', 'AGENCY_PRO'].includes(agency?.subscriptionTier);

  const agencyName  = agency?.name || 'ReportCraft AI';
  const clientName  = client?.name || 'Client';
  const startDate   = fmtDate(report.dateRangeStart);
  const endDate     = fmtDate(report.dateRangeEnd);
  const dateRange   = `${startDate} – ${endDate}`;
  const genDate     = fmtDate(new Date());
  const tone        = report.narrativeTone
    ? report.narrativeTone.charAt(0).toUpperCase() + report.narrativeTone.slice(1)
    : 'Professional';

  /* ── COVER PAGE ── */
  const coverPage = React.createElement(Page, { key: 'cover', size: 'A4', style: S.coverPage },

    /* Top colored band */
    React.createElement(View, { style: S.coverBand },
      React.createElement(CoverBandSvg, { color }),
      React.createElement(View, { style: S.coverBandContent },
        /* Agency identity */
        React.createElement(View, {},
          agency?.logoUrl
            ? React.createElement(Image, { src: agency.logoUrl, style: S.coverLogo })
            : React.createElement(Text, { style: S.coverAgencyText }, agencyName),
        ),
        /* Client name + label */
        React.createElement(View, {},
          React.createElement(Text, { style: S.coverLabel }, 'Performance Report'),
          React.createElement(Text, { style: S.coverClient }, clientName),
          React.createElement(Text, { style: S.coverDate }, dateRange),
        ),
      ),
    ),

    /* Metadata section */
    React.createElement(View, { style: S.coverMeta },
      React.createElement(View, {},
        React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaLabel }, 'Prepared by'),
          React.createElement(Text, { style: S.coverMetaValue }, agencyName),
        ),
        React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaLabel }, 'Report period'),
          React.createElement(Text, { style: S.coverMetaValue }, dateRange),
        ),
        React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaLabel }, 'Generated on'),
          React.createElement(Text, { style: S.coverMetaValue }, genDate),
        ),
        React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaLabel }, 'Narrative tone'),
          React.createElement(Text, { style: S.coverMetaValue }, tone),
        ),
        narrative?.wordCount && React.createElement(View, { style: S.coverMetaRow },
          React.createElement(Text, { style: S.coverMetaLabel }, 'AI analysis'),
          React.createElement(Text, { style: S.coverMetaValue }, `${narrative.wordCount} words`),
        ),
      ),

      /* Tags at bottom */
      React.createElement(View, { style: S.coverTagRow },
        React.createElement(View, { style: [S.coverTag, { borderColor: color + '50', backgroundColor: color + '10' }] },
          React.createElement(Text, { style: [S.coverTagText, { color }] }, 'Confidential'),
        ),
        React.createElement(View, { style: [S.coverTag, { borderColor: '#E2E8F0' }] },
          React.createElement(Text, { style: [S.coverTagText, { color: '#64748B' }] }, 'AI-Generated Insights'),
        ),
      ),
    ),

    /* Thin bottom accent bar */
    React.createElement(View, { style: [S.coverBottomBar, { backgroundColor: color }] }),
  );

  /* ── CONTENT PAGE ── */
  const contentPage = React.createElement(Page, { key: 'content', size: 'A4', style: S.contentPage },

    /* Running header — fixed */
    React.createElement(View, { style: S.runHeader, fixed: true },
      React.createElement(View, { style: [S.runHeaderBar, { backgroundColor: color }] }),
      React.createElement(View, { style: S.runHeaderRow },
        React.createElement(Text, { style: S.runHeaderLeft }, agencyName),
        React.createElement(Text, { style: S.runHeaderRight }, `${clientName} — Performance Report · ${dateRange}`),
      ),
    ),

    /* Running footer — fixed */
    React.createElement(View, { style: S.runFooter, fixed: true },
      React.createElement(View, { style: S.runFooterLine }),
      React.createElement(View, { style: S.runFooterRow },
        React.createElement(Text, { style: S.runFooterText }, `${agencyName} · Confidential`),
        React.createElement(Text, { style: S.runFooterText }, genDate),
        React.createElement(Text, { style: S.runFooterText, render: ({ pageNumber, totalPages }: any) => `Page ${pageNumber - 1} of ${totalPages - 1}` }),
      ),
    ),

    /* ── PLATFORM OVERVIEW TABLE ── */
    (rawData?.ga4 || rawData?.googleAds || rawData?.meta) && React.createElement(View, {},
      React.createElement(SectionHeading, { title: 'Platform Overview', color }),
      React.createElement(PlatformSummaryTable, { rawData, color }),
    ),

    /* ── GA4 ── */
    rawData?.ga4 && React.createElement(View, {},
      React.createElement(SectionHeading, { title: 'Google Analytics 4', color }),
      React.createElement(KpiGrid, {
        color, perRow: 3,
        metrics: [
          { label: 'Sessions',       value: fmt(rawData.ga4.sessions),                          delta: calcDelta(rawData.ga4.sessions,        rawData.ga4.sessionsPrev) },
          { label: 'Users',          value: fmt(rawData.ga4.users),                             delta: calcDelta(rawData.ga4.users,           rawData.ga4.usersPrev) },
          { label: 'Pageviews',      value: fmt(rawData.ga4.pageviews),                         delta: calcDelta(rawData.ga4.pageviews,       rawData.ga4.pageviewsPrev) },
          { label: 'Bounce Rate',    value: `${fmt(rawData.ga4.bounceRate * 100, 1)}%`,         delta: calcDelta(rawData.ga4.bounceRate,      rawData.ga4.bounceRatePrev),     invertGood: true },
          { label: 'Conv. Rate',     value: `${fmt(rawData.ga4.conversionRate * 100, 2)}%`,     delta: calcDelta(rawData.ga4.conversionRate,  rawData.ga4.conversionRatePrev) },
          { label: 'Avg. Session',   value: fmtDur(rawData.ga4.avgSessionDuration),             delta: calcDelta(rawData.ga4.avgSessionDuration, rawData.ga4.avgSessionDurationPrev) },
        ],
      }),
    ),

    /* ── Google Ads ── */
    rawData?.googleAds && React.createElement(View, {},
      React.createElement(SectionHeading, { title: 'Google Ads', color }),
      React.createElement(KpiGrid, {
        color, perRow: 4,
        metrics: [
          { label: 'Spend',        value: `$${fmt(rawData.googleAds.spend, 0)}`,              delta: calcDelta(rawData.googleAds.spend,        rawData.googleAds.spendPrev),        invertGood: true },
          { label: 'Impressions',  value: fmt(rawData.googleAds.impressions),                  delta: calcDelta(rawData.googleAds.impressions,  rawData.googleAds.impressionsPrev) },
          { label: 'Clicks',       value: fmt(rawData.googleAds.clicks),                       delta: calcDelta(rawData.googleAds.clicks,       rawData.googleAds.clicksPrev) },
          { label: 'CTR',          value: `${fmt(rawData.googleAds.ctr * 100, 2)}%`,           delta: calcDelta(rawData.googleAds.ctr,          rawData.googleAds.ctrPrev) },
          { label: 'CPC',          value: `$${fmt(rawData.googleAds.cpc, 2)}`,                 delta: calcDelta(rawData.googleAds.cpc,          rawData.googleAds.cpcPrev),          invertGood: true },
          { label: 'ROAS',         value: `${fmt(rawData.googleAds.roas, 2)}x`,                delta: calcDelta(rawData.googleAds.roas,         rawData.googleAds.roasPrev) },
          { label: 'Conversions',  value: fmt(rawData.googleAds.conversions),                  delta: calcDelta(rawData.googleAds.conversions,  rawData.googleAds.conversionsPrev) },
          { label: 'Conv. Rate',   value: `${fmt(rawData.googleAds.conversionRate * 100, 2)}%`, delta: calcDelta(rawData.googleAds.conversionRate, rawData.googleAds.conversionRatePrev) },
        ],
      }),
    ),

    /* ── Meta Ads ── */
    rawData?.meta && React.createElement(View, {},
      React.createElement(SectionHeading, { title: 'Meta Ads', color }),
      React.createElement(KpiGrid, {
        color, perRow: 4,
        metrics: [
          { label: 'Spend',        value: `$${fmt(rawData.meta.spend, 0)}`,          delta: calcDelta(rawData.meta.spend,        rawData.meta.spendPrev),        invertGood: true },
          { label: 'Impressions',  value: fmt(rawData.meta.impressions),              delta: calcDelta(rawData.meta.impressions,  rawData.meta.impressionsPrev) },
          { label: 'Reach',        value: fmt(rawData.meta.reach),                   delta: calcDelta(rawData.meta.reach,        rawData.meta.reachPrev) },
          { label: 'Clicks',       value: fmt(rawData.meta.clicks),                  delta: calcDelta(rawData.meta.clicks,       rawData.meta.clicksPrev) },
          { label: 'CTR',          value: `${fmt(rawData.meta.ctr * 100, 3)}%`,      delta: calcDelta(rawData.meta.ctr,          rawData.meta.ctrPrev) },
          { label: 'CPM',          value: `$${fmt(rawData.meta.cpm, 2)}`,            delta: calcDelta(rawData.meta.cpm,          rawData.meta.cpmPrev),          invertGood: true },
          { label: 'ROAS',         value: `${fmt(rawData.meta.roas, 2)}x`,           delta: calcDelta(rawData.meta.roas,         rawData.meta.roasPrev) },
        ],
      }),
    ),

    /* ── AI NARRATIVE ── */
    narrative && React.createElement(View, {},
      React.createElement(SectionHeading, { title: 'AI Insight Analysis', color }),

      /* AI header card */
      React.createElement(View, {
        style: [S.narrativeHeaderRow, { borderColor: color + '28', backgroundColor: color + '08' }],
      },
        React.createElement(View, { style: [S.narrativeBadge, { backgroundColor: color }] },
          React.createElement(Text, { style: S.narrativeBadgeText }, 'AI'),
        ),
        React.createElement(View, {},
          React.createElement(Text, { style: S.narrativeHeaderTitle }, 'AI Insight Write — Cross-Channel Analysis'),
          React.createElement(Text, { style: S.narrativeHeaderSub },
            `${tone} tone${narrative.wordCount ? ` · ${narrative.wordCount} words` : ''}${report.aiModel ? ` · Model: ${report.aiModel}` : ''}`,
          ),
        ),
      ),

      /* Narrative sections */
      ...[
        { title: '📊 Executive Summary',    body: narrative.executiveSummary },
        { title: '📈 Campaign Performance', body: narrative.campaignPerformance },
        { title: '🏆 Key Wins',             body: narrative.keyWins },
        { title: '⚠️ Areas of Concern',     body: narrative.areasOfConcern },
        { title: '🎯 Recommendations',      body: narrative.recommendations },
      ].filter(s => s.body).map(s =>
        React.createElement(NarrativeBlock, { key: s.title, title: s.title, body: s.body, color })
      ),
    ),

    /* Watermark for non-agency tiers */
    !isAgency && React.createElement(Text, { style: S.watermark }, 'Generated with ReportCraft AI · reportcraft.ai'),
  );

  const docEl = React.createElement(
    Document,
    { title: `${clientName} — Performance Report — ${dateRange}`, author: agencyName },
    coverPage,
    contentPage,
  );

  return await renderToBuffer(docEl);
}

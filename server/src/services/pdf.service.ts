import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, Image,
  Svg, Rect, Circle, G,
} from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';

/* ═══════════════════════════════════════════════════════════════
   PAGE CONSTANTS
═══════════════════════════════════════════════════════════════ */
const PW   = 595;            // A4 width  pt
const PH   = 842;            // A4 height pt
const ML   = 50;             // margin left/right
const CW   = PW - ML * 2;   // content width = 495 pt
const CARD_GAP = 7;          // gap between KPI cards

/* ═══════════════════════════════════════════════════════════════
   COLOUR HELPERS
═══════════════════════════════════════════════════════════════ */
function hex2rgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const full = c.length === 3
    ? c.split('').map(x => x + x).join('')
    : c;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}
/** CSS rgba string — safe for View backgroundColor / borderColor */
function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hex2rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
/** Return a lighter tint of hex (amount 0–1) */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hex2rgb(hex);
  const l = (v: number) => Math.min(255, Math.round(v + (255 - v) * amount));
  const h = (v: number) => l(v).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/* ═══════════════════════════════════════════════════════════════
   FORMAT HELPERS
═══════════════════════════════════════════════════════════════ */
function fmt(v: number | undefined | null, dec = 0): string {
  if (v == null || isNaN(v as number)) return '—';
  return (v as number).toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}
function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}
function fmtDateShort(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
function fmtDur(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

type Delta = { pct: number; label: string; isPos: boolean; isNA: boolean };
function calcDelta(cur: number | undefined, prev: number | undefined): Delta {
  if (!cur || !prev || prev === 0) return { pct: 0, label: 'N/A', isPos: true, isNA: true };
  const pct = ((cur - prev) / prev) * 100;
  return {
    pct,
    label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    isPos: pct >= 0,
    isNA: false,
  };
}

/* ═══════════════════════════════════════════════════════════════
   STYLE SHEET
═══════════════════════════════════════════════════════════════ */
const S = StyleSheet.create({
  /* Pages */
  coverPage:    { width: PW, height: PH, backgroundColor: '#ffffff', padding: 0 },
  contentPage:  { paddingHorizontal: ML, paddingTop: 0, paddingBottom: 0,
                  backgroundColor: '#ffffff' },

  /* Running header */
  rHdrBar:      { height: 4 },
  rHdrRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 7, paddingBottom: 7,
                  borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  rHdrL:        { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569',
                  textTransform: 'uppercase', letterSpacing: 0.8 },
  rHdrR:        { fontSize: 7, fontFamily: 'Helvetica', color: '#94A3B8' },

  /* Running footer */
  rFtrLine:     { height: 0.5, backgroundColor: '#E2E8F0', marginBottom: 6 },
  rFtrRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingBottom: 12 },
  rFtrTxt:      { fontSize: 6.5, color: '#94A3B8', fontFamily: 'Helvetica' },

  /* Section heading */
  secWrap:      { marginTop: 20, marginBottom: 10 },
  secRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  secNum:       { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase',
                  letterSpacing: 1.5, marginRight: 6 },
  secBar:       { width: 3, height: 11, borderRadius: 2, marginRight: 7 },
  secTitle:     { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  secRule:      { height: 1 },

  /* KPI card — NOTE: no gap/flexWrap here, managed per-row */
  kpiRow:       { flexDirection: 'row', marginBottom: CARD_GAP },
  kpiCard:      { backgroundColor: '#F8FAFC', borderRadius: 5, padding: 11,
                  borderTopWidth: 3, flexDirection: 'column' },
  kpiLbl:       { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 5 },
  kpiVal:       { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0F172A',
                  lineHeight: 1, marginBottom: 6 },
  kpiBarTrack:  { height: 3, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 5 },
  kpiDeltaPos:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#16A34A' },
  kpiDeltaNeg:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#DC2626' },
  kpiDeltaNA:   { fontSize: 7, fontFamily: 'Helvetica', color: '#94A3B8' },

  /* Overview table */
  tblWrap:      { marginBottom: 16, borderRadius: 5, overflow: 'hidden',
                  borderWidth: 1, borderColor: '#E2E8F0' },
  tblHead:      { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 11 },
  tblHCell:     { fontSize: 6.5, fontFamily: 'Helvetica-Bold',
                  textTransform: 'uppercase', letterSpacing: 0.8 },
  tblRow:       { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 11,
                  alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#F1F5F9' },
  tblDot:       { width: 6, height: 6, borderRadius: 3, marginRight: 7 },
  tblPlatName:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  tblCell:      { alignItems: 'flex-end' },
  tblVal:       { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  tblSub:       { fontSize: 6, fontFamily: 'Helvetica', color: '#94A3B8', marginTop: 1 },
  tblDPos:      { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16A34A', textAlign: 'right' },
  tblDNeg:      { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#DC2626', textAlign: 'right' },
  tblDNA:       { fontSize: 8, fontFamily: 'Helvetica', color: '#94A3B8', textAlign: 'right' },

  /* AI narrative */
  narrHdr:      { flexDirection: 'row', alignItems: 'center', padding: 14,
                  borderRadius: 6, marginBottom: 14, borderWidth: 1 },
  narrBadge:    { width: 38, height: 38, borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  narrBadgeTxt: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  narrHdrTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  narrHdrSub:   { fontSize: 7.5, fontFamily: 'Helvetica', color: '#64748B', marginTop: 3 },

  narrBlock:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 13 },
  narrNumCircle:{ width: 20, height: 20, borderRadius: 10, alignItems: 'center',
                  justifyContent: 'center', marginRight: 10, marginTop: 1, flexShrink: 0 },
  narrNumTxt:   { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  narrContent:  { flex: 1 },
  narrTitle:    { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#0F172A', marginBottom: 4 },
  narrBody:     { fontSize: 8.5, color: '#334155', fontFamily: 'Helvetica', lineHeight: 1.75 },

  narrRecWrap:  { borderRadius: 5, padding: 13, marginTop: 4, borderWidth: 1 },
  narrRecHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  narrRecTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  narrRecBody:  { fontSize: 8.5, color: '#475569', fontFamily: 'Helvetica', lineHeight: 1.75 },

  watermark:    { fontSize: 7, color: '#CBD5E1', textAlign: 'center',
                  marginTop: 18, fontFamily: 'Helvetica', letterSpacing: 0.5 },
});

/* ═══════════════════════════════════════════════════════════════
   COVER BACKGROUND — pure View panels + small SVGs for circles
   Avoids full-page SVG which triggers react-pdf wrap warnings
═══════════════════════════════════════════════════════════════ */
function CoverBackground({ color }: { color: string }) {
  const light  = lighten(color, 0.88);
  const medium = lighten(color, 0.72);
  return React.createElement(View,
    { style: { position: 'absolute', top: 0, left: 0, width: PW, height: PH } },

    /* White base */
    React.createElement(View, { style: { position: 'absolute', top: 0, left: 0,
      width: PW, height: PH, backgroundColor: '#ffffff' } }),

    /* Dark navy left panel */
    React.createElement(View, { style: { position: 'absolute', top: 0, left: 0,
      width: 208, height: PH, backgroundColor: '#0F172A' } }),

    /* Brand accent stripe */
    React.createElement(View, { style: { position: 'absolute', top: 0, left: 200,
      width: 8, height: PH, backgroundColor: color } }),

    /* Decorative circles — left panel (small SVG, 280×280) */
    React.createElement(View, { style: { position: 'absolute', top: 0, left: 0,
      width: 280, height: 280 } },
      React.createElement(Svg, { width: 280, height: 280, viewBox: '0 0 280 280' },
        React.createElement(Circle, { cx: 104, cy: 148, r: 110, fill: color, fillOpacity: 0.1 }),
        React.createElement(Circle, { cx: 104, cy: 148, r: 60,  fill: color, fillOpacity: 0.12 }),
      ),
    ),

    /* Decorative circles — top-right corner (small SVG, 200×200) */
    React.createElement(View, { style: { position: 'absolute', top: 0, right: 0,
      width: 200, height: 200 } },
      React.createElement(Svg, { width: 200, height: 200, viewBox: '0 0 200 200' },
        React.createElement(Circle, { cx: 200, cy: 0, r: 160, fill: light }),
        React.createElement(Circle, { cx: 180, cy: 20, r: 80,  fill: medium }),
        React.createElement(Circle, { cx: 200, cy: 0, r: 45,   fill: color, fillOpacity: 0.18 }),
      ),
    ),

    /* Decorative arc — bottom-right (small SVG, 160×160) */
    React.createElement(View, { style: { position: 'absolute', bottom: 0, right: 0,
      width: 160, height: 160 } },
      React.createElement(Svg, { width: 160, height: 160, viewBox: '0 0 160 160' },
        React.createElement(Circle, { cx: 180, cy: 160, r: 110, fill: light }),
      ),
    ),

    /* Horizontal rule on white side (below stats area) */
    React.createElement(View, { style: { position: 'absolute', top: 540, left: 208,
      width: PW - 208, height: 0.5, backgroundColor: '#E2E8F0' } }),
  );
}

/* ═══════════════════════════════════════════════════════════════
   RUNNING HEADER & FOOTER
═══════════════════════════════════════════════════════════════ */
function RunningHeader({ agencyName, clientName, dateRange, color }: {
  agencyName: string; clientName: string; dateRange: string; color: string;
}) {
  return React.createElement(View, { style: { marginBottom: 16 }, fixed: true },
    React.createElement(View, { style: [S.rHdrBar, { backgroundColor: color }] }),
    React.createElement(View, { style: S.rHdrRow },
      React.createElement(Text, { style: S.rHdrL }, agencyName),
      React.createElement(Text, { style: S.rHdrR }, `${clientName}  ·  ${dateRange}`),
    ),
  );
}

function RunningFooter({ agencyName, genDate }: { agencyName: string; genDate: string }) {
  return React.createElement(View, { style: { marginTop: 10 }, fixed: true },
    React.createElement(View, { style: S.rFtrLine }),
    React.createElement(View, { style: S.rFtrRow },
      React.createElement(Text, { style: S.rFtrTxt }, `${agencyName}  ·  Strictly Confidential`),
      React.createElement(Text, { style: S.rFtrTxt }, `Generated ${genDate}`),
      React.createElement(Text, {
        style: S.rFtrTxt,
        render: ({ pageNumber, totalPages }: any) =>
          `Page ${pageNumber - 1} of ${totalPages - 1}`,
      }),
    ),
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADING
═══════════════════════════════════════════════════════════════ */
function SectionHeading({ num, title, color }: { num: string; title: string; color: string }) {
  return React.createElement(View, { style: S.secWrap },
    React.createElement(View, { style: S.secRow },
      React.createElement(Text, { style: [S.secNum, { color }] }, num),
      React.createElement(View, { style: [S.secBar, { backgroundColor: color }] }),
      React.createElement(Text, { style: S.secTitle }, title),
    ),
    React.createElement(View, { style: [S.secRule, { backgroundColor: rgba(color, 0.18) }] }),
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI CARD (inline trend bar via nested Views)
═══════════════════════════════════════════════════════════════ */
interface KpiProps {
  label: string; value: string; delta: Delta;
  invertGood?: boolean; color: string; errorColor: string; width: number;
}
function KpiCard({ label, value, delta, invertGood, color, errorColor, width }: KpiProps) {
  const good    = invertGood ? !delta.isPos : delta.isPos;
  const dStyle  = delta.isNA ? S.kpiDeltaNA : (good ? S.kpiDeltaPos : S.kpiDeltaNeg);
  const arrow   = delta.isNA ? '' : (delta.isPos ? '▲  ' : '▼  ');
  const dText   = delta.isNA ? 'No prior data'
    : arrow + delta.label.replace(/^[+-]/, '') + ' vs prior period';

  // Trend bar fill width clamped to [3, cardContentWidth]
  const barFull  = width - 22;   // card padding 11pt each side
  const barFill  = Math.max(3, Math.min(barFull, (Math.abs(delta.pct) / 60) * barFull));
  const barColor = delta.isNA ? '#CBD5E1' : (good ? '#16A34A' : errorColor);

  return React.createElement(View, {
    style: [S.kpiCard, { borderTopColor: color, width, marginRight: 0 }],
  },
    React.createElement(Text, { style: S.kpiLbl }, label),
    React.createElement(Text, { style: S.kpiVal }, value),
    // Trend bar
    React.createElement(View, { style: S.kpiBarTrack },
      React.createElement(View, {
        style: { height: 3, width: barFill, backgroundColor: barColor, borderRadius: 2 },
      }),
    ),
    React.createElement(Text, { style: dStyle }, dText),
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI GRID — explicit rows, no flexWrap
═══════════════════════════════════════════════════════════════ */
interface KpiMetric { label: string; value: string; delta: Delta; invertGood?: boolean }
function KpiGrid({ metrics, color, errorColor, perRow = 4 }: {
  metrics: KpiMetric[]; color: string; errorColor: string; perRow?: number;
}) {
  const cardW = (CW - (perRow - 1) * CARD_GAP) / perRow;
  const rows: KpiMetric[][] = [];
  for (let i = 0; i < metrics.length; i += perRow) rows.push(metrics.slice(i, i + perRow));

  return React.createElement(View, { style: { marginBottom: 8 } },
    ...rows.map((row, ri) =>
      React.createElement(View, {
        key: ri,
        style: [S.kpiRow, { marginBottom: ri < rows.length - 1 ? CARD_GAP : 0 }],
        wrap: false,
      },
        ...row.map((m, ci) =>
          React.createElement(View, {
            key: m.label,
            style: { marginRight: ci < row.length - 1 ? CARD_GAP : 0 },
          },
            React.createElement(KpiCard, { ...m, color, errorColor, width: cardW }),
          )
        ),
      )
    ),
  );
}

/* ═══════════════════════════════════════════════════════════════
   PLATFORM OVERVIEW TABLE
═══════════════════════════════════════════════════════════════ */
type OvRow = {
  platform: string; dotColor: string;
  primary: string; primaryLbl: string;
  secondary: string; secondaryLbl: string;
  d: Delta;
};

function OverviewTable({ rawData, color }: { rawData: any; color: string }) {
  const rows: OvRow[] = [];
  if (rawData?.ga4) rows.push({
    platform: 'Google Analytics 4',    dotColor: '#4285F4',
    primary: fmt(rawData.ga4.sessions),        primaryLbl: 'Sessions',
    secondary: `${fmt(rawData.ga4.conversionRate * 100, 2)}%`, secondaryLbl: 'Conv. Rate',
    d: calcDelta(rawData.ga4.sessions, rawData.ga4.sessionsPrev),
  });
  if (rawData?.googleAds) rows.push({
    platform: 'Google Ads',            dotColor: '#FBBC05',
    primary: `$${fmt(rawData.googleAds.spend, 0)}`,     primaryLbl: 'Ad Spend',
    secondary: `${fmt(rawData.googleAds.roas, 2)}x`,    secondaryLbl: 'ROAS',
    d: calcDelta(rawData.googleAds.roas, rawData.googleAds.roasPrev),
  });
  if (rawData?.meta) rows.push({
    platform: 'Meta Ads',              dotColor: '#0866FF',
    primary: `$${fmt(rawData.meta.spend, 0)}`,          primaryLbl: 'Ad Spend',
    secondary: `${fmt(rawData.meta.roas, 2)}x`,         secondaryLbl: 'ROAS',
    d: calcDelta(rawData.meta.roas, rawData.meta.roasPrev),
  });
  if (rawData?.linkedin) rows.push({
    platform: 'LinkedIn Ads',          dotColor: '#0A66C2',
    primary: `$${fmt(rawData.linkedin.spend, 0)}`,      primaryLbl: 'Ad Spend',
    secondary: fmt(rawData.linkedin.conversions),       secondaryLbl: 'Conversions',
    d: calcDelta(rawData.linkedin.clicks, rawData.linkedin.clicksPrev),
  });
  if (!rows.length) return null;

  const col = { platform: 2.2, primary: 1.4, secondary: 1.4, delta: 1 };
  const total = col.platform + col.primary + col.secondary + col.delta;

  return React.createElement(View, { style: S.tblWrap },
    // Header
    React.createElement(View, { style: [S.tblHead, { backgroundColor: rgba(color, 0.07) }] },
      React.createElement(Text, { style: [S.tblHCell, { flex: col.platform / total, color }] }, 'Data Source'),
      React.createElement(Text, { style: [S.tblHCell, { flex: col.primary / total, textAlign: 'right', color }] }, 'Primary'),
      React.createElement(Text, { style: [S.tblHCell, { flex: col.secondary / total, textAlign: 'right', color }] }, 'Secondary'),
      React.createElement(Text, { style: [S.tblHCell, { flex: col.delta / total, textAlign: 'right', color }] }, 'vs Prior'),
    ),
    // Rows
    ...rows.map((r, i) => {
      const dStyle = r.d.isNA ? S.tblDNA : (r.d.isPos ? S.tblDPos : S.tblDNeg);
      const arrow  = r.d.isNA ? '' : (r.d.isPos ? '▲ ' : '▼ ');
      const dText  = r.d.isNA ? '—' : arrow + r.d.label.replace(/^[+-]/, '');
      return React.createElement(View, {
        key: i,
        style: [S.tblRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#FAFAFA' }],
      },
        React.createElement(View, {
          style: { flex: col.platform / total, flexDirection: 'row', alignItems: 'center' },
        },
          React.createElement(View, { style: [S.tblDot, { backgroundColor: r.dotColor }] }),
          React.createElement(Text, { style: S.tblPlatName }, r.platform),
        ),
        React.createElement(View, { style: [S.tblCell, { flex: col.primary / total }] },
          React.createElement(Text, { style: S.tblVal }, r.primary),
          React.createElement(Text, { style: S.tblSub }, r.primaryLbl),
        ),
        React.createElement(View, { style: [S.tblCell, { flex: col.secondary / total }] },
          React.createElement(Text, { style: S.tblVal }, r.secondary),
          React.createElement(Text, { style: S.tblSub }, r.secondaryLbl),
        ),
        React.createElement(Text, { style: [dStyle, { flex: col.delta / total }] }, dText),
      );
    }),
  );
}

/* ═══════════════════════════════════════════════════════════════
   NARRATIVE BLOCK  (numbered section)
═══════════════════════════════════════════════════════════════ */
function NarrBlock({ num, title, body, color }: {
  num: number; title: string; body: string; color: string;
}) {
  return React.createElement(View, { style: S.narrBlock },
    React.createElement(View, { style: [S.narrNumCircle, { backgroundColor: color }] },
      React.createElement(Text, { style: S.narrNumTxt }, String(num)),
    ),
    React.createElement(View, { style: S.narrContent },
      React.createElement(Text, { style: S.narrTitle }, title),
      React.createElement(Text, { style: S.narrBody }, body),
    ),
  );
}

/* ═══════════════════════════════════════════════════════════════
   COVER — STAT BOX
═══════════════════════════════════════════════════════════════ */
function CoverStat({ label, value, color, isLast }: {
  label: string; value: string; color: string; isLast: boolean;
}) {
  return React.createElement(View, {
    style: {
      flex: 1,
      paddingRight: isLast ? 0 : 18,
      borderRightWidth: isLast ? 0 : 0.5,
      borderRightColor: '#E2E8F0',
      marginRight: isLast ? 0 : 18,
    },
  },
    React.createElement(Text, {
      style: { fontSize: 18, fontFamily: 'Helvetica-Bold', color, lineHeight: 1 },
    }, value),
    React.createElement(Text, {
      style: { fontSize: 6.5, fontFamily: 'Helvetica', color: '#64748B',
        textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },
    }, label),
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export async function generatePDF(report: any, agency: any, client: any): Promise<Buffer> {
  const rawData    = report.rawData   as any;
  const narrative  = report.narrative as any;
  const color      = agency?.brandColor || '#6366F1';
  const errorColor = '#DC2626';
  const isAgency   = ['AGENCY', 'AGENCY_PRO'].includes(agency?.subscriptionTier);

  const agencyName  = agency?.name || 'ReportCraft AI';
  const clientName  = client?.name  || 'Client';
  const startDate   = fmtDate(report.dateRangeStart);
  const endDate     = fmtDate(report.dateRangeEnd);
  const shortStart  = fmtDateShort(report.dateRangeStart);
  const shortEnd    = fmtDateShort(report.dateRangeEnd);
  const dateRange   = `${shortStart} – ${shortEnd}`;
  const genDate     = fmtDate(new Date());
  const tone        = report.narrativeTone
    ? report.narrativeTone.charAt(0).toUpperCase() + report.narrativeTone.slice(1)
    : 'Professional';

  // Active platforms
  const platforms: string[] = [
    rawData?.ga4        ? 'Google Analytics 4' : null,
    rawData?.googleAds  ? 'Google Ads'         : null,
    rawData?.meta       ? 'Meta Ads'           : null,
    rawData?.linkedin   ? 'LinkedIn Ads'       : null,
  ].filter(Boolean) as string[];

  // Cover stats (only defined-and-non-zero values shown)
  const totalSpend = (rawData?.googleAds?.spend || 0) + (rawData?.meta?.spend || 0) + (rawData?.linkedin?.spend || 0);
  const topRoas = Math.max(rawData?.googleAds?.roas || 0, rawData?.meta?.roas || 0);
  const totalConversions = (rawData?.googleAds?.conversions || 0) + (rawData?.linkedin?.conversions || 0);

  // Build stats array — only include items with meaningful values
  const coverStats: Array<{ label: string; value: string }> = [];
  if (totalSpend > 0)        coverStats.push({ label: 'Total Ad Spend',     value: `$${fmt(totalSpend, 0)}` });
  if (totalConversions > 0)  coverStats.push({ label: 'Total Conversions',  value: fmt(totalConversions) });
  if (topRoas > 0)           coverStats.push({ label: 'Best ROAS',          value: `${fmt(topRoas, 2)}x` });
  if (platforms.length > 0)  coverStats.push({ label: 'Data Sources',       value: String(platforms.length) });

  /* ══════════════════════════════════════
     PAGE 1 — COVER
  ══════════════════════════════════════ */
  const tocItems: string[] = [
    rawData?.ga4 || rawData?.googleAds || rawData?.meta || rawData?.linkedin
      ? 'Platform Overview' : null,
    rawData?.ga4        ? 'Google Analytics 4'  : null,
    rawData?.googleAds  ? 'Google Ads'          : null,
    rawData?.meta       ? 'Meta Ads'            : null,
    rawData?.linkedin   ? 'LinkedIn Ads'        : null,
    narrative           ? 'AI Insight Analysis' : null,
  ].filter(Boolean) as string[];

  const coverPage = React.createElement(Page, { key: 'cover', size: 'A4', style: S.coverPage },

    React.createElement(CoverBackground, { color }),

    /* ── LEFT PANEL ── */
    React.createElement(View, {
      style: { position: 'absolute', top: 0, left: 0, width: 200, height: PH,
        padding: 34, flexDirection: 'column', justifyContent: 'space-between' },
    },
      /* Top: agency identity */
      React.createElement(View, {},
        agency?.logoUrl
          ? React.createElement(Image, {
              src: agency.logoUrl,
              style: { height: 26, maxWidth: 120, objectFit: 'contain', marginBottom: 14 },
            })
          : React.createElement(View, {
              style: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
            },
              React.createElement(View, { style: { width: 7, height: 7, borderRadius: 4,
                backgroundColor: color, marginRight: 7 } }),
              React.createElement(Text, {
                style: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
              }, agencyName),
            ),
        React.createElement(View, { style: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.12)',
          marginBottom: 24 } }),
        React.createElement(Text, {
          style: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color,
            textTransform: 'uppercase', letterSpacing: 2.2, marginBottom: 12 },
        }, 'Performance Report'),
        React.createElement(Text, {
          style: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#ffffff',
            lineHeight: 1.18, marginBottom: 10 },
        }, clientName),
        React.createElement(Text, {
          style: { fontSize: 8.5, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6 },
        }, `${startDate}\n– ${endDate}`),
      ),

      /* Bottom: table of contents */
      React.createElement(View, {},
        React.createElement(View, { style: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)',
          marginBottom: 14 } }),
        React.createElement(Text, {
          style: { fontSize: 5.5, fontFamily: 'Helvetica-Bold', color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
        }, 'Contents'),
        ...tocItems.map((item, i) =>
          React.createElement(View, {
            key: i,
            style: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
          },
            React.createElement(View, { style: { width: 4, height: 4, borderRadius: 2,
              backgroundColor: color, marginRight: 8, flexShrink: 0 } }),
            React.createElement(Text, {
              style: { fontSize: 7.5, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.6)' },
            }, item),
          )
        ),
        React.createElement(View, { style: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)',
          marginTop: 10, marginBottom: 10 } }),
        React.createElement(Text, {
          style: { fontSize: 6, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.28)' },
        }, 'Strictly Confidential'),
      ),
    ),

    /* ── RIGHT PANEL ── */
    React.createElement(View, {
      style: { position: 'absolute', top: 0, left: 222, right: 0, height: PH,
        paddingTop: 48, paddingRight: 40, paddingBottom: 36,
        flexDirection: 'column' },
    },

      /* Eyebrow */
      React.createElement(Text, {
        style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color,
          textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 18 },
      }, 'AI-Powered Report'),

      /* Hero heading */
      React.createElement(Text, {
        style: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#0F172A',
          lineHeight: 1.14, letterSpacing: -0.2 },
      }, 'Digital\nPerformance\nAnalysis'),

      React.createElement(View, { style: { height: 3, width: 36, backgroundColor: color,
        borderRadius: 2, marginTop: 10, marginBottom: 14 } }),

      React.createElement(Text, {
        style: { fontSize: 8.5, fontFamily: 'Helvetica', color: '#64748B',
          lineHeight: 1.65, marginBottom: 24 },
      }, `Cross-channel performance analysis combining ${platforms.length > 0 ? platforms.join(', ') : 'all connected platforms'}. AI-driven insights and strategic recommendations.`),

      /* Stat strip — only rendered when there are stats */
      coverStats.length > 0
        ? React.createElement(View, {},
            React.createElement(View, { style: { height: 0.5, backgroundColor: '#E2E8F0',
              marginBottom: 18 } }),
            React.createElement(View, { style: { flexDirection: 'row', marginBottom: 18 } },
              ...coverStats.map((s, i) =>
                React.createElement(CoverStat, {
                  key: s.label,
                  label: s.label,
                  value: s.value,
                  color,
                  isLast: i === coverStats.length - 1,
                })
              ),
            ),
            React.createElement(View, { style: { height: 0.5, backgroundColor: '#E2E8F0',
              marginBottom: 18 } }),
          )
        : null,

      /* Spacer */
      React.createElement(View, { style: { flex: 1 } }),

      /* Metadata grid */
      React.createElement(View, { style: { flexDirection: 'row', marginBottom: 16 } },
        ...[
          { k: 'Prepared by',    v: agencyName },
          { k: 'Report Period',  v: dateRange },
          { k: 'Generated',      v: genDate },
          { k: 'AI Tone',        v: tone },
        ].map(({ k, v }, i) =>
          React.createElement(View, {
            key: k,
            style: { flex: 1, paddingRight: i < 3 ? 10 : 0,
              borderRightWidth: i < 3 ? 0.5 : 0,
              borderRightColor: '#E2E8F0',
              paddingLeft: i > 0 ? 10 : 0 },
          },
            React.createElement(Text, {
              style: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#94A3B8',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
            }, k),
            React.createElement(Text, {
              style: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#334155' },
            }, v),
          )
        ),
      ),

      /* Tags */
      React.createElement(View, { style: { flexDirection: 'row' } },
        React.createElement(View, {
          style: { paddingHorizontal: 9, paddingVertical: 4,
            backgroundColor: rgba(color, 0.1),
            borderWidth: 1, borderColor: rgba(color, 0.3),
            borderRadius: 4, marginRight: 6 },
        },
          React.createElement(Text, {
            style: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color,
              textTransform: 'uppercase', letterSpacing: 1.2 },
          }, 'Confidential'),
        ),
        React.createElement(View, {
          style: { paddingHorizontal: 9, paddingVertical: 4,
            borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4 },
        },
          React.createElement(Text, {
            style: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#64748B',
              textTransform: 'uppercase', letterSpacing: 1.2 },
          }, 'AI-Powered Analysis'),
        ),
      ),
    ),
  );

  /* ══════════════════════════════════════
     PAGE 2+ — CONTENT
  ══════════════════════════════════════ */
  let sn = 0;
  const sec = () => (++sn).toString().padStart(2, '0');

  const hasAnyData = rawData?.ga4 || rawData?.googleAds || rawData?.meta || rawData?.linkedin;

  const contentPage = React.createElement(Page, { key: 'content', size: 'A4', style: S.contentPage },
    React.createElement(RunningHeader, { agencyName, clientName, dateRange, color }),

    React.createElement(View, { style: { paddingBottom: 52 } },

      /* 01 — Platform Overview */
      hasAnyData
        ? React.createElement(View, {},
            React.createElement(SectionHeading, { num: sec(), title: 'Platform Overview', color }),
            React.createElement(OverviewTable, { rawData, color }),
          )
        : null,

      /* 02 — Google Analytics 4 */
      rawData?.ga4
        ? React.createElement(View, {},
            React.createElement(SectionHeading, { num: sec(), title: 'Google Analytics 4  —  Website Performance', color }),
            React.createElement(KpiGrid, {
              color, errorColor, perRow: 3,
              metrics: [
                { label: 'Sessions',
                  value: fmt(rawData.ga4.sessions),
                  delta: calcDelta(rawData.ga4.sessions, rawData.ga4.sessionsPrev) },
                { label: 'Unique Users',
                  value: fmt(rawData.ga4.users),
                  delta: calcDelta(rawData.ga4.users, rawData.ga4.usersPrev) },
                { label: 'Pageviews',
                  value: fmt(rawData.ga4.pageviews),
                  delta: calcDelta(rawData.ga4.pageviews, rawData.ga4.pageviewsPrev) },
                { label: 'Bounce Rate',
                  value: `${fmt(rawData.ga4.bounceRate * 100, 1)}%`,
                  delta: calcDelta(rawData.ga4.bounceRate, rawData.ga4.bounceRatePrev),
                  invertGood: true },
                { label: 'Conversion Rate',
                  value: `${fmt(rawData.ga4.conversionRate * 100, 2)}%`,
                  delta: calcDelta(rawData.ga4.conversionRate, rawData.ga4.conversionRatePrev) },
                { label: 'Avg. Session Duration',
                  value: fmtDur(rawData.ga4.avgSessionDuration),
                  delta: calcDelta(rawData.ga4.avgSessionDuration, rawData.ga4.avgSessionDurationPrev) },
              ],
            }),
          )
        : null,

      /* 03 — Google Ads */
      rawData?.googleAds
        ? React.createElement(View, {},
            React.createElement(SectionHeading, { num: sec(), title: 'Google Ads  —  Paid Search Performance', color }),
            React.createElement(KpiGrid, {
              color, errorColor, perRow: 4,
              metrics: [
                { label: 'Total Spend',
                  value: `$${fmt(rawData.googleAds.spend, 0)}`,
                  delta: calcDelta(rawData.googleAds.spend, rawData.googleAds.spendPrev),
                  invertGood: true },
                { label: 'Impressions',
                  value: fmt(rawData.googleAds.impressions),
                  delta: calcDelta(rawData.googleAds.impressions, rawData.googleAds.impressionsPrev) },
                { label: 'Clicks',
                  value: fmt(rawData.googleAds.clicks),
                  delta: calcDelta(rawData.googleAds.clicks, rawData.googleAds.clicksPrev) },
                { label: 'Click-Through Rate',
                  value: `${fmt(rawData.googleAds.ctr * 100, 2)}%`,
                  delta: calcDelta(rawData.googleAds.ctr, rawData.googleAds.ctrPrev) },
                { label: 'Cost per Click',
                  value: `$${fmt(rawData.googleAds.cpc, 2)}`,
                  delta: calcDelta(rawData.googleAds.cpc, rawData.googleAds.cpcPrev),
                  invertGood: true },
                { label: 'ROAS',
                  value: `${fmt(rawData.googleAds.roas, 2)}x`,
                  delta: calcDelta(rawData.googleAds.roas, rawData.googleAds.roasPrev) },
                { label: 'Conversions',
                  value: fmt(rawData.googleAds.conversions),
                  delta: calcDelta(rawData.googleAds.conversions, rawData.googleAds.conversionsPrev) },
                { label: 'Conversion Rate',
                  value: `${fmt((rawData.googleAds.conversionRate ?? 0) * 100, 2)}%`,
                  delta: calcDelta(rawData.googleAds.conversionRate, rawData.googleAds.conversionRatePrev) },
              ],
            }),
          )
        : null,

      /* 04 — Meta Ads */
      rawData?.meta
        ? React.createElement(View, {},
            React.createElement(SectionHeading, { num: sec(), title: 'Meta Ads  —  Social Advertising', color }),
            React.createElement(KpiGrid, {
              color, errorColor, perRow: 4,
              metrics: [
                { label: 'Total Spend',
                  value: `$${fmt(rawData.meta.spend, 0)}`,
                  delta: calcDelta(rawData.meta.spend, rawData.meta.spendPrev),
                  invertGood: true },
                { label: 'Impressions',
                  value: fmt(rawData.meta.impressions),
                  delta: calcDelta(rawData.meta.impressions, rawData.meta.impressionsPrev) },
                { label: 'Reach',
                  value: fmt(rawData.meta.reach),
                  delta: calcDelta(rawData.meta.reach, rawData.meta.reachPrev) },
                { label: 'Clicks',
                  value: fmt(rawData.meta.clicks),
                  delta: calcDelta(rawData.meta.clicks, rawData.meta.clicksPrev) },
                { label: 'Click-Through Rate',
                  value: `${fmt(rawData.meta.ctr * 100, 3)}%`,
                  delta: calcDelta(rawData.meta.ctr, rawData.meta.ctrPrev) },
                { label: 'Cost per Mille',
                  value: `$${fmt(rawData.meta.cpm, 2)}`,
                  delta: calcDelta(rawData.meta.cpm, rawData.meta.cpmPrev),
                  invertGood: true },
                { label: 'ROAS',
                  value: `${fmt(rawData.meta.roas, 2)}x`,
                  delta: calcDelta(rawData.meta.roas, rawData.meta.roasPrev) },
                { label: 'Creative Frequency',
                  value: rawData.meta.frequency ? fmt(rawData.meta.frequency, 2) : '—',
                  delta: calcDelta(rawData.meta.frequency, rawData.meta.frequencyPrev),
                  invertGood: true },
              ],
            }),
          )
        : null,

      /* 05 — LinkedIn Ads */
      rawData?.linkedin
        ? React.createElement(View, {},
            React.createElement(SectionHeading, { num: sec(), title: 'LinkedIn Ads  —  B2B Advertising', color }),
            React.createElement(KpiGrid, {
              color, errorColor, perRow: 4,
              metrics: [
                { label: 'Total Spend',
                  value: `$${fmt(rawData.linkedin.spend, 0)}`,
                  delta: calcDelta(rawData.linkedin.spend, rawData.linkedin.spendPrev),
                  invertGood: true },
                { label: 'Impressions',
                  value: fmt(rawData.linkedin.impressions),
                  delta: calcDelta(rawData.linkedin.impressions, rawData.linkedin.impressionsPrev) },
                { label: 'Clicks',
                  value: fmt(rawData.linkedin.clicks),
                  delta: calcDelta(rawData.linkedin.clicks, rawData.linkedin.clicksPrev) },
                { label: 'Click-Through Rate',
                  value: `${fmt(rawData.linkedin.ctr * 100, 2)}%`,
                  delta: calcDelta(rawData.linkedin.ctr, rawData.linkedin.ctrPrev) },
                { label: 'Cost per Click',
                  value: `$${fmt(rawData.linkedin.cpc, 2)}`,
                  delta: calcDelta(rawData.linkedin.cpc, rawData.linkedin.cpcPrev),
                  invertGood: true },
                { label: 'CPM',
                  value: `$${fmt(rawData.linkedin.cpm, 2)}`,
                  delta: calcDelta(rawData.linkedin.cpm, rawData.linkedin.cpmPrev),
                  invertGood: true },
                { label: 'Conversions',
                  value: fmt(rawData.linkedin.conversions),
                  delta: calcDelta(rawData.linkedin.conversions, rawData.linkedin.conversionsPrev) },
                { label: 'Lead Gen Forms',
                  value: fmt(rawData.linkedin.leadGenFormCompletions),
                  delta: calcDelta(rawData.linkedin.leadGenFormCompletions, rawData.linkedin.leadGenFormCompletionsPrev) },
              ],
            }),
          )
        : null,

      /* AI Narrative */
      narrative
        ? React.createElement(View, {},
            React.createElement(SectionHeading, {
              num: sec(), title: 'AI Insight Analysis  —  Cross-Channel Intelligence', color,
            }),

            /* AI header card */
            React.createElement(View, {
              style: [S.narrHdr, {
                borderColor: rgba(color, 0.2),
                backgroundColor: rgba(color, 0.05),
              }],
            },
              React.createElement(View, { style: [S.narrBadge, { backgroundColor: color }] },
                React.createElement(Text, { style: S.narrBadgeTxt }, 'AI'),
              ),
              React.createElement(View, { style: { flex: 1 } },
                React.createElement(Text, { style: S.narrHdrTitle },
                  'Cross-Channel Performance Narrative'),
                React.createElement(Text, { style: S.narrHdrSub },
                  [
                    `${tone} tone`,
                    narrative.wordCount ? `${narrative.wordCount} words` : null,
                    report.aiModel ? `Model: ${report.aiModel}` : null,
                  ].filter(Boolean).join('  ·  '),
                ),
              ),
            ),

            /* Sections 1–4: ternary-safe rendering */
            narrative.executiveSummary
              ? React.createElement(NarrBlock, {
                  num: 1, title: 'Executive Summary',
                  body: narrative.executiveSummary, color,
                })
              : null,

            narrative.campaignPerformance
              ? React.createElement(NarrBlock, {
                  num: 2, title: 'Campaign Performance',
                  body: narrative.campaignPerformance, color,
                })
              : null,

            narrative.keyWins
              ? React.createElement(NarrBlock, {
                  num: 3, title: 'Key Wins',
                  body: narrative.keyWins, color,
                })
              : null,

            narrative.areasOfConcern
              ? React.createElement(NarrBlock, {
                  num: 4, title: 'Areas of Concern',
                  body: narrative.areasOfConcern, color,
                })
              : null,

            /* Recommendations card */
            narrative.recommendations
              ? React.createElement(View, {
                  style: [S.narrRecWrap, {
                    backgroundColor: rgba(color, 0.05),
                    borderColor: rgba(color, 0.22),
                  }],
                },
                  React.createElement(View, { style: S.narrRecHead },
                    React.createElement(View, {
                      style: [S.narrNumCircle, { backgroundColor: color, marginRight: 10 }],
                    },
                      React.createElement(Text, { style: S.narrNumTxt }, '5'),
                    ),
                    React.createElement(Text, { style: [S.narrRecTitle, { color }] },
                      'Strategic Recommendations'),
                  ),
                  React.createElement(Text, { style: S.narrRecBody },
                    narrative.recommendations),
                )
              : null,

            /* Watermark for non-Agency tiers */
            !isAgency
              ? React.createElement(Text, { style: S.watermark },
                  'Generated with ReportCraft AI  ·  reportcraft.ai')
              : null,
          )
        : null,
    ),

    React.createElement(RunningFooter, { agencyName, genDate }),
  );

  const doc = React.createElement(Document,
    {
      title:   `${clientName} — Performance Report — ${dateRange}`,
      author:  agencyName,
      creator: 'ReportCraft AI',
      subject: 'Digital Marketing Performance Report',
    },
    coverPage,
    contentPage,
  );

  return await renderToBuffer(doc);
}

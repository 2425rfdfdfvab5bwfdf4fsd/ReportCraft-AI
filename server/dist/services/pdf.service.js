"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDF = generatePDF;
const react_1 = __importDefault(require("react"));
const renderer_1 = require("@react-pdf/renderer");
const renderer_2 = require("@react-pdf/renderer");
/* ═══════════════════════════════════════════════════════════════
   PAGE CONSTANTS
═══════════════════════════════════════════════════════════════ */
const PW = 595; // A4 width  pt
const PH = 842; // A4 height pt
const ML = 50; // margin left/right
const CW = PW - ML * 2; // content width = 495 pt
const CARD_GAP = 7; // gap between KPI cards
/* ═══════════════════════════════════════════════════════════════
   COLOUR HELPERS
═══════════════════════════════════════════════════════════════ */
function hex2rgb(hex) {
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
function rgba(hex, alpha) {
    const [r, g, b] = hex2rgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
}
/** Return a lighter tint of hex (amount 0–1) */
function lighten(hex, amount) {
    const [r, g, b] = hex2rgb(hex);
    const l = (v) => Math.min(255, Math.round(v + (255 - v) * amount));
    const h = (v) => l(v).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
}
/* ═══════════════════════════════════════════════════════════════
   FORMAT HELPERS
═══════════════════════════════════════════════════════════════ */
function fmt(v, dec = 0) {
    if (v == null || isNaN(v))
        return '—';
    return v.toLocaleString('en-US', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
    });
}
function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    });
}
function fmtDateShort(d) {
    return new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}
function fmtDur(s) {
    if (!s)
        return '—';
    const m = Math.floor(s / 60), sec = Math.round(s % 60);
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
function calcDelta(cur, prev) {
    if (!cur || !prev || prev === 0)
        return { pct: 0, label: 'N/A', isPos: true, isNA: true };
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
const S = renderer_1.StyleSheet.create({
    /* Pages */
    coverPage: { width: PW, height: PH, backgroundColor: '#ffffff', padding: 0 },
    contentPage: { paddingHorizontal: ML, paddingTop: 0, paddingBottom: 0,
        backgroundColor: '#ffffff' },
    /* Running header */
    rHdrBar: { height: 4 },
    rHdrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 7, paddingBottom: 7,
        borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
    rHdrL: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569',
        textTransform: 'uppercase', letterSpacing: 0.8 },
    rHdrR: { fontSize: 7, fontFamily: 'Helvetica', color: '#94A3B8' },
    /* Running footer */
    rFtrLine: { height: 0.5, backgroundColor: '#E2E8F0', marginBottom: 6 },
    rFtrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 12 },
    rFtrTxt: { fontSize: 6.5, color: '#94A3B8', fontFamily: 'Helvetica' },
    /* Section heading */
    secWrap: { marginTop: 20, marginBottom: 10 },
    secRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
    secNum: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase',
        letterSpacing: 1.5, marginRight: 6 },
    secBar: { width: 3, height: 11, borderRadius: 2, marginRight: 7 },
    secTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
    secRule: { height: 1 },
    /* KPI card — NOTE: no gap/flexWrap here, managed per-row */
    kpiRow: { flexDirection: 'row', marginBottom: CARD_GAP },
    kpiCard: { backgroundColor: '#F8FAFC', borderRadius: 5, padding: 11,
        borderTopWidth: 3, flexDirection: 'column' },
    kpiLbl: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#64748B',
        textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 5 },
    kpiVal: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0F172A',
        lineHeight: 1, marginBottom: 6 },
    kpiBarTrack: { height: 3, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 5 },
    kpiDeltaPos: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#16A34A' },
    kpiDeltaNeg: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#DC2626' },
    kpiDeltaNA: { fontSize: 7, fontFamily: 'Helvetica', color: '#94A3B8' },
    /* Overview table */
    tblWrap: { marginBottom: 16, borderRadius: 5, overflow: 'hidden',
        borderWidth: 1, borderColor: '#E2E8F0' },
    tblHead: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 11 },
    tblHCell: { fontSize: 6.5, fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase', letterSpacing: 0.8 },
    tblRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 11,
        alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#F1F5F9' },
    tblDot: { width: 6, height: 6, borderRadius: 3, marginRight: 7 },
    tblPlatName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
    tblCell: { alignItems: 'flex-end' },
    tblVal: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
    tblSub: { fontSize: 6, fontFamily: 'Helvetica', color: '#94A3B8', marginTop: 1 },
    tblDPos: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16A34A', textAlign: 'right' },
    tblDNeg: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#DC2626', textAlign: 'right' },
    tblDNA: { fontSize: 8, fontFamily: 'Helvetica', color: '#94A3B8', textAlign: 'right' },
    /* AI narrative */
    narrHdr: { flexDirection: 'row', alignItems: 'center', padding: 14,
        borderRadius: 6, marginBottom: 14, borderWidth: 1 },
    narrBadge: { width: 38, height: 38, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    narrBadgeTxt: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
    narrHdrTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
    narrHdrSub: { fontSize: 7.5, fontFamily: 'Helvetica', color: '#64748B', marginTop: 3 },
    narrBlock: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 13 },
    narrNumCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center',
        justifyContent: 'center', marginRight: 10, marginTop: 1, flexShrink: 0 },
    narrNumTxt: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
    narrContent: { flex: 1 },
    narrTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#0F172A', marginBottom: 4 },
    narrBody: { fontSize: 8.5, color: '#334155', fontFamily: 'Helvetica', lineHeight: 1.75 },
    narrRecWrap: { borderRadius: 5, padding: 13, marginTop: 4, borderWidth: 1 },
    narrRecHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
    narrRecTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
    narrRecBody: { fontSize: 8.5, color: '#475569', fontFamily: 'Helvetica', lineHeight: 1.75 },
    watermark: { fontSize: 7, color: '#CBD5E1', textAlign: 'center',
        marginTop: 18, fontFamily: 'Helvetica', letterSpacing: 0.5 },
});
/* ═══════════════════════════════════════════════════════════════
   COVER BACKGROUND — pure View panels + small SVGs for circles
   Avoids full-page SVG which triggers react-pdf wrap warnings
═══════════════════════════════════════════════════════════════ */
function CoverBackground({ color }) {
    const light = lighten(color, 0.88);
    const medium = lighten(color, 0.72);
    return react_1.default.createElement(renderer_1.View, { style: { position: 'absolute', top: 0, left: 0, width: PW, height: PH } }, 
    /* White base */
    react_1.default.createElement(renderer_1.View, { style: { position: 'absolute', top: 0, left: 0,
            width: PW, height: PH, backgroundColor: '#ffffff' } }), 
    /* Dark navy left panel */
    react_1.default.createElement(renderer_1.View, { style: { position: 'absolute', top: 0, left: 0,
            width: 208, height: PH, backgroundColor: '#0F172A' } }), 
    /* Brand accent stripe */
    react_1.default.createElement(renderer_1.View, { style: { position: 'absolute', top: 0, left: 200,
            width: 8, height: PH, backgroundColor: color } }), 
    /* Decorative circles — left panel (small SVG, 280×280) */
    react_1.default.createElement(renderer_1.View, { style: { position: 'absolute', top: 0, left: 0,
            width: 280, height: 280 } }, react_1.default.createElement(renderer_1.Svg, { width: 280, height: 280, viewBox: '0 0 280 280' }, react_1.default.createElement(renderer_1.Circle, { cx: 104, cy: 148, r: 110, fill: color, fillOpacity: 0.1 }), react_1.default.createElement(renderer_1.Circle, { cx: 104, cy: 148, r: 60, fill: color, fillOpacity: 0.12 }))), 
    /* Decorative circles — top-right corner (small SVG, 200×200) */
    react_1.default.createElement(renderer_1.View, { style: { position: 'absolute', top: 0, right: 0,
            width: 200, height: 200 } }, react_1.default.createElement(renderer_1.Svg, { width: 200, height: 200, viewBox: '0 0 200 200' }, react_1.default.createElement(renderer_1.Circle, { cx: 200, cy: 0, r: 160, fill: light }), react_1.default.createElement(renderer_1.Circle, { cx: 180, cy: 20, r: 80, fill: medium }), react_1.default.createElement(renderer_1.Circle, { cx: 200, cy: 0, r: 45, fill: color, fillOpacity: 0.18 }))), 
    /* Decorative arc — bottom-right (small SVG, 160×160) */
    react_1.default.createElement(renderer_1.View, { style: { position: 'absolute', bottom: 0, right: 0,
            width: 160, height: 160 } }, react_1.default.createElement(renderer_1.Svg, { width: 160, height: 160, viewBox: '0 0 160 160' }, react_1.default.createElement(renderer_1.Circle, { cx: 180, cy: 160, r: 110, fill: light }))));
}
/* ═══════════════════════════════════════════════════════════════
   RUNNING HEADER & FOOTER
═══════════════════════════════════════════════════════════════ */
function RunningHeader({ agencyName, clientName, dateRange, color }) {
    return react_1.default.createElement(renderer_1.View, { style: { marginBottom: 16 }, fixed: true }, react_1.default.createElement(renderer_1.View, { style: [S.rHdrBar, { backgroundColor: color }] }), react_1.default.createElement(renderer_1.View, { style: S.rHdrRow }, react_1.default.createElement(renderer_1.Text, { style: S.rHdrL }, agencyName), react_1.default.createElement(renderer_1.Text, { style: S.rHdrR }, `${clientName}  ·  ${dateRange}`)));
}
function RunningFooter({ agencyName, genDate }) {
    return react_1.default.createElement(renderer_1.View, { style: { position: 'absolute', bottom: 0, left: 0, right: 0 }, fixed: true }, react_1.default.createElement(renderer_1.View, { style: S.rFtrLine }), react_1.default.createElement(renderer_1.View, { style: S.rFtrRow }, react_1.default.createElement(renderer_1.Text, { style: S.rFtrTxt }, `${agencyName}  ·  Strictly Confidential`), react_1.default.createElement(renderer_1.Text, { style: S.rFtrTxt }, `Generated ${genDate}`), react_1.default.createElement(renderer_1.Text, {
        style: S.rFtrTxt,
        render: ({ pageNumber, totalPages }) => `Page ${pageNumber - 1} of ${totalPages - 1}`,
    })));
}
/* ═══════════════════════════════════════════════════════════════
   SECTION HEADING
═══════════════════════════════════════════════════════════════ */
function SectionHeading({ num, title, color }) {
    return react_1.default.createElement(renderer_1.View, { style: S.secWrap }, react_1.default.createElement(renderer_1.View, { style: S.secRow }, react_1.default.createElement(renderer_1.Text, { style: [S.secNum, { color }] }, num), react_1.default.createElement(renderer_1.View, { style: [S.secBar, { backgroundColor: color }] }), react_1.default.createElement(renderer_1.Text, { style: S.secTitle }, title)), react_1.default.createElement(renderer_1.View, { style: [S.secRule, { backgroundColor: rgba(color, 0.18) }] }));
}
function KpiCard({ label, value, delta, invertGood, color, errorColor, width }) {
    const good = invertGood ? !delta.isPos : delta.isPos;
    const dStyle = delta.isNA ? S.kpiDeltaNA : (good ? S.kpiDeltaPos : S.kpiDeltaNeg);
    const arrow = delta.isNA ? '' : (delta.isPos ? '▲  ' : '▼  ');
    const dText = delta.isNA ? 'No prior data'
        : arrow + delta.label.replace(/^[+-]/, '') + ' vs prior period';
    // Trend bar fill width clamped to [3, cardContentWidth]
    const barFull = width - 22; // card padding 11pt each side
    const barFill = Math.max(3, Math.min(barFull, (Math.abs(delta.pct) / 60) * barFull));
    const barColor = delta.isNA ? '#CBD5E1' : (good ? '#16A34A' : errorColor);
    return react_1.default.createElement(renderer_1.View, {
        style: [S.kpiCard, { borderTopColor: color, width, marginRight: 0 }],
    }, react_1.default.createElement(renderer_1.Text, { style: S.kpiLbl }, label), react_1.default.createElement(renderer_1.Text, { style: S.kpiVal }, value), 
    // Trend bar
    react_1.default.createElement(renderer_1.View, { style: S.kpiBarTrack }, react_1.default.createElement(renderer_1.View, {
        style: { height: 3, width: barFill, backgroundColor: barColor, borderRadius: 2 },
    })), react_1.default.createElement(renderer_1.Text, { style: dStyle }, dText));
}
function KpiGrid({ metrics, color, errorColor, perRow = 4 }) {
    const cardW = (CW - (perRow - 1) * CARD_GAP) / perRow;
    const rows = [];
    for (let i = 0; i < metrics.length; i += perRow)
        rows.push(metrics.slice(i, i + perRow));
    return react_1.default.createElement(renderer_1.View, { style: { marginBottom: 8 } }, ...rows.map((row, ri) => react_1.default.createElement(renderer_1.View, {
        key: ri,
        style: [S.kpiRow, { marginBottom: ri < rows.length - 1 ? CARD_GAP : 0 }],
        wrap: false,
    }, ...row.map((m, ci) => react_1.default.createElement(renderer_1.View, {
        key: m.label,
        style: { marginRight: ci < row.length - 1 ? CARD_GAP : 0 },
    }, react_1.default.createElement(KpiCard, { ...m, color, errorColor, width: cardW }))))));
}
function OverviewTable({ rawData, color }) {
    const rows = [];
    if (rawData?.ga4)
        rows.push({
            platform: 'Google Analytics 4', dotColor: '#4285F4',
            primary: fmt(rawData.ga4.sessions), primaryLbl: 'Sessions',
            secondary: `${fmt(rawData.ga4.conversionRate * 100, 2)}%`, secondaryLbl: 'Conv. Rate',
            d: calcDelta(rawData.ga4.sessions, rawData.ga4.sessionsPrev),
        });
    if (rawData?.googleAds)
        rows.push({
            platform: 'Google Ads', dotColor: '#FBBC05',
            primary: `$${fmt(rawData.googleAds.spend, 0)}`, primaryLbl: 'Ad Spend',
            secondary: `${fmt(rawData.googleAds.roas, 2)}x`, secondaryLbl: 'ROAS',
            d: calcDelta(rawData.googleAds.roas, rawData.googleAds.roasPrev),
        });
    if (rawData?.meta)
        rows.push({
            platform: 'Meta Ads', dotColor: '#0866FF',
            primary: `$${fmt(rawData.meta.spend, 0)}`, primaryLbl: 'Ad Spend',
            secondary: `${fmt(rawData.meta.roas, 2)}x`, secondaryLbl: 'ROAS',
            d: calcDelta(rawData.meta.roas, rawData.meta.roasPrev),
        });
    if (rawData?.linkedin)
        rows.push({
            platform: 'LinkedIn Ads', dotColor: '#0A66C2',
            primary: `$${fmt(rawData.linkedin.spend, 0)}`, primaryLbl: 'Ad Spend',
            secondary: fmt(rawData.linkedin.conversions), secondaryLbl: 'Conversions',
            d: calcDelta(rawData.linkedin.clicks, rawData.linkedin.clicksPrev),
        });
    if (!rows.length)
        return null;
    const col = { platform: 2.2, primary: 1.4, secondary: 1.4, delta: 1 };
    const total = col.platform + col.primary + col.secondary + col.delta;
    return react_1.default.createElement(renderer_1.View, { style: S.tblWrap }, 
    // Header
    react_1.default.createElement(renderer_1.View, { style: [S.tblHead, { backgroundColor: rgba(color, 0.07) }] }, react_1.default.createElement(renderer_1.Text, { style: [S.tblHCell, { flex: col.platform / total, color }] }, 'Data Source'), react_1.default.createElement(renderer_1.Text, { style: [S.tblHCell, { flex: col.primary / total, textAlign: 'right', color }] }, 'Primary'), react_1.default.createElement(renderer_1.Text, { style: [S.tblHCell, { flex: col.secondary / total, textAlign: 'right', color }] }, 'Secondary'), react_1.default.createElement(renderer_1.Text, { style: [S.tblHCell, { flex: col.delta / total, textAlign: 'right', color }] }, 'vs Prior')), 
    // Rows
    ...rows.map((r, i) => {
        const dStyle = r.d.isNA ? S.tblDNA : (r.d.isPos ? S.tblDPos : S.tblDNeg);
        const arrow = r.d.isNA ? '' : (r.d.isPos ? '▲ ' : '▼ ');
        const dText = r.d.isNA ? '—' : arrow + r.d.label.replace(/^[+-]/, '');
        return react_1.default.createElement(renderer_1.View, {
            key: i,
            style: [S.tblRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#FAFAFA' }],
        }, react_1.default.createElement(renderer_1.View, {
            style: { flex: col.platform / total, flexDirection: 'row', alignItems: 'center' },
        }, react_1.default.createElement(renderer_1.View, { style: [S.tblDot, { backgroundColor: r.dotColor }] }), react_1.default.createElement(renderer_1.Text, { style: S.tblPlatName }, r.platform)), react_1.default.createElement(renderer_1.View, { style: [S.tblCell, { flex: col.primary / total }] }, react_1.default.createElement(renderer_1.Text, { style: S.tblVal }, r.primary), react_1.default.createElement(renderer_1.Text, { style: S.tblSub }, r.primaryLbl)), react_1.default.createElement(renderer_1.View, { style: [S.tblCell, { flex: col.secondary / total }] }, react_1.default.createElement(renderer_1.Text, { style: S.tblVal }, r.secondary), react_1.default.createElement(renderer_1.Text, { style: S.tblSub }, r.secondaryLbl)), react_1.default.createElement(renderer_1.Text, { style: [dStyle, { flex: col.delta / total }] }, dText));
    }));
}
/* ═══════════════════════════════════════════════════════════════
   NARRATIVE BLOCK  (numbered section)
═══════════════════════════════════════════════════════════════ */
function NarrBlock({ num, title, body, color }) {
    return react_1.default.createElement(renderer_1.View, { style: S.narrBlock }, react_1.default.createElement(renderer_1.View, { style: [S.narrNumCircle, { backgroundColor: color }] }, react_1.default.createElement(renderer_1.Text, { style: S.narrNumTxt }, String(num))), react_1.default.createElement(renderer_1.View, { style: S.narrContent }, react_1.default.createElement(renderer_1.Text, { style: S.narrTitle }, title), react_1.default.createElement(renderer_1.Text, { style: S.narrBody }, body)));
}
/* ═══════════════════════════════════════════════════════════════
   COVER — STAT BOX
═══════════════════════════════════════════════════════════════ */
function CoverStat({ label, value, color, isLast }) {
    return react_1.default.createElement(renderer_1.View, {
        style: {
            flex: 1,
            paddingRight: isLast ? 0 : 18,
            borderRightWidth: isLast ? 0 : 0.5,
            borderRightColor: '#E2E8F0',
            marginRight: isLast ? 0 : 18,
        },
    }, react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 18, fontFamily: 'Helvetica-Bold', color, lineHeight: 1 },
    }, value), react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 6.5, fontFamily: 'Helvetica', color: '#64748B',
            textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },
    }, label));
}
/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
/**
 * Renders a full A4 PDF report and returns it as a buffer.
 *
 * @param report  Minimal report fields (dates, rawData, narrative, tone).
 * @param agency  Agency branding and subscription tier.
 * @param client  Client display name.
 */
async function generatePDF(report, agency, client) {
    const rawData = report.rawData;
    const narrative = report.narrative;
    const color = agency?.brandColor || '#6366F1';
    const errorColor = '#DC2626';
    const isAgency = ['AGENCY', 'AGENCY_PRO'].includes(agency?.subscriptionTier);
    const agencyName = agency?.name || 'ReportCraft AI';
    const clientName = client?.name || 'Client';
    const startDate = fmtDate(report.dateRangeStart);
    const endDate = fmtDate(report.dateRangeEnd);
    const shortStart = fmtDateShort(report.dateRangeStart);
    const shortEnd = fmtDateShort(report.dateRangeEnd);
    const dateRange = `${shortStart} – ${shortEnd}`;
    const genDate = fmtDate(new Date());
    const tone = report.narrativeTone
        ? report.narrativeTone.charAt(0).toUpperCase() + report.narrativeTone.slice(1)
        : 'Professional';
    // Active platforms
    const platforms = [
        rawData?.ga4 ? 'Google Analytics 4' : null,
        rawData?.googleAds ? 'Google Ads' : null,
        rawData?.meta ? 'Meta Ads' : null,
        rawData?.linkedin ? 'LinkedIn Ads' : null,
    ].filter(Boolean);
    // Cover stats (only defined-and-non-zero values shown)
    const totalSpend = (rawData?.googleAds?.spend || 0) + (rawData?.meta?.spend || 0) + (rawData?.linkedin?.spend || 0);
    const topRoas = Math.max(rawData?.googleAds?.roas || 0, rawData?.meta?.roas || 0);
    const totalConversions = (rawData?.googleAds?.conversions || 0) + (rawData?.linkedin?.conversions || 0);
    // Build stats array — only include items with meaningful values
    const coverStats = [];
    if (totalSpend > 0)
        coverStats.push({ label: 'Total Ad Spend', value: `$${fmt(totalSpend, 0)}` });
    if (totalConversions > 0)
        coverStats.push({ label: 'Total Conversions', value: fmt(totalConversions) });
    if (topRoas > 0)
        coverStats.push({ label: 'Best ROAS', value: `${fmt(topRoas, 2)}x` });
    if (platforms.length > 0)
        coverStats.push({ label: 'Data Sources', value: String(platforms.length) });
    /* ══════════════════════════════════════
       PAGE 1 — COVER
    ══════════════════════════════════════ */
    const tocItems = [
        rawData?.ga4 || rawData?.googleAds || rawData?.meta || rawData?.linkedin
            ? 'Platform Overview' : null,
        rawData?.ga4 ? 'Google Analytics 4' : null,
        rawData?.googleAds ? 'Google Ads' : null,
        rawData?.meta ? 'Meta Ads' : null,
        rawData?.linkedin ? 'LinkedIn Ads' : null,
        narrative ? 'AI Insight Analysis' : null,
    ].filter(Boolean);
    const coverPage = react_1.default.createElement(renderer_1.Page, { key: 'cover', size: 'A4', style: S.coverPage }, react_1.default.createElement(CoverBackground, { color }), 
    /* ── LEFT PANEL ── */
    react_1.default.createElement(renderer_1.View, {
        style: { position: 'absolute', top: 0, left: 0, width: 200, height: PH,
            paddingHorizontal: 28, paddingTop: 32, paddingBottom: 28,
            flexDirection: 'column' },
    }, 
    /* Top: agency brand mark */
    react_1.default.createElement(renderer_1.View, { style: { marginBottom: 0 } }, agency?.logoUrl
        ? react_1.default.createElement(renderer_1.Image, {
            src: agency.logoUrl,
            style: { height: 22, maxWidth: 110, objectFit: 'contain' },
        })
        : react_1.default.createElement(renderer_1.View, {
            style: { flexDirection: 'row', alignItems: 'center' },
        }, react_1.default.createElement(renderer_1.View, { style: { width: 6, height: 6, borderRadius: 3,
                backgroundColor: color, marginRight: 6, flexShrink: 0 } }), react_1.default.createElement(renderer_1.Text, {
            style: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
        }, agencyName))), 
    /* Center: client identity (flex: 1 + justifyContent: center keeps it vertically centred) */
    react_1.default.createElement(renderer_1.View, {
        style: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
    }, react_1.default.createElement(renderer_1.View, { style: { height: 0.5,
            backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 18 } }), react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 6, fontFamily: 'Helvetica-Bold', color,
            textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 14 },
    }, 'Performance Report'), react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#ffffff',
            lineHeight: 1.15, marginBottom: 12 },
    }, clientName), react_1.default.createElement(renderer_1.View, { style: { height: 2, width: 24, backgroundColor: color,
            borderRadius: 1, marginBottom: 12 } }), react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 8, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.65 },
    }, `${startDate}\n– ${endDate}`), react_1.default.createElement(renderer_1.View, { style: { height: 0.5,
            backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 18 } })), 
    /* Bottom: table of contents */
    react_1.default.createElement(renderer_1.View, {}, react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 5, fontFamily: 'Helvetica-Bold', color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase', letterSpacing: 2.2, marginBottom: 10 },
    }, 'Contents'), ...tocItems.map((item, i) => react_1.default.createElement(renderer_1.View, {
        key: i,
        style: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
    }, react_1.default.createElement(renderer_1.View, { style: { width: 3, height: 3, borderRadius: 2,
            backgroundColor: color, marginRight: 7, flexShrink: 0, marginTop: 1 } }), react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 7, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.55)' },
    }, item))), react_1.default.createElement(renderer_1.View, { style: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)',
            marginTop: 10, marginBottom: 8 } }), react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 5.5, fontFamily: 'Helvetica', color: 'rgba(255,255,255,0.22)' },
    }, 'Strictly Confidential'))), 
    /* ── RIGHT PANEL ── */
    react_1.default.createElement(renderer_1.View, {
        style: { position: 'absolute', top: 0, left: 212, right: 0, height: PH,
            paddingTop: 44, paddingRight: 38, paddingBottom: 32,
            flexDirection: 'column' },
    }, 
    /* Eyebrow */
    react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color,
            textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 16 },
    }, 'AI-Powered Report'), 
    /* Hero heading */
    react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#0F172A',
            lineHeight: 1.12, letterSpacing: -0.3 },
    }, 'Digital\nPerformance\nAnalysis'), react_1.default.createElement(renderer_1.View, { style: { height: 3, width: 32, backgroundColor: color,
            borderRadius: 2, marginTop: 10, marginBottom: 14 } }), react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 8.5, fontFamily: 'Helvetica', color: '#64748B',
            lineHeight: 1.65, marginBottom: 0 },
    }, `Cross-channel performance analysis combining ${platforms.length > 0 ? platforms.join(', ') : 'all connected platforms'}. AI-driven insights and strategic recommendations.`), 
    /* Stat strip — only rendered when there are stats */
    coverStats.length > 0
        ? react_1.default.createElement(renderer_1.View, { style: { marginTop: 22 } }, react_1.default.createElement(renderer_1.View, { style: { height: 0.5, backgroundColor: '#E2E8F0',
                marginBottom: 18 } }), react_1.default.createElement(renderer_1.View, { style: { flexDirection: 'row', marginBottom: 18 } }, ...coverStats.map((s, i) => react_1.default.createElement(CoverStat, {
            key: s.label, label: s.label, value: s.value, color,
            isLast: i === coverStats.length - 1,
        }))), react_1.default.createElement(renderer_1.View, { style: { height: 0.5, backgroundColor: '#E2E8F0' } }))
        : null, 
    /* ── Bottom block pushed down with marginTop: auto ── */
    react_1.default.createElement(renderer_1.View, { style: { marginTop: 'auto' } }, 
    /* Thin rule above metadata */
    react_1.default.createElement(renderer_1.View, { style: { height: 0.5, backgroundColor: '#E2E8F0',
            marginBottom: 14 } }), 
    /* Metadata grid */
    react_1.default.createElement(renderer_1.View, { style: { flexDirection: 'row', marginBottom: 14 } }, ...[
        { k: 'Prepared by', v: agencyName },
        { k: 'Report Period', v: dateRange },
        { k: 'Generated', v: genDate },
        { k: 'AI Tone', v: tone },
    ].map(({ k, v }, i) => react_1.default.createElement(renderer_1.View, {
        key: k,
        style: { flex: 1,
            paddingRight: i < 3 ? 10 : 0,
            borderRightWidth: i < 3 ? 0.5 : 0,
            borderRightColor: '#E2E8F0',
            paddingLeft: i > 0 ? 10 : 0 },
    }, react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#94A3B8',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    }, k), react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#334155' },
    }, v)))), 
    /* Tags */
    react_1.default.createElement(renderer_1.View, { style: { flexDirection: 'row' } }, react_1.default.createElement(renderer_1.View, {
        style: { paddingHorizontal: 8, paddingVertical: 4,
            backgroundColor: rgba(color, 0.1),
            borderWidth: 1, borderColor: rgba(color, 0.3),
            borderRadius: 3, marginRight: 6 },
    }, react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 6, fontFamily: 'Helvetica-Bold', color,
            textTransform: 'uppercase', letterSpacing: 1.2 },
    }, 'Confidential')), react_1.default.createElement(renderer_1.View, {
        style: { paddingHorizontal: 8, paddingVertical: 4,
            borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 3 },
    }, react_1.default.createElement(renderer_1.Text, {
        style: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#64748B',
            textTransform: 'uppercase', letterSpacing: 1.2 },
    }, 'AI-Powered Analysis'))))));
    /* ══════════════════════════════════════
       PAGE 2+ — CONTENT
    ══════════════════════════════════════ */
    let sn = 0;
    const sec = () => (++sn).toString().padStart(2, '0');
    const hasAnyData = rawData?.ga4 || rawData?.googleAds || rawData?.meta || rawData?.linkedin;
    const contentPage = react_1.default.createElement(renderer_1.Page, { key: 'content', size: 'A4', style: S.contentPage }, react_1.default.createElement(RunningHeader, { agencyName, clientName, dateRange, color }), react_1.default.createElement(renderer_1.View, { style: { paddingBottom: 52 } }, 
    /* 01 — Platform Overview */
    hasAnyData
        ? react_1.default.createElement(renderer_1.View, {}, react_1.default.createElement(SectionHeading, { num: sec(), title: 'Platform Overview', color }), react_1.default.createElement(OverviewTable, { rawData, color }))
        : null, 
    /* 02 — Google Analytics 4 */
    rawData?.ga4
        ? react_1.default.createElement(renderer_1.View, {}, react_1.default.createElement(SectionHeading, { num: sec(), title: 'Google Analytics 4  —  Website Performance', color }), react_1.default.createElement(KpiGrid, {
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
        }))
        : null, 
    /* 03 — Google Ads */
    rawData?.googleAds
        ? react_1.default.createElement(renderer_1.View, {}, react_1.default.createElement(SectionHeading, { num: sec(), title: 'Google Ads  —  Paid Search Performance', color }), react_1.default.createElement(KpiGrid, {
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
        }))
        : null, 
    /* 04 — Meta Ads */
    rawData?.meta
        ? react_1.default.createElement(renderer_1.View, {}, react_1.default.createElement(SectionHeading, { num: sec(), title: 'Meta Ads  —  Social Advertising', color }), react_1.default.createElement(KpiGrid, {
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
        }))
        : null, 
    /* 05 — LinkedIn Ads */
    rawData?.linkedin
        ? react_1.default.createElement(renderer_1.View, {}, react_1.default.createElement(SectionHeading, { num: sec(), title: 'LinkedIn Ads  —  B2B Advertising', color }), react_1.default.createElement(KpiGrid, {
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
        }))
        : null, 
    /* AI Narrative */
    narrative
        ? react_1.default.createElement(renderer_1.View, {}, react_1.default.createElement(SectionHeading, {
            num: sec(), title: 'AI Insight Analysis  —  Cross-Channel Intelligence', color,
        }), 
        /* AI header card */
        react_1.default.createElement(renderer_1.View, {
            style: [S.narrHdr, {
                    borderColor: rgba(color, 0.2),
                    backgroundColor: rgba(color, 0.05),
                }],
        }, react_1.default.createElement(renderer_1.View, { style: [S.narrBadge, { backgroundColor: color }] }, react_1.default.createElement(renderer_1.Text, { style: S.narrBadgeTxt }, 'AI')), react_1.default.createElement(renderer_1.View, { style: { flex: 1 } }, react_1.default.createElement(renderer_1.Text, { style: S.narrHdrTitle }, 'Cross-Channel Performance Narrative'), react_1.default.createElement(renderer_1.Text, { style: S.narrHdrSub }, [
            `${tone} tone`,
            narrative.wordCount ? `${narrative.wordCount} words` : null,
            report.aiModel ? `Model: ${report.aiModel}` : null,
        ].filter(Boolean).join('  ·  ')))), 
        /* Sections 1–4: ternary-safe rendering */
        narrative.executiveSummary
            ? react_1.default.createElement(NarrBlock, {
                num: 1, title: 'Executive Summary',
                body: narrative.executiveSummary, color,
            })
            : null, narrative.campaignPerformance
            ? react_1.default.createElement(NarrBlock, {
                num: 2, title: 'Campaign Performance',
                body: narrative.campaignPerformance, color,
            })
            : null, narrative.keyWins
            ? react_1.default.createElement(NarrBlock, {
                num: 3, title: 'Key Wins',
                body: narrative.keyWins, color,
            })
            : null, narrative.areasOfConcern
            ? react_1.default.createElement(NarrBlock, {
                num: 4, title: 'Areas of Concern',
                body: narrative.areasOfConcern, color,
            })
            : null, 
        /* Recommendations card */
        narrative.recommendations
            ? react_1.default.createElement(renderer_1.View, {
                style: [S.narrRecWrap, {
                        backgroundColor: rgba(color, 0.05),
                        borderColor: rgba(color, 0.22),
                    }],
            }, react_1.default.createElement(renderer_1.View, { style: S.narrRecHead }, react_1.default.createElement(renderer_1.View, {
                style: [S.narrNumCircle, { backgroundColor: color, marginRight: 10 }],
            }, react_1.default.createElement(renderer_1.Text, { style: S.narrNumTxt }, '5')), react_1.default.createElement(renderer_1.Text, { style: [S.narrRecTitle, { color }] }, 'Strategic Recommendations')), react_1.default.createElement(renderer_1.Text, { style: S.narrRecBody }, narrative.recommendations))
            : null, 
        /* Watermark for non-Agency tiers */
        !isAgency
            ? react_1.default.createElement(renderer_1.Text, { style: S.watermark }, 'Generated with ReportCraft AI  ·  reportcraft.ai')
            : null)
        : null), react_1.default.createElement(RunningFooter, { agencyName, genDate }));
    const doc = react_1.default.createElement(renderer_1.Document, {
        title: `${clientName} — Performance Report — ${dateRange}`,
        author: agencyName,
        creator: 'ReportCraft AI',
        subject: 'Digital Marketing Performance Report',
    }, coverPage, contentPage);
    return await (0, renderer_2.renderToBuffer)(doc);
}
//# sourceMappingURL=pdf.service.js.map
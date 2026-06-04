import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 44, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 18, borderBottomWidth: 2 },
  logo: { width: 110, height: 36, objectFit: 'contain' },
  agencyName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  headerRight: { alignItems: 'flex-end' },
  headerReportTitle: { fontSize: 13, fontWeight: 'bold', color: '#0F172A', textAlign: 'right' },
  headerDateRange: { fontSize: 9, color: '#64748B', textAlign: 'right', marginTop: 3 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, marginTop: 22, paddingBottom: 5, borderBottomWidth: 1.5 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 6, marginTop: 8 },
  kpiCard: { flex: 1, padding: 11, borderRadius: 6, borderWidth: 1 },
  kpiLabel: { fontSize: 7.5, color: '#64748B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 17, fontWeight: 'bold', color: '#0F172A' },
  kpiDelta: { fontSize: 8.5, marginTop: 3 },
  positive: { color: '#16A34A' },
  negative: { color: '#DC2626' },
  neutral: { color: '#94A3B8' },
  narrativeSectionWrap: { padding: 14, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  narrativeSectionTitle: { fontSize: 10.5, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  narrativeBody: { fontSize: 9.5, lineHeight: 1.75, color: '#334155' },
  aiHeader: { padding: 14, borderRadius: 8, borderWidth: 1, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiHeaderBadge: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  aiHeaderBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#ffffff' },
  aiHeaderTitle: { fontSize: 12, fontWeight: 'bold', color: '#0F172A' },
  aiHeaderSub: { fontSize: 8.5, color: '#64748B', marginTop: 2 },
  footer: { position: 'absolute', bottom: 22, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 },
  footerText: { fontSize: 8, color: '#94A3B8' },
  watermark: { fontSize: 7, color: '#CBD5E1', textAlign: 'center', marginTop: 32 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
});

function fmt(v: number | undefined | null, decimals = 0): string {
  if (v === undefined || v === null || isNaN(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function delta(current: number, prev: number): { label: string; isPos: boolean; isNA: boolean } {
  if (!prev || prev === 0) return { label: 'N/A', isPos: true, isNA: true };
  const pct = ((current - prev) / prev) * 100;
  const arrow = pct >= 0 ? '↑' : '↓';
  return { label: `${arrow} ${Math.abs(pct).toFixed(1)}%`, isPos: pct >= 0, isNA: false };
}

function KpiCard({ label, value, d, invertGood = false, color }: {
  label: string; value: string; d: ReturnType<typeof delta>; invertGood?: boolean; color: string;
}) {
  const isGood = invertGood ? !d.isPos : d.isPos;
  const deltaStyle = d.isNA ? styles.neutral : (isGood ? styles.positive : styles.negative);
  return React.createElement(View, { style: [styles.kpiCard, { borderColor: color + '30', backgroundColor: color + '06' }] },
    React.createElement(Text, { style: styles.kpiLabel }, label),
    React.createElement(Text, { style: [styles.kpiValue, { color }] }, value),
    React.createElement(Text, { style: [styles.kpiDelta, deltaStyle] }, d.label),
  );
}

function KpiRow({ metrics, color }: { metrics: { label: string; value: string; d: ReturnType<typeof delta>; invertGood?: boolean }[]; color: string }) {
  const chunks: (typeof metrics)[] = [];
  for (let i = 0; i < metrics.length; i += 4) chunks.push(metrics.slice(i, i + 4));
  return React.createElement(View, {},
    ...chunks.map((chunk, ci) =>
      React.createElement(View, { key: ci, style: [styles.kpiRow, { marginBottom: ci < chunks.length - 1 ? 6 : 16 }] },
        ...chunk.map(m => React.createElement(KpiCard, { key: m.label, label: m.label, value: m.value, d: m.d, invertGood: m.invertGood, color }))
      )
    )
  );
}

function NarrativeBlock({ title, body, color }: { title: string; body: string; color: string }) {
  const clean = title.replace(/^[\p{Emoji}\s]+/u, '').trim();
  return React.createElement(View, { style: styles.narrativeSectionWrap },
    React.createElement(Text, { style: [styles.narrativeSectionTitle, { color }] }, clean),
    React.createElement(Text, { style: styles.narrativeBody }, body),
  );
}

export async function generatePDF(report: any, agency: any, client: any): Promise<Buffer> {
  const rawData   = report.rawData as any;
  const narrative = report.narrative as any;
  const brand     = agency?.brandColor || '#6366F1';
  const isAgency  = ['AGENCY', 'AGENCY_PRO'].includes(agency?.subscriptionTier);

  const docEl = React.createElement(Document, { title: `${client?.name} — Performance Report` },
    React.createElement(Page, { size: 'A4', style: styles.page },

      /* ── Header ── */
      React.createElement(View, { style: [styles.header, { borderBottomColor: brand }] },
        agency?.logoUrl
          ? React.createElement(Image, { src: agency.logoUrl, style: styles.logo })
          : React.createElement(Text, { style: [styles.agencyName, { color: brand }] }, agency?.name || 'Agency'),
        React.createElement(View, { style: styles.headerRight },
          React.createElement(Text, { style: styles.headerReportTitle }, `${client?.name} — Performance Report`),
          React.createElement(Text, { style: styles.headerDateRange },
            `${new Date(report.dateRangeStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(report.dateRangeEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          ),
        ),
      ),

      /* ── GA4 ── */
      rawData?.ga4 && React.createElement(View, {},
        React.createElement(Text, { style: [styles.sectionTitle, { borderBottomColor: brand, color: brand }] }, 'Google Analytics 4'),
        React.createElement(KpiRow, {
          color: brand,
          metrics: [
            { label: 'Sessions',          value: fmt(rawData.ga4.sessions),                           d: delta(rawData.ga4.sessions, rawData.ga4.sessionsPrev) },
            { label: 'Users',             value: fmt(rawData.ga4.users),                              d: delta(rawData.ga4.users, rawData.ga4.usersPrev) },
            { label: 'Pageviews',         value: fmt(rawData.ga4.pageviews),                          d: delta(rawData.ga4.pageviews, rawData.ga4.pageviewsPrev) },
            { label: 'Bounce Rate',       value: `${fmt(rawData.ga4.bounceRate * 100, 1)}%`,          d: delta(rawData.ga4.bounceRate, rawData.ga4.bounceRatePrev), invertGood: true },
            { label: 'Conv. Rate',        value: `${fmt(rawData.ga4.conversionRate * 100, 2)}%`,      d: delta(rawData.ga4.conversionRate, rawData.ga4.conversionRatePrev) },
            { label: 'Avg. Session',      value: (() => { const s = rawData.ga4.avgSessionDuration; if (!s) return '—'; const m = Math.floor(s/60); const sec = Math.round(s%60); return m > 0 ? `${m}m ${sec}s` : `${sec}s`; })(), d: delta(rawData.ga4.avgSessionDuration, rawData.ga4.avgSessionDurationPrev) },
          ],
        }),
      ),

      /* ── Google Ads ── */
      rawData?.googleAds && React.createElement(View, {},
        React.createElement(Text, { style: [styles.sectionTitle, { borderBottomColor: brand, color: brand }] }, 'Google Ads'),
        React.createElement(KpiRow, {
          color: brand,
          metrics: [
            { label: 'Spend',       value: `$${fmt(rawData.googleAds.spend, 0)}`,                        d: delta(rawData.googleAds.spend, rawData.googleAds.spendPrev),                     invertGood: true },
            { label: 'Impressions', value: fmt(rawData.googleAds.impressions),                             d: delta(rawData.googleAds.impressions, rawData.googleAds.impressionsPrev) },
            { label: 'Clicks',      value: fmt(rawData.googleAds.clicks),                                  d: delta(rawData.googleAds.clicks, rawData.googleAds.clicksPrev) },
            { label: 'CTR',         value: `${fmt(rawData.googleAds.ctr * 100, 2)}%`,                     d: delta(rawData.googleAds.ctr, rawData.googleAds.ctrPrev) },
            { label: 'CPC',         value: `$${fmt(rawData.googleAds.cpc, 2)}`,                            d: delta(rawData.googleAds.cpc, rawData.googleAds.cpcPrev),                         invertGood: true },
            { label: 'ROAS',        value: `${fmt(rawData.googleAds.roas, 2)}x`,                           d: delta(rawData.googleAds.roas, rawData.googleAds.roasPrev) },
            { label: 'Conversions', value: fmt(rawData.googleAds.conversions),                             d: delta(rawData.googleAds.conversions, rawData.googleAds.conversionsPrev) },
          ],
        }),
      ),

      /* ── Meta Ads ── */
      rawData?.meta && React.createElement(View, {},
        React.createElement(Text, { style: [styles.sectionTitle, { borderBottomColor: brand, color: brand }] }, 'Meta Ads'),
        React.createElement(KpiRow, {
          color: brand,
          metrics: [
            { label: 'Spend',       value: `$${fmt(rawData.meta.spend, 0)}`,                 d: delta(rawData.meta.spend, rawData.meta.spendPrev),               invertGood: true },
            { label: 'Impressions', value: fmt(rawData.meta.impressions),                     d: delta(rawData.meta.impressions, rawData.meta.impressionsPrev) },
            { label: 'Reach',       value: fmt(rawData.meta.reach),                           d: delta(rawData.meta.reach, rawData.meta.reachPrev) },
            { label: 'Clicks',      value: fmt(rawData.meta.clicks),                          d: delta(rawData.meta.clicks, rawData.meta.clicksPrev) },
            { label: 'CTR',         value: `${fmt(rawData.meta.ctr * 100, 3)}%`,              d: delta(rawData.meta.ctr, rawData.meta.ctrPrev) },
            { label: 'CPM',         value: `$${fmt(rawData.meta.cpm, 2)}`,                    d: delta(rawData.meta.cpm, rawData.meta.cpmPrev),                   invertGood: true },
            { label: 'ROAS',        value: `${fmt(rawData.meta.roas, 2)}x`,                   d: delta(rawData.meta.roas, rawData.meta.roasPrev) },
          ],
        }),
      ),

      /* ── AI Narrative ── */
      narrative && React.createElement(View, {},
        React.createElement(View, { style: [styles.aiHeader, { borderColor: brand + '28', backgroundColor: brand + '08' }] },
          React.createElement(View, { style: [styles.aiHeaderBadge, { backgroundColor: brand }] },
            React.createElement(Text, { style: styles.aiHeaderBadgeText }, 'AI'),
          ),
          React.createElement(View, {},
            React.createElement(Text, { style: styles.aiHeaderTitle }, 'AI Insight Write'),
            React.createElement(Text, { style: styles.aiHeaderSub },
              `${report.narrativeTone ? report.narrativeTone.charAt(0).toUpperCase() + report.narrativeTone.slice(1) : 'Professional'} tone${narrative.wordCount ? ` · ${narrative.wordCount} words` : ''}${report.aiModel ? ` · ${report.aiModel}` : ''}`
            ),
          ),
        ),
        ...[
          { title: '📊 Executive Summary',    body: narrative.executiveSummary },
          { title: '📈 Campaign Performance', body: narrative.campaignPerformance },
          { title: '🏆 Key Wins',             body: narrative.keyWins },
          { title: '⚠️ Areas of Concern',     body: narrative.areasOfConcern },
          { title: '🎯 Recommendations',      body: narrative.recommendations },
        ].filter(s => s.body).map(s =>
          React.createElement(NarrativeBlock, { key: s.title, title: s.title, body: s.body, color: brand })
        )
      ),

      /* ── Footer ── */
      React.createElement(View, { style: styles.footer, fixed: true },
        React.createElement(Text, { style: styles.footerText }, agency?.name || 'ReportCraft AI'),
        React.createElement(Text, { style: styles.footerText }, `Generated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`),
        React.createElement(Text, { style: styles.footerText, render: ({ pageNumber, totalPages }: any) => `Page ${pageNumber} of ${totalPages}` }),
      ),

      !isAgency && React.createElement(Text, { style: styles.watermark }, 'Generated with ReportCraft AI · reportcraft.ai'),
    )
  );

  return await renderToBuffer(docEl);
}

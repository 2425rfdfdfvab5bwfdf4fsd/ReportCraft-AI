import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font, Svg, Rect, Polyline, Image } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#6366F1' },
  logo: { width: 120, height: 40, objectFit: 'contain' },
  headerTitle: { fontSize: 10, color: '#64748B', textAlign: 'right' },
  agencyName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 20, paddingBottom: 4, borderBottomWidth: 1 },
  bodyText: { fontSize: 10, lineHeight: 1.6, color: '#334155', marginBottom: 6 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 8 },
  kpiCard: { flex: 1, padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  kpiLabel: { fontSize: 8, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  kpiDelta: { fontSize: 9, marginTop: 2 },
  positive: { color: '#16A34A' },
  negative: { color: '#DC2626' },
  narrativeCard: { padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  narrativeSectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  narrativeBody: { fontSize: 10, lineHeight: 1.7, color: '#334155' },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 },
  footerText: { fontSize: 8, color: '#94A3B8' },
  badge: { fontSize: 7, color: '#94A3B8', textAlign: 'center', marginTop: 30 },
});

function formatDelta(current: number, prev: number): string {
  if (!prev || prev === 0) return 'N/A';
  const pct = ((current - prev) / prev) * 100;
  return `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}%`;
}

function deltaColor(current: number, prev: number): object {
  if (!prev || prev === 0) return {};
  return current >= prev ? styles.positive : styles.negative;
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 200, h = 60, barW = Math.floor(w / data.length) - 2;
  return React.createElement(Svg, { width: w, height: h },
    ...data.map((v, i) => {
      const barH = (v / max) * (h - 10);
      return React.createElement(Rect, {
        key: i, x: i * (barW + 2), y: h - barH - 5, width: barW, height: barH, fill: color, opacity: 0.8,
      });
    })
  );
}

export async function generatePDF(report: any, agency: any, client: any): Promise<Buffer> {
  const rawData = report.rawData as any;
  const narrative = report.narrative as any;
  const brandColor = agency?.brandColor || '#6366F1';
  const isAgencyTier = ['AGENCY', 'AGENCY_PRO'].includes(agency?.subscriptionTier);

  const el = React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header
      React.createElement(View, { style: [styles.header, { borderBottomColor: brandColor }] },
        agency?.logoUrl
          ? React.createElement(Image, { src: agency.logoUrl, style: styles.logo })
          : React.createElement(Text, { style: styles.agencyName }, agency?.name || 'Agency'),
        React.createElement(View, {},
          React.createElement(Text, { style: { fontSize: 12, fontWeight: 'bold', color: '#1E293B', textAlign: 'right' } }, `${client?.name} — Performance Report`),
          React.createElement(Text, { style: styles.headerTitle },
            `${new Date(report.dateRangeStart).toLocaleDateString()} – ${new Date(report.dateRangeEnd).toLocaleDateString()}`
          ),
        )
      ),

      // KPI Cards
      rawData?.ga4 && React.createElement(View, {},
        React.createElement(Text, { style: [styles.sectionTitle, { borderBottomColor: brandColor, color: brandColor }] }, 'Google Analytics 4'),
        React.createElement(View, { style: styles.kpiRow },
          ...([
            { label: 'Sessions', value: rawData.ga4.sessions?.toLocaleString(), delta: formatDelta(rawData.ga4.sessions, rawData.ga4.sessionsPrev), isPos: rawData.ga4.sessions >= rawData.ga4.sessionsPrev },
            { label: 'Users', value: rawData.ga4.users?.toLocaleString(), delta: formatDelta(rawData.ga4.users, rawData.ga4.usersPrev), isPos: rawData.ga4.users >= rawData.ga4.usersPrev },
            { label: 'Bounce Rate', value: `${(rawData.ga4.bounceRate * 100).toFixed(1)}%`, delta: formatDelta(rawData.ga4.bounceRate, rawData.ga4.bounceRatePrev), isPos: rawData.ga4.bounceRate <= rawData.ga4.bounceRatePrev },
            { label: 'Conv. Rate', value: `${(rawData.ga4.conversionRate * 100).toFixed(2)}%`, delta: formatDelta(rawData.ga4.conversionRate, rawData.ga4.conversionRatePrev), isPos: rawData.ga4.conversionRate >= rawData.ga4.conversionRatePrev },
          ].map(k => React.createElement(View, { key: k.label, style: [styles.kpiCard, { borderColor: brandColor + '40' }] },
            React.createElement(Text, { style: styles.kpiLabel }, k.label),
            React.createElement(Text, { style: [styles.kpiValue, { color: brandColor }] }, k.value),
            React.createElement(Text, { style: [styles.kpiDelta, k.isPos ? styles.positive : styles.negative] }, k.delta),
          )))
        ),
      ),

      rawData?.googleAds && React.createElement(View, {},
        React.createElement(Text, { style: [styles.sectionTitle, { borderBottomColor: brandColor, color: brandColor }] }, 'Google Ads'),
        React.createElement(View, { style: styles.kpiRow },
          ...([
            { label: 'Spend', value: `$${rawData.googleAds.spend?.toFixed(0)}`, delta: formatDelta(rawData.googleAds.spend, rawData.googleAds.spendPrev), isPos: false },
            { label: 'CTR', value: `${(rawData.googleAds.ctr * 100).toFixed(2)}%`, delta: formatDelta(rawData.googleAds.ctr, rawData.googleAds.ctrPrev), isPos: rawData.googleAds.ctr >= rawData.googleAds.ctrPrev },
            { label: 'ROAS', value: `${rawData.googleAds.roas?.toFixed(2)}x`, delta: formatDelta(rawData.googleAds.roas, rawData.googleAds.roasPrev), isPos: rawData.googleAds.roas >= rawData.googleAds.roasPrev },
            { label: 'Conversions', value: String(rawData.googleAds.conversions), delta: formatDelta(rawData.googleAds.conversions, rawData.googleAds.conversionsPrev), isPos: rawData.googleAds.conversions >= rawData.googleAds.conversionsPrev },
          ].map(k => React.createElement(View, { key: k.label, style: [styles.kpiCard, { borderColor: brandColor + '40' }] },
            React.createElement(Text, { style: styles.kpiLabel }, k.label),
            React.createElement(Text, { style: [styles.kpiValue, { color: brandColor }] }, k.value),
            React.createElement(Text, { style: [styles.kpiDelta, k.isPos ? styles.positive : styles.negative] }, k.delta),
          )))
        ),
      ),

      // AI Narrative
      narrative && React.createElement(View, {},
        React.createElement(Text, { style: [styles.sectionTitle, { borderBottomColor: brandColor, color: brandColor }] }, 'AI Insight Write'),
        ...[
          { title: 'Executive Summary', body: narrative.executiveSummary },
          { title: 'Campaign Performance', body: narrative.campaignPerformance },
          { title: 'Key Wins', body: narrative.keyWins },
          { title: 'Areas of Concern', body: narrative.areasOfConcern },
          { title: 'Recommendations', body: narrative.recommendations },
        ].map(s => React.createElement(View, { key: s.title, style: styles.narrativeCard },
          React.createElement(Text, { style: [styles.narrativeSectionTitle, { color: brandColor }] }, s.title),
          React.createElement(Text, { style: styles.narrativeBody }, s.body || ''),
        ))
      ),

      // Footer
      React.createElement(View, { style: styles.footer, fixed: true },
        React.createElement(Text, { style: styles.footerText }, agency?.name || ''),
        React.createElement(Text, { style: styles.footerText }, `Generated ${new Date().toLocaleDateString()}`),
        React.createElement(Text, { style: styles.footerText, render: ({ pageNumber, totalPages }: any) => `Page ${pageNumber} of ${totalPages}` }),
      ),

      !isAgencyTier && React.createElement(Text, { style: styles.badge }, 'Generated with ReportCraft AI'),
    )
  );

  return await renderToBuffer(el);
}

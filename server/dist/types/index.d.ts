/**
 * Shared server-side domain types for ReportCraft AI.
 *
 * These interfaces describe the shape of platform data (RawData) and AI
 * narrative output (NarrativeResult) as they flow through the PDF service,
 * AI service, and background jobs.  Import from here — never re-declare.
 */
export interface GA4Data {
    sessions: number;
    sessionsPrev: number;
    bounceRate: number;
    bounceRatePrev: number;
    users: number;
    usersPrev: number;
    pageviews: number;
    pageviewsPrev: number;
    avgSessionDuration: number;
    avgSessionDurationPrev: number;
    conversionRate: number;
    conversionRatePrev: number;
}
export interface GoogleAdsData {
    impressions: number;
    impressionsPrev: number;
    clicks: number;
    clicksPrev: number;
    ctr: number;
    ctrPrev: number;
    spend: number;
    spendPrev: number;
    cpc: number;
    cpcPrev: number;
    conversions: number;
    conversionsPrev: number;
    conversionRate: number;
    conversionRatePrev: number;
    roas: number;
    roasPrev: number;
}
export interface MetaData {
    impressions: number;
    impressionsPrev: number;
    reach: number;
    reachPrev: number;
    clicks: number;
    clicksPrev: number;
    ctr: number;
    ctrPrev: number;
    spend: number;
    spendPrev: number;
    cpm: number;
    cpmPrev: number;
    roas: number;
    roasPrev: number;
}
export interface LinkedInData {
    spend: number;
    spendPrev: number;
    impressions: number;
    impressionsPrev: number;
    clicks: number;
    clicksPrev: number;
    ctr: number;
    ctrPrev: number;
    cpc: number;
    cpcPrev: number;
    cpm: number;
    cpmPrev: number;
    conversions: number;
    conversionsPrev: number;
    leadGenFormCompletions: number;
    leadGenFormCompletionsPrev: number;
}
/** All platform metric data for a single report period. */
export interface RawData {
    ga4?: GA4Data;
    googleAds?: GoogleAdsData;
    meta?: MetaData;
    linkedin?: LinkedInData;
}
/** Five-section narrative produced by the AI service. */
export interface NarrativeResult {
    executiveSummary: string;
    campaignPerformance: string;
    keyWins: string;
    areasOfConcern: string;
    recommendations: string;
    wordCount?: number;
    generatedAt?: string;
}
/** Minimal report fields required by generatePDF. */
export interface ReportInput {
    rawData: RawData | null;
    narrative: NarrativeResult | null;
    dateRangeStart: string | Date;
    dateRangeEnd: string | Date;
    narrativeTone?: string | null;
    aiModel?: string | null;
}
/** Minimal agency fields required by generatePDF. */
export interface AgencyInput {
    name?: string | null;
    logoUrl?: string | null;
    brandColor?: string | null;
    subscriptionTier?: string | null;
}
/** Minimal client fields required by generatePDF. */
export interface ClientInput {
    name?: string | null;
}
//# sourceMappingURL=index.d.ts.map
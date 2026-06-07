/**
 * Shared server-side domain types for ReportCraft AI.
 *
 * These interfaces describe the shape of platform data (RawData) and AI
 * narrative output (NarrativeResult) as they flow through the PDF service,
 * AI service, and background jobs.  Import from here — never re-declare.
 */

// ─── Platform metric shapes ───────────────────────────────────────────────────

export interface GA4Data {
  sessions: number;             sessionsPrev: number;
  bounceRate: number;           bounceRatePrev: number;
  users: number;                usersPrev: number;
  pageviews: number;            pageviewsPrev: number;
  avgSessionDuration: number;   avgSessionDurationPrev: number;
  conversionRate: number;       conversionRatePrev: number;
}

export interface GoogleAdsData {
  impressions: number;    impressionsPrev: number;
  clicks: number;         clicksPrev: number;
  ctr: number;            ctrPrev: number;
  spend: number;          spendPrev: number;
  cpc: number;            cpcPrev: number;
  conversions: number;    conversionsPrev: number;
  conversionRate: number; conversionRatePrev: number;
  roas: number;           roasPrev: number;
}

export interface MetaData {
  impressions: number;  impressionsPrev: number;
  reach: number;        reachPrev: number;
  clicks: number;       clicksPrev: number;
  ctr: number;          ctrPrev: number;
  spend: number;        spendPrev: number;
  cpm: number;          cpmPrev: number;
  roas: number;         roasPrev: number;
  /** Average number of times a unique user saw the ad — used for creative-fatigue analysis */
  frequency?:     number;
  frequencyPrev?: number;
}

export interface LinkedInData {
  spend: number;                      spendPrev: number;
  impressions: number;                impressionsPrev: number;
  clicks: number;                     clicksPrev: number;
  ctr: number;                        ctrPrev: number;
  cpc: number;                        cpcPrev: number;
  cpm: number;                        cpmPrev: number;
  conversions: number;                conversionsPrev: number;
  leadGenFormCompletions: number;     leadGenFormCompletionsPrev: number;
}

// ─── Aggregated report data ───────────────────────────────────────────────────

/** All platform metric data for a single report period. */
export interface RawData {
  ga4?:        GA4Data;
  googleAds?:  GoogleAdsData;
  meta?:       MetaData;
  linkedin?:   LinkedInData;
}

// ─── AI narrative output ──────────────────────────────────────────────────────

/** Five-section narrative produced by the AI service. */
export interface NarrativeResult {
  executiveSummary:    string;
  campaignPerformance: string;
  keyWins:             string;
  areasOfConcern:      string;
  recommendations:     string;
  wordCount?:          number;
  generatedAt?:        string;
}

// ─── PDF service input shapes ─────────────────────────────────────────────────

/** Minimal report fields required by generatePDF. */
export interface ReportInput {
  rawData:         RawData | null;
  narrative:       NarrativeResult | null;
  dateRangeStart:  string | Date;
  dateRangeEnd:    string | Date;
  narrativeTone?:  string | null;
  aiModel?:        string | null;
}

/** Minimal agency fields required by generatePDF (all optional so null is accepted). */
export interface AgencyInput {
  name?:              string | null;
  logoUrl?:           string | null;
  brandColor?:        string | null;
  subscriptionTier?:  string | null;
}

/**
 * Converts a Prisma Report record (where rawData/narrative are JsonValue) into
 * the typed ReportInput that generatePDF expects.
 *
 * The cast is safe because our application is the sole writer of these fields
 * and always stores a RawData / NarrativeResult-shaped object.
 */
export function toReportInput(report: {
  rawData:        unknown;
  narrative:      unknown;
  dateRangeStart: Date | string;
  dateRangeEnd:   Date | string;
  narrativeTone?: string | null;
  aiModel?:       string | null;
}): ReportInput {
  return {
    rawData:        report.rawData     as RawData        | null,
    narrative:      report.narrative   as NarrativeResult | null,
    dateRangeStart: report.dateRangeStart,
    dateRangeEnd:   report.dateRangeEnd,
    narrativeTone:  report.narrativeTone,
    aiModel:        report.aiModel,
  };
}

/** Minimal client fields required by generatePDF. */
export interface ClientInput {
  name?: string | null;
}

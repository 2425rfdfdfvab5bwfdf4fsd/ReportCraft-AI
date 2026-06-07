/**
 * Client-facing domain types for ReportCraft AI.
 *
 * These mirror the server-side types and describe the shape of data
 * returned by the API.  Use these in React components and API helpers
 * instead of typing everything as `any`.
 */

// ─── Platform metrics ─────────────────────────────────────────────────────────

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
}

export interface LinkedInData {
  spend: number;                    spendPrev: number;
  impressions: number;              impressionsPrev: number;
  clicks: number;                   clicksPrev: number;
  ctr: number;                      ctrPrev: number;
  cpc: number;                      cpcPrev: number;
  cpm: number;                      cpmPrev: number;
  conversions: number;              conversionsPrev: number;
  leadGenFormCompletions: number;   leadGenFormCompletionsPrev: number;
}

export interface RawData {
  ga4?:       GA4Data;
  googleAds?: GoogleAdsData;
  meta?:      MetaData;
  linkedin?:  LinkedInData;
}

// ─── AI narrative ─────────────────────────────────────────────────────────────

export interface NarrativeResult {
  executiveSummary:    string;
  campaignPerformance: string;
  keyWins:             string;
  areasOfConcern:      string;
  recommendations:     string;
  wordCount?:          number;
  generatedAt?:        string;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface Agency {
  id:                     string;
  name?:                  string | null;
  logoUrl?:               string | null;
  brandColor?:            string | null;
  subscriptionTier:       string;
  subscriptionStatus:     string;
  trialEndsAt?:           string | null;
  onboardingCompletedAt?: string | null;
  narrativeTone?:         string | null;
  clerkUserId?:           string;
  anomalyAlertsEnabled?:  boolean;
}

export interface Client {
  id:               string;
  name:             string;
  contactName?:     string | null;
  contactEmail?:    string | null;
  industry?:        string | null;
  logoUrl?:         string | null;
  goals?:           unknown;
  lastReportAt?:    string | null;
  archivedAt?:      string | null;
  reportSchedule?:  string | null;
}

export interface Report {
  id:                  string;
  clientId:            string;
  agencyId:            string;
  status:              'generating' | 'ready' | 'error';
  rawData:             RawData | null;
  narrative:           NarrativeResult | null;
  narrativeTone?:      string | null;
  aiModel?:            string | null;
  dateRangeStart:      string;
  dateRangeEnd:        string;
  shareEnabled:        boolean;
  shareToken?:         string | null;
  createdAt:           string;
  client?:             Pick<Client, 'id' | 'name'>;
}

export interface OAuthToken {
  id:               string;
  platform:         string;
  accountId?:       string | null;
  accountName?:     string | null;
  status:           string;
  errorMessage?:    string | null;
  tokenExpiresAt?:  string | null;
  lastRefreshedAt?: string | null;
  createdAt:        string;
}

export interface TeamMember {
  id:          string;
  clerkUserId: string;
  email:       string;
  name?:       string | null;
  role:        string;
  joinedAt?:   string | null;
  invitedAt:   string;
}

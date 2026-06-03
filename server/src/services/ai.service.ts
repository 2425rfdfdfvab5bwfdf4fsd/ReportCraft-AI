export interface NarrativeData {
  ga4?: { sessions: number; sessionsPrev: number; bounceRate: number; bounceRatePrev: number; users: number; usersPrev: number; pageviews: number; pageviewsPrev: number; avgSessionDuration: number; avgSessionDurationPrev: number; conversionRate: number; conversionRatePrev: number; };
  googleAds?: { impressions: number; impressionsPrev: number; clicks: number; clicksPrev: number; ctr: number; ctrPrev: number; spend: number; spendPrev: number; cpc: number; cpcPrev: number; conversions: number; conversionsPrev: number; conversionRate: number; conversionRatePrev: number; roas: number; roasPrev: number; };
  meta?: { impressions: number; impressionsPrev: number; reach: number; reachPrev: number; clicks: number; clicksPrev: number; ctr: number; ctrPrev: number; spend: number; spendPrev: number; cpm: number; cpmPrev: number; roas: number; roasPrev: number; };
  linkedin?: { impressions: number; impressionsPrev: number; clicks: number; clicksPrev: number; ctr: number; ctrPrev: number; spend: number; spendPrev: number; cpc: number; cpcPrev: number; conversions: number; conversionsPrev: number; };
}

export interface NarrativeResult {
  executiveSummary: string;
  campaignPerformance: string;
  keyWins: string;
  areasOfConcern: string;
  recommendations: string;
}

function buildPrompt(data: NarrativeData, tone: string, clientName: string, goals?: any): string {
  const toneInstructions: Record<string, string> = {
    professional: 'Use professional, data-driven language. Be precise and authoritative.',
    conversational: 'Use friendly, accessible language. Avoid jargon. Write like you\'re talking to a colleague.',
    executive: 'Use concise, high-level executive language. Focus on business impact and strategic implications.',
  };

  const delta = (current: number, prev: number) => prev === 0 ? 'N/A' : `${(((current - prev) / prev) * 100).toFixed(1)}%`;

  const metricsText = JSON.stringify({
    ...(data.ga4 && {
      ga4: {
        sessions: data.ga4.sessions,
        sessions_change: delta(data.ga4.sessions, data.ga4.sessionsPrev),
        bounce_rate: (data.ga4.bounceRate * 100).toFixed(1) + '%',
        bounce_rate_change: delta(data.ga4.bounceRate, data.ga4.bounceRatePrev),
        users: data.ga4.users,
        users_change: delta(data.ga4.users, data.ga4.usersPrev),
        conversion_rate: (data.ga4.conversionRate * 100).toFixed(2) + '%',
        conversion_rate_change: delta(data.ga4.conversionRate, data.ga4.conversionRatePrev),
      }
    }),
    ...(data.googleAds && {
      google_ads: {
        spend: '$' + data.googleAds.spend?.toFixed(0),
        spend_change: delta(data.googleAds.spend, data.googleAds.spendPrev),
        ctr: (data.googleAds.ctr * 100).toFixed(2) + '%',
        ctr_change: delta(data.googleAds.ctr, data.googleAds.ctrPrev),
        conversions: data.googleAds.conversions,
        conversions_change: delta(data.googleAds.conversions, data.googleAds.conversionsPrev),
        roas: data.googleAds.roas?.toFixed(2) + 'x',
        roas_change: delta(data.googleAds.roas, data.googleAds.roasPrev),
        cpc: '$' + data.googleAds.cpc?.toFixed(2),
        cpc_change: delta(data.googleAds.cpc, data.googleAds.cpcPrev),
      }
    }),
    ...(data.meta && {
      meta_ads: {
        spend: '$' + data.meta.spend?.toFixed(0),
        spend_change: delta(data.meta.spend, data.meta.spendPrev),
        ctr: (data.meta.ctr * 100).toFixed(2) + '%',
        ctr_change: delta(data.meta.ctr, data.meta.ctrPrev),
        roas: data.meta.roas?.toFixed(2) + 'x',
        roas_change: delta(data.meta.roas, data.meta.roasPrev),
        cpm: '$' + data.meta.cpm?.toFixed(2),
        cpm_change: delta(data.meta.cpm, data.meta.cpmPrev),
      }
    }),
  }, null, 2);

  return `You are an expert digital marketing analyst writing a performance report narrative for ${clientName}.

TONE INSTRUCTION: ${toneInstructions[tone] || toneInstructions.professional}

CRITICAL REQUIREMENT: When any metric changed by more than 10%, you MUST identify cross-channel causal correlations. For example: "Meta creative frequency exceeded 4.0, which suppressed CTR 23% — this is why GA4 bounce rate simultaneously increased despite higher paid traffic volume." This cross-channel analysis is the primary differentiator of this report.

PERFORMANCE DATA (current period vs. previous period):
${metricsText}

${goals ? `CLIENT GOALS: ${JSON.stringify(goals, null, 2)}` : ''}

Write a strategic narrative split into exactly these 5 sections. Each section should be 2-4 sentences with specific metric references and cross-channel insights where applicable.

Return ONLY valid JSON in this exact format:
{
  "executiveSummary": "...",
  "campaignPerformance": "...",
  "keyWins": "...",
  "areasOfConcern": "...",
  "recommendations": "..."
}

The total narrative should be 300-500 words. Include specific numbers from the data. Never make up data not provided.`;
}

export async function generateNarrative(
  data: NarrativeData,
  tone: string,
  clientName: string,
  goals?: any
): Promise<{ result: NarrativeResult; provider: string }> {
  const prompt = buildPrompt(data, tone, clientName, goals);

  // Try OpenAI first (lazy import)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = process.env.OPENAI_MODEL || 'gpt-4o';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }, { signal: controller.signal as any });

      clearTimeout(timeout);

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty OpenAI response');

      const parsed = JSON.parse(content) as NarrativeResult;
      return { result: parsed, provider: 'openai' };
    } catch (err: any) {
      const isRetryable = err?.status === 429 || err?.status === 500 || err?.status === 503 || err?.name === 'AbortError';
      if (!isRetryable) throw err;
      console.warn('OpenAI failed, falling back to Anthropic:', err.message);
    }
  }

  // Fallback to Anthropic (lazy import)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await anthropic.messages.create({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt + '\n\nRespond ONLY with valid JSON.' }],
      }, { signal: controller.signal as any } as any);

      clearTimeout(timeout);

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      if (!content) throw new Error('Empty Anthropic response');

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in Anthropic response');

      const parsed = JSON.parse(jsonMatch[0]) as NarrativeResult;
      return { result: parsed, provider: 'anthropic' };
    } catch (err: any) {
      console.error('Anthropic also failed:', err.message);
      throw new Error('Narrative generation failed. Please try again.');
    }
  }

  throw new Error('No AI provider configured');
}

export function generateMockNarrative(clientName: string): NarrativeResult {
  return {
    executiveSummary: `${clientName} delivered a strong performance this period, with meaningful improvements across paid channels offsetting slight organic softness. Overall digital investment efficiency improved with ROAS trending positively.`,
    campaignPerformance: `Google Ads demonstrated strong intent-capture efficiency with CTR improving 18% week-over-week, rising from 2.3% to 2.7%, while CPC decreased 8%. Meta Ads maintained stable reach metrics though frequency increased to 3.8, approaching the threshold where creative fatigue typically impacts engagement.`,
    keyWins: `The standout win this period was Google Ads conversion volume increasing 24%, driven by improved Quality Scores on branded terms. GA4 shows a 12% improvement in goal completion rate from paid traffic, confirming the bottom-funnel efficiency gains are real and attributable.`,
    areasOfConcern: `Meta creative frequency at 3.8 warrants immediate attention — historically, frequency above 4.0 correlates with a 15-23% CTR degradation and simultaneous GA4 bounce rate increase from paid social traffic. The current GA4 bounce rate from Meta traffic (64%) has already risen 7 points versus the prior period, suggesting early-stage creative fatigue.`,
    recommendations: `Prioritize Meta creative refresh within the next 7 days before frequency exceeds 4.0. Introduce 2-3 new creative variants targeting the top-performing audience segments. For Google Ads, capitalize on the strong conversion momentum by increasing bids on the top 20% of converting keywords by 15-20%. Review GA4 landing page performance for Meta traffic — a landing page optimization test could recover 30-40% of the bounce rate degradation independent of creative refresh.`,
  };
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNarrative = generateNarrative;
exports.generateMockNarrative = generateMockNarrative;
const config_1 = require("../config");
// ─── Tone instructions ────────────────────────────────────────────────────────
const TONE_INSTRUCTIONS = {
    professional: 'Write in a formal, data-driven tone. Use precise language and focus on measurable outcomes. Avoid colloquialisms.',
    conversational: 'Write in a warm, accessible, first-person tone. Use "we" and "your" to create partnership. Make insights feel approachable.',
    executive: 'Write in a concise, strategic, C-suite-focused tone. Lead with impact and bottom-line implications. Bullet-point thinking in prose form.',
};
// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Returns a formatted percentage-change string (e.g. "+12.3%" or "-4.1%").
 * Returns "0.0%" when either value is missing or the previous period is zero.
 */
function formatDelta(current, previous) {
    if (!current || !previous || previous === 0)
        return '0.0%';
    const pct = ((current - previous) / previous) * 100;
    return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
}
/**
 * Builds the structured JSON prompt sent to the AI model.
 * Goals are user-supplied freeform data, so they are typed as `unknown`.
 */
function buildPrompt(data, tone, clientName, goals) {
    const metrics = {
        ...(data.ga4 && {
            website_analytics: {
                sessions: data.ga4.sessions,
                sessions_change: formatDelta(data.ga4.sessions, data.ga4.sessionsPrev),
                bounce_rate: (data.ga4.bounceRate * 100).toFixed(1) + '%',
                bounce_rate_change: formatDelta(data.ga4.bounceRate, data.ga4.bounceRatePrev),
                users: data.ga4.users,
                users_change: formatDelta(data.ga4.users, data.ga4.usersPrev),
                conversion_rate: (data.ga4.conversionRate * 100).toFixed(2) + '%',
                conversion_rate_change: formatDelta(data.ga4.conversionRate, data.ga4.conversionRatePrev),
            },
        }),
        ...(data.googleAds && {
            google_ads: {
                spend: '$' + data.googleAds.spend?.toFixed(0),
                spend_change: formatDelta(data.googleAds.spend, data.googleAds.spendPrev),
                ctr: (data.googleAds.ctr * 100).toFixed(2) + '%',
                ctr_change: formatDelta(data.googleAds.ctr, data.googleAds.ctrPrev),
                conversions: data.googleAds.conversions,
                conversions_change: formatDelta(data.googleAds.conversions, data.googleAds.conversionsPrev),
                roas: data.googleAds.roas?.toFixed(2) + 'x',
                roas_change: formatDelta(data.googleAds.roas, data.googleAds.roasPrev),
                cpc: '$' + data.googleAds.cpc?.toFixed(2),
                cpc_change: formatDelta(data.googleAds.cpc, data.googleAds.cpcPrev),
            },
        }),
        ...(data.meta && {
            meta_ads: {
                spend: '$' + data.meta.spend?.toFixed(0),
                spend_change: formatDelta(data.meta.spend, data.meta.spendPrev),
                ctr: (data.meta.ctr * 100).toFixed(2) + '%',
                ctr_change: formatDelta(data.meta.ctr, data.meta.ctrPrev),
                roas: data.meta.roas?.toFixed(2) + 'x',
                roas_change: formatDelta(data.meta.roas, data.meta.roasPrev),
                cpm: '$' + data.meta.cpm?.toFixed(2),
                cpm_change: formatDelta(data.meta.cpm, data.meta.cpmPrev),
            },
        }),
    };
    return `You are an expert digital marketing analyst writing a performance report narrative for ${clientName}.

TONE INSTRUCTION: ${TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.professional}

CRITICAL REQUIREMENT: When any metric changed by more than 10%, you MUST identify cross-channel causal correlations. For example: "Meta creative frequency exceeded 4.0, which suppressed CTR 23% — this is why GA4 bounce rate simultaneously increased despite higher paid traffic volume." This cross-channel analysis is the primary differentiator of this report.

PERFORMANCE DATA (current period vs. previous period):
${JSON.stringify(metrics, null, 2)}

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
// ─── AI providers ─────────────────────────────────────────────────────────────
/**
 * Generates a five-section strategic narrative using OpenAI (primary) or
 * Anthropic Claude (fallback).  Throws if no AI provider is configured.
 *
 * @param data        Platform metrics for the current and previous period.
 * @param tone        One of: "professional" | "conversational" | "executive".
 * @param clientName  Used in the system prompt so the AI addresses the right client.
 * @param goals       Optional freeform client goals to include in the prompt.
 * @returns           The narrative sections and the model identifier used.
 */
async function generateNarrative(data, tone, clientName, goals) {
    const prompt = buildPrompt(data, tone, clientName, goals);
    // ── OpenAI (primary) ──
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const openaiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    if (openaiApiKey) {
        try {
            const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
            const openai = new OpenAI({ apiKey: openaiApiKey, ...(openaiBaseUrl && { baseURL: openaiBaseUrl }) });
            const model = config_1.config.ai.openaiModel;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), config_1.config.ai.requestTimeoutMs);
            const response = await openai.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: config_1.config.ai.temperature,
            }, { signal: controller.signal });
            clearTimeout(timeout);
            const content = response.choices[0]?.message?.content;
            if (!content)
                throw new Error('Empty OpenAI response');
            const parsed = JSON.parse(content);
            return { result: parsed, model: `openai/${model}` };
        }
        catch (err) {
            const e = err;
            const isRetryable = e?.status === 429 || e?.status === 500 || e?.status === 503 || e?.name === 'AbortError';
            if (!isRetryable)
                throw err;
            console.warn('OpenAI failed, falling back to Anthropic:', e.message);
        }
    }
    // ── Anthropic (fallback) ──
    if (process.env.ANTHROPIC_API_KEY) {
        try {
            const { default: Anthropic } = await Promise.resolve().then(() => __importStar(require('@anthropic-ai/sdk')));
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            const model = config_1.config.ai.anthropicModel;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), config_1.config.ai.requestTimeoutMs);
            const response = await anthropic.messages.create({
                model,
                max_tokens: config_1.config.ai.maxTokens,
                messages: [{ role: 'user', content: prompt + '\n\nRespond ONLY with valid JSON.' }],
            }, { signal: controller.signal });
            clearTimeout(timeout);
            const raw = response.content[0]?.type === 'text' ? response.content[0].text : '';
            if (!raw)
                throw new Error('Empty Anthropic response');
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No JSON found in Anthropic response');
            const parsed = JSON.parse(jsonMatch[0]);
            return { result: parsed, model: `anthropic/${model}` };
        }
        catch (err) {
            const e = err;
            console.error('Anthropic also failed:', e.message);
            throw new Error('Narrative generation failed. Please try again.');
        }
    }
    throw new Error('No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
}
/**
 * Returns a plausible-looking mock narrative for use in demo mode or
 * when no AI provider key is available.
 */
function generateMockNarrative(clientName) {
    return {
        executiveSummary: `${clientName} delivered a strong performance this period, with meaningful improvements across paid channels offsetting slight organic softness. Overall digital investment efficiency improved with ROAS trending positively.`,
        campaignPerformance: `Google Ads demonstrated strong intent-capture efficiency with CTR improving 18% week-over-week, rising from 2.3% to 2.7%, while CPC decreased 8%. Meta Ads maintained stable reach metrics though frequency increased to 3.8, approaching the threshold where creative fatigue typically impacts engagement.`,
        keyWins: `The standout win this period was Google Ads conversion volume increasing 24%, driven by improved Quality Scores on branded terms. GA4 shows a 12% improvement in goal completion rate from paid traffic, confirming the bottom-funnel efficiency gains are real and attributable.`,
        areasOfConcern: `Meta creative frequency at 3.8 warrants immediate attention — historically, frequency above 4.0 correlates with a 15-23% CTR degradation and simultaneous GA4 bounce rate increase from paid social traffic. The current GA4 bounce rate from Meta traffic (64%) has already risen 7 points versus the prior period, suggesting early-stage creative fatigue.`,
        recommendations: `Prioritize Meta creative refresh within the next 7 days before frequency exceeds 4.0. Introduce 2-3 new creative variants targeting the top-performing audience segments. For Google Ads, capitalize on the strong conversion momentum by increasing bids on the top 20% of converting keywords by 15-20%. Review GA4 landing page performance for Meta traffic — a landing page optimization test could recover 30-40% of the bounce rate degradation independent of creative refresh.`,
    };
}
//# sourceMappingURL=ai.service.js.map
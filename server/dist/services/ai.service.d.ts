import type { RawData, NarrativeResult } from '../types';
export type { NarrativeResult } from '../types';
/**
 * The subset of RawData that the AI narrative prompt uses.
 * LinkedIn data is not yet included in the prompt (no narrative template for it).
 */
export type NarrativeData = Pick<RawData, 'ga4' | 'googleAds' | 'meta'>;
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
export declare function generateNarrative(data: NarrativeData, tone: string, clientName: string, goals?: unknown): Promise<{
    result: NarrativeResult;
    model: string;
}>;
/**
 * Returns a plausible-looking mock narrative for use in demo mode or
 * when no AI provider key is available.
 */
export declare function generateMockNarrative(clientName: string): NarrativeResult;
//# sourceMappingURL=ai.service.d.ts.map
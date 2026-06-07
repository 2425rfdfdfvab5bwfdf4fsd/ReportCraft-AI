/**
 * Centralised application configuration for ReportCraft AI.
 *
 * All magic numbers, model names, and tuneable constants live here.
 * Environment variables take precedence where appropriate.
 * Import `config` instead of scattering literals across services.
 */
export const config = {
  /** AI provider settings */
  ai: {
    openaiModel:      process.env.OPENAI_MODEL      || 'gpt-4o',
    anthropicModel:   process.env.ANTHROPIC_MODEL   || 'claude-3-5-sonnet-20241022',
    requestTimeoutMs: 30_000,
    maxTokens:        2_048,
    temperature:      0.7,
  },

  /** Express rate-limiter windows and caps */
  rateLimits: {
    /** Global IP-based limiter applied to all routes */
    global: { windowMs: 60_000, max: 100 },
    /** Per-agency limiter applied to authenticated routes */
    auth:   { windowMs: 60_000, max: 60 },
    /** Strict limiter for the computationally-heavy report-generation endpoint */
    reportGen: {
      windowMs: 60_000,
      max: 10,
      message: {
        error: 'TOO_MANY_REQUESTS',
        message:
          'Rate limit exceeded. You can generate up to 10 reports per minute. Please try again shortly.',
      },
    },
  },

  /** Anomaly-detection job settings */
  anomaly: {
    /** Minimum absolute percentage change (0–1) to raise an alert */
    changeThreshold: 0.20,
  },

  /** Subscription trial durations */
  trial: {
    freeDurationDays:  14,
    demoDurationDays:  30,
  },

  /**
   * Maximum number of AI-generated reports per calendar month, keyed by
   * subscription tier.  `Infinity` means unlimited.
   */
  reportLimits: {
    FREE_TRIAL: Infinity,
    STARTER:    5,
    AGENCY:     Infinity,
    AGENCY_PRO: Infinity,
  } as Record<string, number>,

  /** OAuth flow settings */
  oauth: {
    /** How long a signed state token remains valid */
    stateExpiryMs: 10 * 60_000,
  },
} as const;

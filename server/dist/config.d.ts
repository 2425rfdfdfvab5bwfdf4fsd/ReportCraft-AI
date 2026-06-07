/**
 * Centralised application configuration for ReportCraft AI.
 *
 * All magic numbers, model names, and tuneable constants live here.
 * Environment variables take precedence where appropriate.
 * Import `config` instead of scattering literals across services.
 */
export declare const config: {
    /** AI provider settings */
    readonly ai: {
        readonly openaiModel: string;
        readonly anthropicModel: string;
        readonly requestTimeoutMs: 30000;
        readonly maxTokens: 2048;
        readonly temperature: 0.7;
    };
    /** Express rate-limiter windows and caps */
    readonly rateLimits: {
        /** Global IP-based limiter applied to all routes */
        readonly global: {
            readonly windowMs: 60000;
            readonly max: 100;
        };
        /** Per-agency limiter applied to authenticated routes */
        readonly auth: {
            readonly windowMs: 60000;
            readonly max: 60;
        };
        /** Strict limiter for the computationally-heavy report-generation endpoint */
        readonly reportGen: {
            readonly windowMs: 60000;
            readonly max: 10;
            readonly message: {
                readonly error: "TOO_MANY_REQUESTS";
                readonly message: "Rate limit exceeded. You can generate up to 10 reports per minute. Please try again shortly.";
            };
        };
    };
    /** Anomaly-detection job settings */
    readonly anomaly: {
        /** Minimum absolute percentage change (0–1) to raise an alert */
        readonly changeThreshold: 0.2;
    };
    /** Subscription trial durations */
    readonly trial: {
        readonly freeDurationDays: 14;
        readonly demoDurationDays: 30;
    };
    /** OAuth flow settings */
    readonly oauth: {
        /** How long a signed state token remains valid */
        readonly stateExpiryMs: number;
    };
};
//# sourceMappingURL=config.d.ts.map
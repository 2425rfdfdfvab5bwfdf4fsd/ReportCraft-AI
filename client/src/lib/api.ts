import axios from 'axios';
import toast from 'react-hot-toast';
import type { Agency, Client, Report, OAuthToken, TeamMember } from '../types';

// ─── Auth token singleton ─────────────────────────────────────────────────────
// Avoids coupling to `window` globals.  Call setAuthToken() from the Clerk
// provider (main.tsx) whenever a fresh token is obtained.

let _authToken: string | null = null;

/** Store the latest Clerk JWT so Axios can attach it to every request. */
export function setAuthToken(token: string | null): void {
  _authToken = token;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (_authToken) {
    config.headers.Authorization = `Bearer ${_authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status   = error.response?.status;
    const errCode  = error.response?.data?.error;

    if (status === 401) {
      window.location.href = '/sign-in?reason=session_expired';
    }

    if (status === 403) {
      if (errCode === 'ACCOUNT_READ_ONLY') {
        const sub    = error.response?.data?.subscriptionStatus as string | undefined;
        const reason = sub === 'trial_expired' || !sub ? 'trial_expired' : 'feature_locked';
        window.dispatchEvent(new CustomEvent('show-upgrade-modal', { detail: { reason } }));
      } else if (errCode === 'FEATURE_LOCKED') {
        window.dispatchEvent(new CustomEvent('show-upgrade-modal', { detail: { reason: 'feature_locked' } }));
      } else if (errCode === 'REPORT_LIMIT_REACHED') {
        window.dispatchEvent(new CustomEvent('show-upgrade-modal', { detail: { reason: 'report_limit' } }));
      }
    }

    if (status === 429) {
      toast.error('Too many requests — please wait a moment.');
      // Auto-retry after 5 seconds for safe read-only requests only
      if (error.config?.method?.toLowerCase() === 'get') {
        return new Promise((resolve, reject) =>
          setTimeout(() => api(error.config).then(resolve).catch(reject), 5_000)
        );
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Agency ───────────────────────────────────────────────────────────────────

export const agencyApi = {
  get:        ()                => api.get<Agency>('/agencies/me').then(r => r.data),
  update:     (data: Partial<Agency>) => api.put<Agency>('/agencies/me', data).then(r => r.data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<{ logoUrl: string }>('/agencies/me/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data);
  },
};

// ─── Clients ──────────────────────────────────────────────────────────────────

export const clientsApi = {
  list:            ()                                    => api.get<Client[]>('/clients').then(r => r.data),
  get:             (id: string)                          => api.get<Client>(`/clients/${id}`).then(r => r.data),
  create:          (data: Partial<Client>)               => api.post<Client>('/clients', data).then(r => r.data),
  update:          (id: string, data: Partial<Client>)   => api.put<Client>(`/clients/${id}`, data).then(r => r.data),
  archive:         (id: string)                          => api.delete(`/clients/${id}`).then(r => r.data),
  getConnectors:   (id: string)                          => api.get<OAuthToken[]>(`/clients/${id}/connectors`).then(r => r.data),
  addConnector:    (id: string, oauthTokenId: string)    => api.post(`/clients/${id}/connectors`, { oauthTokenId }).then(r => r.data),
  removeConnector: (clientId: string, connectorId: string) => api.delete(`/clients/${clientId}/connectors/${connectorId}`).then(r => r.data),
  updateSchedule:  (id: string, schedule: string, timezone: string) =>
                     api.put(`/clients/${id}/schedule`, { schedule, timezone }).then(r => r.data),
  getDeliveries:   (id: string, page = 1) => api.get(`/clients/${id}/deliveries?page=${page}`).then(r => r.data),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportsApi = {
  list:        (params?: { clientId?: string; page?: number }) =>
                 api.get<{ reports: Report[]; total: number }>('/reports', { params }).then(r => r.data),
  get:         (id: string)                         => api.get<Report>(`/reports/${id}`).then(r => r.data),
  create:      (data: Record<string, unknown>)      => api.post<Report>('/reports', data).then(r => r.data),
  regenerate:  (id: string, tone?: string)          => api.post<Report>(`/reports/${id}/regenerate-narrative`, { tone }).then(r => r.data),
  rate:        (id: string, rating: string, section?: string, note?: string) =>
                 api.put(`/reports/${id}/rating`, { rating, section, note }).then(r => r.data),
  share:       (id: string, enabled: boolean)       => api.put(`/reports/${id}/share`, { enabled }).then(r => r.data),
  send:        (id: string, email?: string)         => api.post(`/reports/${id}/send`, { email }).then(r => r.data),
  exportPdf:   (id: string)                         => api.post(`/reports/${id}/export-pdf`, {}, { responseType: 'blob' }).then(r => r.data),
  getPublic:   (shareToken: string)                 => api.get<Report>(`/public/reports/${shareToken}`).then(r => r.data),
};

// ─── Connectors ───────────────────────────────────────────────────────────────

export const connectorsApi = {
  list:             ()                                        => api.get<OAuthToken[]>('/connectors').then(r => r.data),
  getGoogleAuthUrl: (platform = 'google_analytics')          => api.get<{ url: string | null; demo?: boolean }>(`/connectors/google/auth-url?platform=${platform}`).then(r => r.data),
  getMetaAuthUrl:   ()                                       => api.get<{ url: string | null; demo?: boolean }>('/connectors/meta/auth-url').then(r => r.data),
  addDemo:          (platform: string, accountName: string)  => api.post<OAuthToken>('/connectors/demo', { platform, accountName }).then(r => r.data),
  remove:           (id: string)                             => api.delete(`/connectors/${id}`).then(r => r.data),
  refresh:          (id: string)                             => api.post(`/connectors/${id}/refresh`).then(r => r.data),
};

// ─── Team ─────────────────────────────────────────────────────────────────────

export const teamApi = {
  list:   ()                           => api.get<TeamMember[]>('/team').then(r => r.data),
  invite: (data: Record<string, string>) => api.post('/team/invite', data).then(r => r.data),
  update: (id: string, role: string)   => api.put(`/team/${id}`, { role }).then(r => r.data),
  remove: (id: string)                 => api.delete(`/team/${id}`).then(r => r.data),
};

// ─── Referrals ────────────────────────────────────────────────────────────────

export const referralsApi = {
  getMe: () => api.get('/referrals/me').then(r => r.data),
};

// ─── Billing ──────────────────────────────────────────────────────────────────

export const billingApi = {
  getLsStatus:    ()              => api.get('/billing/ls-status').then(r => r.data),
  checkDowngrade: (newTier: string) => api.post('/billing/check-downgrade', { newTier }).then(r => r.data),
};

// Kept for backwards compatibility — merged into connectorsApi above
export const connectorsRefreshApi = connectorsApi;

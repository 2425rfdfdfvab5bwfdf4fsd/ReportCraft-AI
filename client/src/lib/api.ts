import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = (window as any).__clerkToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/sign-in?reason=session_expired';
    }
    return Promise.reject(error);
  }
);

export default api;

// Agency
export const agencyApi = {
  get: () => api.get('/agencies/me').then(r => r.data),
  update: (data: any) => api.put('/agencies/me', data).then(r => r.data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/agencies/me/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

// Clients
export const clientsApi = {
  list: () => api.get('/clients').then(r => r.data),
  get: (id: string) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data: any) => api.post('/clients', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data).then(r => r.data),
  archive: (id: string) => api.delete(`/clients/${id}`).then(r => r.data),
  getConnectors: (id: string) => api.get(`/clients/${id}/connectors`).then(r => r.data),
  addConnector: (id: string, oauthTokenId: string) => api.post(`/clients/${id}/connectors`, { oauthTokenId }).then(r => r.data),
  removeConnector: (clientId: string, connectorId: string) => api.delete(`/clients/${clientId}/connectors/${connectorId}`).then(r => r.data),
  updateSchedule: (id: string, schedule: string, timezone: string) => api.put(`/clients/${id}/schedule`, { schedule, timezone }).then(r => r.data),
  getDeliveries: (id: string, page = 1) => api.get(`/clients/${id}/deliveries?page=${page}`).then(r => r.data),
};

// Reports
export const reportsApi = {
  list: (params?: { clientId?: string; page?: number }) => api.get('/reports', { params }).then(r => r.data),
  get: (id: string) => api.get(`/reports/${id}`).then(r => r.data),
  create: (data: any) => api.post('/reports', data).then(r => r.data),
  regenerate: (id: string, tone?: string) => api.post(`/reports/${id}/regenerate-narrative`, { tone }).then(r => r.data),
  rate: (id: string, rating: string, section?: string, note?: string) => api.put(`/reports/${id}/rating`, { rating, section, note }).then(r => r.data),
  share: (id: string, enabled: boolean) => api.put(`/reports/${id}/share`, { enabled }).then(r => r.data),
  send: (id: string, email?: string) => api.post(`/reports/${id}/send`, { email }).then(r => r.data),
  exportPdf: (id: string) => api.post(`/reports/${id}/export-pdf`, {}, { responseType: 'blob' }).then(r => r.data),
  getPublic: (shareToken: string) => api.get(`/public/reports/${shareToken}`).then(r => r.data),
};

// Connectors
export const connectorsApi = {
  list: () => api.get('/connectors').then(r => r.data),
  getGoogleAuthUrl: (platform = 'google_analytics') => api.get(`/connectors/google/auth-url?platform=${platform}`).then(r => r.data),
  getMetaAuthUrl: () => api.get('/connectors/meta/auth-url').then(r => r.data),
  addDemo: (platform: string, accountName: string) => api.post('/connectors/demo', { platform, accountName }).then(r => r.data),
  remove: (id: string) => api.delete(`/connectors/${id}`).then(r => r.data),
};

// Team
export const teamApi = {
  list: () => api.get('/team').then(r => r.data),
  invite: (data: any) => api.post('/team/invite', data).then(r => r.data),
  update: (id: string, role: string) => api.put(`/team/${id}`, { role }).then(r => r.data),
  remove: (id: string) => api.delete(`/team/${id}`).then(r => r.data),
};

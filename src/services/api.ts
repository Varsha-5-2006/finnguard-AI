const API_BASE = `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('finguard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText || 'Request failed'}`;
    if (isJson) {
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {
        // ignore JSON parse failure
      }
    } else {
      try {
        const text = await response.text();
        if (text && !text.trim().startsWith('<')) {
          errorMsg = text.slice(0, 150);
        }
      } catch {
        // ignore text read failure
      }
    }
    throw new Error(errorMsg);
  }

  if (!isJson) {
    throw new Error(`Unexpected non-JSON response from server for ${endpoint}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: { name: string; email: string; password: string; title?: string }) =>
    request<{ message?: string; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  demoLogin: (role: string) =>
    request<{ token: string; user: any }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  // Dashboard
  getDashboardSummary: () => request<any>('/dashboard/summary'),
  getDashboardTrends: () => request<any>('/dashboard/trends'),

  // Transactions
  getTransactions: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<any>(`/transactions?${query}`);
  },

  getTransactionById: (id: string) => request<any>(`/transactions/${id}`),

  createTransaction: (data: any) =>
    request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  simulateTransaction: (scenario: string) =>
    request<any>('/transactions/simulate', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }),

  analyzeTransaction: (data: any) =>
    request<any>('/transactions/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  importTransactions: (transactions: any[]) =>
    request<any>('/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    }),

  getAiExplanation: (id: string) =>
    request<any>(`/transactions/${id}/ai-explain`, {
      method: 'POST',
    }),

  // Alerts
  getAlerts: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<any>(`/alerts?${query}`);
  },

  getAlertById: (id: string) => request<any>(`/alerts/${id}`),

  updateAlertStatus: (id: string, status: string, note?: string, resolutionOutcome?: string) =>
    request<any>(`/alerts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, resolutionOutcome }),
    }),

  assignAlert: (id: string, userId: string) =>
    request<any>(`/alerts/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    }),

  addAlertNote: (id: string, text: string) =>
    request<any>(`/alerts/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  createCaseFromAlert: (id: string, data: { title?: string; description?: string; priority?: string }) =>
    request<any>(`/alerts/${id}/create-case`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Cases
  getCases: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<any>(`/cases?${query}`);
  },

  getCaseById: (id: string) => request<any>(`/cases/${id}`),

  createCase: (data: any) =>
    request<any>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCase: (id: string, updates: any) =>
    request<any>(`/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  addCaseNote: (id: string, text: string) =>
    request<any>(`/cases/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  addCaseEvidence: (id: string, evidence: { title: string; description: string; type: string }) =>
    request<any>(`/cases/${id}/evidence`, {
      method: 'POST',
      body: JSON.stringify(evidence),
    }),

  setCaseDisposition: (id: string, disposition: string, dispositionNotes: string) =>
    request<any>(`/cases/${id}/disposition`, {
      method: 'PATCH',
      body: JSON.stringify({ disposition, dispositionNotes }),
    }),

  // Analytics
  getAnalyticsOverview: (timeframe: string = '30d') =>
    request<any>(`/analytics/overview?timeframe=${timeframe}`),

  // Compliance & Reports
  generateComplianceReport: (data: { reportType: string; startDate?: string; endDate?: string; title?: string }) =>
    request<any>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAuditEvents: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<any>(`/audit-events?${query}`);
  },

  // Settings & Rules
  getSettings: () => request<any>('/settings'),

  updateSettings: (settings: any) =>
    request<any>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),

  getRules: () => request<any>('/rules'),

  updateRule: (id: string, updates: any) =>
    request<any>(`/rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  getUsers: () => request<any>('/users'),

  updateUser: (id: string, updates: any) =>
    request<any>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  createUser: (data: any) =>
    request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetDemoData: () =>
    request<any>('/system/reset-demo', {
      method: 'POST',
    }),

  // Notifications
  getNotifications: () => request<any>('/notifications'),

  markNotificationRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<any>('/notifications/read-all', { method: 'PATCH' }),
};


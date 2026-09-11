const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('companybrain_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || `HTTP error ${response.status}`, response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password, tenantId) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, tenantId }) }),
  signup: (data) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  getPersonas: () => request('/auth/personas'),
  getMe: () => request('/auth/me'),
  switchTenant: (tenantId) =>
    request('/auth/switch-tenant', { method: 'POST', body: JSON.stringify({ tenantId }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // System & Stats
  getDashboardStats: () => request('/system/dashboard-stats'),
  getArchitecture: () => request('/system/architecture'),
  resetDemo: () => request('/system/reset-demo', { method: 'POST' }),

  // Companies
  getCompanies: () => request('/companies'),
  getCompany: (id) => request(`/companies/${id}`),
  createCompany: (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id, data) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Users & Groups
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getGroups: () => request('/groups'),
  createGroup: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  addGroupMember: (groupId, userId) =>
    request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeGroupMember: (groupId, userId) =>
    request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),

  // Connectors
  getConnectors: () => request('/connectors'),
  getConnector: (id) => request(`/connectors/${id}`),
  getConnectorTypes: () => request('/connectors/types'),
  testConnector: (id) => request(`/connectors/${id}/test`, { method: 'POST' }),
  syncConnector: (id) => request(`/connectors/${id}/sync`, { method: 'POST' }),
  disconnectConnector: (id) => request(`/connectors/${id}/disconnect`, { method: 'POST' }),
  deleteConnector: (id) => request(`/connectors/${id}`, { method: 'DELETE' }),

  // Real Account OAuth & Live Connection
  getOAuthUrl: (provider, params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'undefined')
    );
    const q = new URLSearchParams(cleanParams).toString();
    return request(`/connectors/oauth/${provider}/authorize${q ? `?${q}` : ''}`);
  },
  connectSupabase: (data) => request('/connectors/supabase/connect', { method: 'POST', body: JSON.stringify(data) }),
  connectDevelopment: (data) => request('/connectors/development/connect', { method: 'POST', body: JSON.stringify(data) }),

  // Live Browsing & Knowledge Selection
  browseConnector: (id, params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'undefined')
    );
    const q = new URLSearchParams(cleanParams).toString();
    return request(`/connectors/${id}/browse${q ? `?${q}` : ''}`);
  },
  selectKnowledge: (id, items) => request(`/connectors/${id}/select`, { method: 'POST', body: JSON.stringify({ items }) }),

  // Access Governance
  getItemAccess: (id, itemId) => request(`/connectors/${id}/items/${itemId}/access`),
  saveItemAccess: (id, itemId, data) =>
    request(`/connectors/${id}/items/${itemId}/access`, { method: 'POST', body: JSON.stringify(data) }),

  // Documents
  getDocuments: () => request('/documents'),
  getDocument: (id) => request(`/documents/${id}`),
  createDocument: (data) => request('/documents', { method: 'POST', body: JSON.stringify(data) }),
  updateDocument: (id, data) => request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  // RAG
  queryRAG: (query, tenantId) =>
    request('/rag/query', { method: 'POST', body: JSON.stringify({ query, tenantId }) }),
  getRAGHistory: () => request('/rag/history'),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs${query ? `?${query}` : ''}`);
  },

  // Policies
  getPolicies: () => request('/policies'),
  createPolicy: (data) => request('/policies', { method: 'POST', body: JSON.stringify(data) }),
  updatePolicy: (id, data) => request(`/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  simulatePolicy: (mockUser, mockDocument) =>
    request('/policies/evaluate', { method: 'POST', body: JSON.stringify({ mockUser, mockDocument }) }),
};

import { User, Plan, Subscription, Payment, SubscriptionHistory, InvoiceReceipt, ReportMetrics } from '../types.ts';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('subscribo_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

export const api = {
  // Auth
  auth: {
    signup: (body: any) =>
      fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => handleResponse<{ user: User; token: string; message: string }>(r)),

    login: (body: any) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => handleResponse<{ user: User; token: string; message: string }>(r)),

    getMe: () =>
      fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<{ user: User }>(r)),

    getDemoUsers: () =>
      fetch(`${API_BASE}/auth/demo-users`).then((r) =>
        handleResponse<{ demoAccounts: any[]; allUsers: any[] }>(r)
      ),
  },

  // Plans
  plans: {
    getAll: (params?: { search?: string; cycle?: string; sort?: string; includeInactive?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.cycle) q.set('cycle', params.cycle);
      if (params?.sort) q.set('sort', params.sort);
      if (params?.includeInactive) q.set('includeInactive', 'true');
      return fetch(`${API_BASE}/plans?${q.toString()}`, {
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<{ plans: Plan[] }>(r));
    },

    getById: (id: number) =>
      fetch(`${API_BASE}/plans/${id}`, { headers: getAuthHeaders() }).then((r) =>
        handleResponse<{ plan: Plan }>(r)
      ),

    create: (planData: Partial<Plan>) =>
      fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(planData),
      }).then((r) => handleResponse<{ plan: Plan; message: string }>(r)),

    update: (id: number, planData: Partial<Plan>) =>
      fetch(`${API_BASE}/plans/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(planData),
      }).then((r) => handleResponse<{ plan: Plan; message: string }>(r)),

    toggleStatus: (id: number, status: 'active' | 'inactive') =>
      fetch(`${API_BASE}/plans/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      }).then((r) => handleResponse<{ message: string }>(r)),

    delete: (id: number) =>
      fetch(`${API_BASE}/plans/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<{ message: string }>(r)),
  },

  // Subscriptions
  subscriptions: {
    getAll: (params?: { status?: string; search?: string; userId?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      if (params?.userId) q.set('userId', params.userId.toString());
      return fetch(`${API_BASE}/subscriptions?${q.toString()}`, {
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<{ subscriptions: Subscription[] }>(r));
    },

    getById: (id: number) =>
      fetch(`${API_BASE}/subscriptions/${id}`, {
        headers: getAuthHeaders(),
      }).then((r) =>
        handleResponse<{
          subscription: Subscription;
          payments: Payment[];
          history: SubscriptionHistory[];
        }>(r)
      ),

    subscribe: (body: { plan_id: number; payment_method: string; auto_renew?: boolean }) =>
      fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }).then((r) =>
        handleResponse<{
          message: string;
          subscription_id: number;
          payment_id: number;
          transaction_id: string;
          amount: number;
        }>(r)
      ),

    renew: (id: number, payment_method: string) =>
      fetch(`${API_BASE}/subscriptions/${id}/renew`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ payment_method }),
      }).then((r) =>
        handleResponse<{
          message: string;
          new_end_date: string;
          transaction_id: string;
        }>(r)
      ),

    upgrade: (id: number, new_plan_id: number, payment_method: string) =>
      fetch(`${API_BASE}/subscriptions/${id}/upgrade`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ new_plan_id, payment_method }),
      }).then((r) =>
        handleResponse<{
          message: string;
          new_end_date: string;
          transaction_id: string;
        }>(r)
      ),

    cancel: (id: number, reason?: string) =>
      fetch(`${API_BASE}/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      }).then((r) => handleResponse<{ message: string; subscription_id: number; status: string }>(r)),

    toggleAutoRenew: (id: number, auto_renew: boolean) =>
      fetch(`${API_BASE}/subscriptions/${id}/auto-renew`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ auto_renew }),
      }).then((r) => handleResponse<{ message: string; auto_renew: number }>(r)),
  },

  // Payments
  payments: {
    getAll: (params?: { status?: string; search?: string; startDate?: string; endDate?: string; userId?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      if (params?.startDate) q.set('startDate', params.startDate);
      if (params?.endDate) q.set('endDate', params.endDate);
      if (params?.userId) q.set('userId', params.userId.toString());
      return fetch(`${API_BASE}/payments?${q.toString()}`, {
        headers: getAuthHeaders(),
      }).then((r) =>
        handleResponse<{
          payments: Payment[];
          summary: { totalCount: number; successfulCount: number; totalAmount: number };
        }>(r)
      );
    },

    getReceipt: (id: number | string) =>
      fetch(`${API_BASE}/payments/${id}/receipt`, {
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<{ receipt: InvoiceReceipt }>(r)),
  },

  // Users (Admin)
  users: {
    getAll: (params?: { role?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.role) q.set('role', params.role);
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      return fetch(`${API_BASE}/users?${q.toString()}`, {
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<{ users: any[] }>(r));
    },

    getById: (id: number) =>
      fetch(`${API_BASE}/users/${id}`, {
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<{ user: User; subscriptions: Subscription[]; payments: Payment[] }>(r)),

    updateStatus: (id: number, status: string) =>
      fetch(`${API_BASE}/users/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      }).then((r) => handleResponse<{ message: string }>(r)),
  },

  // Reports
  reports: {
    getDashboard: (params?: { startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams();
      if (params?.startDate) q.set('startDate', params.startDate);
      if (params?.endDate) q.set('endDate', params.endDate);
      return fetch(`${API_BASE}/reports/dashboard?${q.toString()}`, {
        headers: getAuthHeaders(),
      }).then((r) =>
        handleResponse<{
          metrics: ReportMetrics;
          revenueByPlan: any[];
          statusDistribution: any[];
          monthlyTrends: any[];
          paymentMethods: any[];
          planPopularity: any[];
          recentActivities: any[];
          customerSegments: any[];
        }>(r)
      );
    },
  },

  // DBMS Viva Console (Admin Only)
  dbms: {
    getTablesData: () =>
      fetch(`${API_BASE}/db/tables-data`, {
        headers: getAuthHeaders(),
      }).then((r) =>
        handleResponse<{
          tables: Record<
            string,
            {
              name: string;
              rowCount: number;
              columns: { name: string; type: string; pk: boolean; notnull: boolean }[];
              rows: Record<string, any>[];
              pkColumn: string;
            }
          >;
          fetchedAt: string;
          engine: string;
        }>(r)
      ),

    getDemoQueries: () =>
      fetch(`${API_BASE}/db/demo-queries`, {
        headers: getAuthHeaders(),
      }).then((r) =>
        handleResponse<{ queries: { id: string; title: string; concept: string; sql: string }[] }>(r)
      ),

    runQuery: (sql: string) =>
      fetch(`${API_BASE}/db/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sql }),
      }).then((r) =>
        handleResponse<{
          columns: string[];
          rows: any[];
          rowCount: number;
          executionTimeMs: number;
          message?: string;
        }>(r)
      ),

    getSchemaInfo: () =>
      fetch(`${API_BASE}/db/schema-info`, {
        headers: getAuthHeaders(),
      }).then((r) =>
        handleResponse<{ schema: Record<string, any>; relationships: any[] }>(r)
      ),

    resetDatabase: () =>
      fetch(`${API_BASE}/db/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
      }).then((r) =>
        handleResponse<{ message: string }>(r)
      ),
  },

  // Settings
  settings: {
    get: () => fetch(`${API_BASE}/settings`).then((r) => handleResponse<{ settings: Record<string, string> }>(r)),
    update: (body: { expiring_soon_days?: number }) =>
      fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }).then((r) => handleResponse<{ message: string; expiring_soon_days: string }>(r)),
  },
};

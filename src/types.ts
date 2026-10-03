export interface User {
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export interface Plan {
  plan_id: number;
  plan_name: string;
  description: string;
  price: number;
  duration_days: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  max_users: number;
  status: 'active' | 'inactive';
  created_at?: string;
  subscriber_count?: number;
}

export type SubscriptionStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled' | 'pending';

export interface Subscription {
  subscription_id: number;
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  auto_renew: number; // 0 or 1
  created_at: string;
  plan_name: string;
  price: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  duration_days: number;
  features: string[];
  max_users: number;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  days_remaining: number;
  payment_count?: number;
  total_paid?: number;
  plan_description?: string;
}

export interface Payment {
  payment_id: number;
  subscription_id: number;
  user_id: number;
  amount: number;
  payment_method: 'UPI' | 'Credit/Debit Card' | 'Net Banking';
  transaction_id: string;
  payment_date: string;
  payment_status: 'successful' | 'failed' | 'pending' | 'refunded';
  user_name?: string;
  user_email?: string;
  plan_name?: string;
  billing_cycle?: string;
  start_date?: string;
  end_date?: string;
}

export interface SubscriptionHistory {
  history_id: number;
  subscription_id: number;
  action: 'Created' | 'Renewed' | 'Upgraded' | 'Cancelled' | 'Status Changed' | 'Reactivated';
  old_plan_id?: number | null;
  new_plan_id?: number | null;
  notes?: string;
  action_date: string;
  old_plan_name?: string | null;
  new_plan_name?: string | null;
  user_name?: string;
}

export interface InvoiceReceipt extends Payment {
  features?: string[];
  baseAmount: number;
  gstAmount: number;
  currency: string;
  issuedBy: string;
  address: string;
  gstNumber: string;
  user_phone?: string;
}

export interface ReportMetrics {
  totalUsers: number;
  totalCustomers: number;
  activeSubscriptions: number;
  expiringSoonSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalTransactions: number;
  totalRenewals: number;
  autoRenewRate: number;
}

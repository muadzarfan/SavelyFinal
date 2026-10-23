import { UserProfile, ExpenseRecord, CurrencyCode } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  currency: CurrencyCode;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserSessionHistoryItem {
  id: string;
  action: 'register' | 'login' | 'logout' | 'sync' | 'expense_added';
  timestamp: string;
  details?: string;
  userAgent?: string;
  ip?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  profile: UserProfile;
  expenses: ExpenseRecord[];
  loginHistory?: UserSessionHistoryItem[];
}

const AUTH_TOKEN_KEY = 'savely_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export async function apiRegister(params: {
  name: string;
  email: string;
  password: string;
  currency: CurrencyCode;
  monthlyIncome?: number;
  goalTitle?: string;
  goalTarget?: number;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create account.');
  }

  setStoredToken(data.token);
  return data;
}

export async function apiLogin(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed.');
  }

  setStoredToken(data.token);
  return data;
}

export async function apiGetCurrentUser(): Promise<AuthResponse | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      setStoredToken(null);
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error('Session check failed:', e);
    return null;
  }
}

export async function apiLogout(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.warn('Logout notification error:', e);
    }
  }
  setStoredToken(null);
}

export async function apiSyncUserData(
  profile: UserProfile,
  expenses: ExpenseRecord[]
): Promise<void> {
  const token = getStoredToken();
  if (!token) return;

  try {
    await fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profile, expenses }),
    });
  } catch (e) {
    console.warn('Failed to sync to database:', e);
  }
}

export async function apiFetchUserHistory(): Promise<{
  user: AuthUser;
  loginHistory: UserSessionHistoryItem[];
  expensesCount: number;
} | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/user/history', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Fetch history failed:', e);
    return null;
  }
}

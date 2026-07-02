import { useState, useCallback } from 'react';
import { authApi } from '../api/auth';
import type { User, Organization } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  organization: Organization | null;
  isSuperAdmin: boolean;
}

function loadAuth(): AuthState {
  try {
    const token = localStorage.getItem('opspilot_token');
    const raw = localStorage.getItem('opspilot_user');
    const user = raw ? (JSON.parse(raw) as User) : null;
    const orgRaw = localStorage.getItem('opspilot_org');
    const organization = orgRaw ? (JSON.parse(orgRaw) as Organization) : null;
    const isSuperAdmin = localStorage.getItem('opspilot_super') === 'true';
    return { token, user, organization, isSuperAdmin };
  } catch {
    return { token: null, user: null, organization: null, isSuperAdmin: false };
  }
}

function persist(res: { accessToken: string; user: User; organization: Organization; isSuperAdmin?: boolean }) {
  localStorage.setItem('opspilot_token', res.accessToken);
  localStorage.setItem('opspilot_user', JSON.stringify(res.user));
  localStorage.setItem('opspilot_org', JSON.stringify(res.organization));
  localStorage.setItem('opspilot_super', res.isSuperAdmin ? 'true' : 'false');
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    persist(res);
    setAuth({ token: res.accessToken, user: res.user, organization: res.organization, isSuperAdmin: !!res.isSuperAdmin });
    return res;
  }, []);

  const loginWithData = useCallback((res: { accessToken: string; user: User; organization: Organization; isSuperAdmin?: boolean }) => {
    persist(res);
    setAuth({ token: res.accessToken, user: res.user, organization: res.organization, isSuperAdmin: !!res.isSuperAdmin });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('opspilot_token');
    localStorage.removeItem('opspilot_user');
    localStorage.removeItem('opspilot_org');
    localStorage.removeItem('opspilot_super');
    setAuth({ token: null, user: null, organization: null, isSuperAdmin: false });
  }, []);

  return { ...auth, isAuthenticated: !!auth.token, login, loginWithData, logout };
}

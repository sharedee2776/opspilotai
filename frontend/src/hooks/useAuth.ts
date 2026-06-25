import { useState, useCallback } from 'react';
import { authApi } from '../api/auth';
import type { User, Organization } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  organization: Organization | null;
}

function loadAuth(): AuthState {
  try {
    const token = localStorage.getItem('opspilot_token');
    const raw = localStorage.getItem('opspilot_user');
    const user = raw ? (JSON.parse(raw) as User) : null;
    const orgRaw = localStorage.getItem('opspilot_org');
    const organization = orgRaw ? (JSON.parse(orgRaw) as Organization) : null;
    return { token, user, organization };
  } catch {
    return { token: null, user: null, organization: null };
  }
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('opspilot_token', res.token);
    localStorage.setItem('opspilot_user', JSON.stringify(res.user));
    localStorage.setItem('opspilot_org', JSON.stringify(res.organization));
    setAuth({ token: res.token, user: res.user, organization: res.organization });
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('opspilot_token');
    localStorage.removeItem('opspilot_user');
    localStorage.removeItem('opspilot_org');
    setAuth({ token: null, user: null, organization: null });
  }, []);

  return { ...auth, isAuthenticated: !!auth.token, login, logout };
}

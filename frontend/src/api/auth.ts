import api from './client';
import type { LoginResponse } from '../types';

export const authApi = {
  login: (email: string, password: string, organizationId?: string) =>
    api.post<LoginResponse>('/auth/login', { email, password, organizationId }).then((r) => r.data),

  me: () => api.get<LoginResponse['user']>('/auth/me').then((r) => r.data),
};

import api from './client';
import type { LoginResponse } from '../types';

export const authApi = {
  login: (email: string, password: string, organizationId?: string) =>
    api.post<LoginResponse>('/auth/login', { email, password, organizationId }).then((r) => r.data),

  register: (data: { name: string; email: string; password: string; organizationName: string }) =>
    api.post<LoginResponse>('/auth/register', data).then((r) => r.data),

  // Exchange a Firebase ID token for an OpsPilot JWT (login)
  firebaseLogin: (idToken: string) =>
    api.post<LoginResponse>('/auth/firebase', { idToken }).then((r) => r.data),

  // Register via Firebase (idToken carries email, name from Firebase profile)
  firebaseRegister: (data: { idToken: string; name: string; organizationName: string }) =>
    api.post<LoginResponse>('/auth/firebase/register', data).then((r) => r.data),

  me: () => api.get<LoginResponse['user']>('/auth/me').then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.get<{ message: string }>(`/auth/verify-email?token=${token}`).then((r) => r.data),

  resendVerification: () =>
    api.post<{ message: string }>('/auth/resend-verification').then((r) => r.data),
};

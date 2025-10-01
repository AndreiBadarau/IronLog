import { request } from './api';

type AuthResponse = { id: string; email: string; token: string };

export async function login(email: string, password: string) {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({email, password}),
  });
  // store token securely later with expo-secure-store / Keychain
  return { id: data.id, email: data.email };
}

export async function register(email: string, password: string) {
  const data = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({email, password}),
  });
  return { id: data.id, email: data.email };
}

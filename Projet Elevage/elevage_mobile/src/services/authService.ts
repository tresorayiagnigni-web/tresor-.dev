import { api } from './api';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: number;
  nom: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });

  await SecureStore.setItemAsync(
    'access_token',
    response.data.access_token,
  );

  return response.data;
};

export const logout = async () => {
  await SecureStore.deleteItemAsync('access_token');
};
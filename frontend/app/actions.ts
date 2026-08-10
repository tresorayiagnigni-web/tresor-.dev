// app/actions.ts

'use server';

import { cookies } from 'next/headers';

// ========== TYPE DEFINITIONS ==========
type UserRole = 'ADMIN' | 'HOD' | 'EMPLOYER';

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    email: string;
    role: UserRole;
    nom: string;
    status: boolean;
  };
}

// ========== LOGIN ACTION ==========
export async function loginUser(prevState: any, formData: FormData): Promise<LoginResponse> {
  const email = formData.get('email');
  const password = formData.get('password');

  // 1. Basic validation
  if (!email || !password) {
    return { success: false, message: 'Please fill in all fields.' };
  }

  let data;
  let response;

  try {
    // 2. Fetch request to backend
    response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    data = await response.json();
  } catch (error) {
    return { success: false, message: 'Unable to connect to the authentication server.' };
  }

  // 3. Handle errors
  if (!response.ok) {
    return { success: false, message: data?.message || 'Login failed! Check your credentials.' };
  }

  // 4. Extract user data from response
  // Assuming your backend returns: { access_token, user: { id, email, role, nom, status } }
  const token = data.access_token;
  const user = data.user;

  if (!token) {
    return { success: false, message: 'Server error: Authentication token missing.' };
  }

  if (!user) {
    return { success: false, message: 'Server error: User data missing.' };
  }

  // 5. Save token in cookie
  const cookieStore = await cookies();
  cookieStore.set('my_secret_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // 6. Return success with user data for role-based redirection
  return {
    success: true,
    message: 'Login successful!',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      nom: user.nom,
      status: user.status,
    },
  };
}
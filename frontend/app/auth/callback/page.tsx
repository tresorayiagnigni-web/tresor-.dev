'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Connexion en cours...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setMessage('Échec de la connexion : jeton absent.');
      setTimeout(() => router.replace('/login'), 2000);
      return;
    }

    // Stocker le token
    localStorage.setItem('access_token', token);
    

    // Décoder le JWT pour connaître le rôle (sans appeler le backend)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;
      const departementId = payload.departementId;

      setMessage('Connexion réussie ! Redirection...');

      // Redirection selon le rôle
      if (role === 'HOD' && departementId) {
        router.replace(`/hod/dashboard`); // ou `/dashboard/department/${departementId}`
      } else if (role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (role === 'EMPLOYEE') {
        router.replace('/employee/dashboard');
      } else {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Erreur décodage token:', error);
      setMessage('Erreur lors de la connexion.');
      setTimeout(() => router.replace('/login'), 2000);
    }
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p>{message}</p>
    </main>
  );
}
// app/login/page.tsx

'use client';

import React, { useState, FormEvent, useEffect, startTransition } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../actions';

// ========== TYPE DEFINITIONS ==========
interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    email: string;
    role: 'ADMIN' | 'HOD' | 'EMPLOYER';
    nom: string;
    status: boolean;
  };
}

// ========== MAIN COMPONENT ==========
const LoginPageV2: React.FC = () => {
  const router = useRouter();
  
  // State for form fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberDevice, setRememberDevice] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Use useActionState for server action
  const [state, formAction, isPending] = useActionState<LoginResponse | null, FormData>(loginUser, null);

  // ===== ROLE-BASED REDIRECTION =====
  useEffect(() => {
    if (state?.success && state?.user) {
      const role = state.user.role;
      
      // Redirect based on role
      switch (role) {
        case 'ADMIN':
          router.push('/admin/control-center');
          break;
        case 'HOD':
          router.push('/hod/dashboard');
          break;
        case 'EMPLOYER':
          router.push('/employee/dashboard');
          break;
        default:
          router.push('/employee/dashboard');
          break;
      }
    }
  }, [state, router]);

  // ===== HANDLE FORM SUBMISSION =====
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(() => {
      formAction(formData);
    });
  };

  // ===== TOGGLE PASSWORD VISIBILITY =====
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ===== ICON COMPONENTS =====
  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  // ========== RENDER ==========
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FEFEFC] font-sans antialiased">
      {/* LEFT PANEL - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-[#263A81] text-white flex-col justify-between p-12 lg:p-16">
        <div>
          <div className="text-4xl font-bold tracking-tight">MENDO HR</div>
          <div className="mt-2 text-sm font-light opacity-80">Human Resource Management</div>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            Manage your workforce securely.
          </h1>
          <p className="mt-4 text-lg font-light opacity-90 leading-relaxed">
            Centralized access to employee data, payroll, and performance analytics—all protected with enterprise-grade security.
          </p>
        </div>

        <div className="text-sm opacity-60 font-light">
          © 2026 MENDO HR. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex-1 bg-[#FEFEFC] flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md md:max-w-[400px]">
          {/* Mobile Branding */}
          <div className="md:hidden text-center mb-8">
            <div className="text-3xl font-bold text-[#263A81]">MENDO HR</div>
            <div className="text-sm text-[#6B7280] mt-1">Human Resource Management</div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1F2937]">Welcome Back</h2>
            <p className="text-[#6B7280] text-sm mt-1">Sign in to access your HR dashboard.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {state && !state.success && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                {state.message}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1F2937] mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@mendocompany.com"
                className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition duration-200"
                aria-label="Email Address"
                autoComplete="email"
                required
                disabled={isPending}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1F2937] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#263A81] focus:border-transparent transition duration-200 pr-12"
                  aria-label="Password"
                  required
                  autoComplete="current-password"
                  disabled={isPending}
                />
            
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#1F2937] transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isPending}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Remember Device */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#1F2937] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#263A81] focus:ring-2 focus:ring-[#263A81] focus:ring-offset-1 transition"
                  disabled={isPending}
                />
                <span>Remember device</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 bg-[#263A81] text-white font-bold text-base rounded-lg hover:bg-[#1e2f6a] focus:outline-none focus:ring-4 focus:ring-[#263A81]/30 transition-all duration-150 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <SpinnerIcon />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-center text-xs text-[#6B7280] mt-4">
              Enter credentials to access your dashboard
            </p>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPageV2;
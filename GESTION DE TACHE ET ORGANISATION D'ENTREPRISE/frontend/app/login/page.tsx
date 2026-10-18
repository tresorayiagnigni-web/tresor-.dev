'use client';

import React, {
  useState,
  FormEvent,
  useEffect,
  startTransition,
} from 'react';
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
    role: 'ADMIN' | 'HOD' | 'EMPLOYER' | 'EMPLOYEE';
    nom: string;
    status: boolean;
  };
}

// ========== ICONS ==========

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    className="h-4 w-4 animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 0h4zm2 5.291A7.962 7.962 0 014 0 3 3 0 000 0h4zm2 5.291A7.962 7.962 0 014 0 3 3 0 000 0h4z"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.4z"
    />
    <path
      fill="#34A853"
      d="M12 22.5c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10.5 10.5 0 0012 22.5z"
    />
    <path
      fill="#FBBC05"
      d="M6.2 14.1a6.3 6.3 0 010-4.2V7.2H2.7a10.5 10.5 0 000 9.6z"
    />
    <path
      fill="#EA4335"
      d="M12 6.4c1.5 0 2.9.5 4 1.6l3-3A10.5 10.5 0 002.7 7.2l3.5 2.7C7 8.2 9.3 6.4 12 6.4z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.2-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1.1-2.8-4.1zM13.9 5.2c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.4-.6 3.1-1.5z" />
  </svg>
);

// ========== DASHBOARD PREVIEW ==========

const DashboardPreview: React.FC = () => (
  <div
    aria-hidden="true"
    className="relative mt-auto grid grid-cols-[170px_1fr] grid-rows-[190px_auto] gap-3 rounded-tl-2xl bg-white p-4 text-[#14161F] shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
  >
    <div>
      <div className="rounded-[10px] bg-gradient-to-br from-[#5A4FFF] to-[#4338F0] p-3 text-white">
        <span className="block text-[10px] opacity-80">Total Employees</span>
        <b className="my-1 mb-3 block text-2xl">1,248</b>
        <span className="block text-[9px] opacity-80">+12 this month</span>
      </div>

      <div className="mt-2.5 rounded-[10px] border border-[#E4E6EE] p-2.5">
        <span className="block text-[9px] text-[#8B90A0]">Monthly Payroll</span>
        <b className="text-[15px]">$215,694</b>
      </div>
    </div>

    <div className="flex min-h-0 flex-col rounded-[10px] border border-[#E4E6EE] p-3">
      <span className="mb-2 text-[10px] text-[#8B90A0]">Team Performance</span>
      <svg
        className="min-h-0 w-full flex-1"
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
      >
        <polygon
          fill="rgba(67,56,240,.12)"
          points="0,60 30,48 60,54 90,30 120,38 150,18 200,10 200,80 0,80"
        />
        <polyline
          fill="none"
          stroke="#4338F0"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          points="0,60 30,48 60,54 90,30 120,38 150,18 200,10"
        />
      </svg>
    </div>

    <div className="col-span-2 rounded-[10px] border border-[#E4E6EE] px-2.5 py-2 text-[10px] text-[#555A6B]">
      {[
        ['Employee', 'Department', 'Role', 'Status'],
        ['Amina Ngono', 'Finance', 'Accountant', 'Active'],
        ['Paul Essomba', 'IT', 'Developer', 'Active'],
        ['Carine Mbia', 'HR', 'Manager', 'Active'],
      ].map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[1.4fr_1fr_1fr_.8fr] border-b border-[#F0F1F6] py-[5px] last:border-0"
        >
          {row.map((cell, j) =>
            i === 0 ? (
              <b key={j}>{cell}</b>
            ) : j === 3 ? (
              <span
                key={j}
                className="w-max rounded-full bg-[#E7F7EE] px-1.5 text-[8px] text-[#1E9D5C]"
              >
                {cell}
              </span>
            ) : (
              <span key={j}>{cell}</span>
            ),
          )}
        </div>
      ))}
    </div>
  </div>
);

// ========== MAIN COMPONENT ==========

const LoginPageV2: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialError, setSocialError] = useState('');

  const [state, formAction, isPending] = useActionState<
    LoginResponse | null,
    FormData
  >(loginUser, null);

  // Backend NestJS
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // Google OAuth
  const handleGoogleLogin = () => {
    setSocialError('');
    window.location.assign(`${backendUrl}/auth/google`);
  };

  // Apple OAuth
  const handleAppleLogin = () => {
    setSocialError('');
    window.location.assign(`${backendUrl}/auth/apple`);
  };

  // Redirection selon le rôle après une connexion classique
  useEffect(() => {
    if (!state?.success || !state.user) return;

    switch (state.user.role) {
      case 'ADMIN':
        router.push('/admin/control-center');
        break;
      case 'HOD':
        router.push('/hod/dashboard');
        break;
      case 'EMPLOYER':
      case 'EMPLOYEE':
        router.push('/employee/dashboard');
        break;
      default:
        router.push('/employee/dashboard');
    }
  }, [state, router]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('submit handler OK');

    const formData = new FormData(e.currentTarget);
    formData.set('rememberDevice', String(rememberDevice));

    startTransition(() => {
      formAction(formData);
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((previous) => !previous);
  };

  const inputClass =
    'w-full h-11 rounded-lg border border-[#E4E6EE] bg-white px-3.5 text-[13.5px] text-[#14161F] placeholder:text-[#A3A7B5] outline-none transition focus:border-[#4338F0] focus:ring-[3px] focus:ring-[#4338F0]/15 disabled:opacity-70';

  return (
    <div className="min-h-screen w-full bg-white font-sans antialiased">
      <main className="grid min-h-screen w-full grid-cols-1 bg-white p-3 lg:grid-cols-2">
        {/* LEFT PANEL - Login Form */}
        <section className="flex flex-col px-4 py-5 sm:px-8 lg:px-14 lg:py-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5 text-base font-semibold text-[#14161F]">
            <img
              src="/logo.png"
              alt="MENDO logo"
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div>
              MENDO company
              <small className="mt-px block text-[10.5px] font-normal text-[#8B90A0]">
                Business organization and taks management
              </small>
            </div>
          </div>

          <div className="mx-auto my-auto w-full max-w-[420px] py-8">
            <h1 className="mb-1.5 text-center text-[32px] font-bold tracking-tight text-[#14161F]">
              Welcome Back
            </h1>
            <p className="mb-9 text-center text-[13.5px] text-[#8B90A0]">
              Sign in to access your HR dashboard.
            </p>

            <form onSubmit={handleSubmit} method="POST" >
              {state && !state.success && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600"
                >
                  {state.message || 'Unable to sign in. Please try again.'}
                </div>
              )}

              {socialError && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600"
                >
                  {socialError}
                </div>
              )}

              {/* Email */}
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold text-[#3B3F4E]"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mendocompany.com"
                  className={inputClass}
                  autoComplete="email"
                  required
                  disabled={isPending}
                />
              </div>

              {/* Password */}
              <div className="mb-5">
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold text-[#3B3F4E]"
                >
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
                    className={`${inputClass} pr-10`}
                    autoComplete="current-password"
                    required
                    disabled={isPending}
                  />

                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#A3A7B5] transition hover:text-[#14161F]"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    disabled={isPending}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Remember device + Forgot password */}
              <div className="mb-6 mt-0.5 flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-[7px] text-[#555A6B]">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="h-[13px] w-[13px] accent-[#4338F0]"
                    disabled={isPending}
                  />
                  <span>Remember device</span>
                </label>

                <a
                  href="/forgot-password"
                  className="font-semibold text-[#4338F0] hover:underline"
                >
                  Forgot Your Password?
                </a>
              </div>

              {/* Sign In */}
              <button
                type="submit"
                disabled={isPending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#4338F0] text-sm font-semibold text-white transition hover:bg-[#5B50FF] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4338F0]/30 disabled:cursor-not-allowed disabled:opacity-70"
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

              {/* Divider */}
              <div className="my-6 flex items-center gap-2.5 text-xs text-[#8B90A0]">
                <span className="h-px flex-1 bg-[#E4E6EE]" />
                Or Login With
                <span className="h-px flex-1 bg-[#E4E6EE]" />
              </div>

              {/* Social login buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isPending}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#E4E6EE] bg-white text-[13px] font-medium text-[#14161F] transition hover:bg-[#F6F7FB] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <GoogleIcon />
                  Google
                </button>

                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={isPending}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#E4E6EE] bg-white text-[13px] font-medium text-[#14161F] transition hover:bg-[#F6F7FB] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <AppleIcon />
                  Apple
                </button>
              </div>

              <p className="mt-7 text-center text-xs text-[#8B90A0]">
                Enter credentials to access your dashboard
              </p>
            </form>
          </div>

          <div className="text-[10.5px] text-[#8B90A0]">
            © 2026 MENDO. All rights reserved.
          </div>
        </section>

        {/* RIGHT PANEL - Branding */}
        <aside className="relative hidden flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#5A4FFF] to-[#3A30E0] pl-12 pt-16 text-white lg:flex xl:pl-16 xl:pt-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[340px] w-[340px] rounded-full bg-white/[0.07]" />

          <h2 className="relative mb-2.5 max-w-[520px] text-[30px] font-semibold leading-tight tracking-tight xl:text-[36px]">
            Manage your workforce securely.
          </h2>

          <p className="relative mb-12 max-w-[460px] text-sm leading-relaxed text-white/80 xl:text-[15px]">
            Centralized access to employee data, payroll, and performance
            analytics—all protected with enterprise-grade security.
          </p>

          <DashboardPreview />
        </aside>
      </main>
    </div>
  );
};

export default LoginPageV2;

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import AuthLayout from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
import { api, ApiError } from '../../utils/api';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const API = '/api/v1';
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', data);
      const { accessToken, refreshToken, user } = response;
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/');
    } catch (err: any) {
      let message = 'Invalid email or password. Please try again.';
      if (err instanceof ApiError) message = err.message;
      else if (err.message?.includes('fetch')) message = 'Unable to connect. Check your internet connection.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
            Welcome back
          </h1>
          <p className="text-base" style={{ color: '#64748b' }}>
            Sign in to your Stokku account to manage your inventory.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <AuthInput
            label="Email address"
            type="email"
            icon={FiMail}
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1.5">
            <AuthInput
              label="Password"
              type="password"
              icon={FiLock}
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="remember" className="text-sm text-slate-600 select-none">
              Remember me
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-100 animate-fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              relative w-full flex items-center justify-center gap-2.5
              rounded-lg text-sm font-semibold text-white
              transition-all duration-150
              ${loading ? 'opacity-80 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-indigo-200/50 active:scale-[0.98]'}
            `}
            style={{
              height: '46px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" style={{ opacity: 0.3 }} />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-3 bg-surface-secondary text-slate-400">or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            // TODO: implement Google OAuth
            window.location.href = `${API}/auth/google`;
          }}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-sm" style={{ color: '#64748b' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

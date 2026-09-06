import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiLock, FiArrowLeft } from 'react-icons/fi';
import AuthLayout from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
import { api, ApiError, clearTokens } from '../../utils/api';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type LinkState = 'checking' | 'valid' | 'invalid';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [linkState, setLinkState] = useState<LinkState>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const queryToken = typeof router.query.token === 'string' ? router.query.token : '';
    setToken(queryToken);

    if (!queryToken) {
      setLinkState('invalid');
      return;
    }

    let active = true;
    setLinkState('checking');
    api.post<{ valid: boolean }>('/auth/validate-reset-token', { token: queryToken })
      .then(() => {
        if (active) setLinkState('valid');
      })
      .catch(() => {
        if (active) setLinkState('invalid');
      });

    return () => {
      active = false;
    };
  }, [router.isReady, router.query.token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token || linkState !== 'valid') {
      setLinkState('invalid');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post<{ message: string }>('/auth/reset-password', {
        token,
        newPassword: data.password,
      });
      clearTokens();
      localStorage.removeItem('user');
      setSuccess(true);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setLinkState('invalid');
        setError(null);
      } else {
        setError(err instanceof ApiError ? err.message : 'Unable to reset your password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        {success ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Password reset successfully.</h1>
              <p className="text-base text-slate-500">Your password has been updated. Sign in again with your new password.</p>
            </div>
            <Link href="/auth/login" className="flex h-[46px] w-full items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              Sign in
            </Link>
          </>
        ) : linkState === 'checking' ? (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Checking reset link</h1>
            <p className="text-base text-slate-500">Please wait while we verify this password reset link.</p>
          </div>
        ) : linkState === 'invalid' ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reset link unavailable</h1>
              <p className="text-base text-slate-500">This password reset link is invalid, expired, or has already been used.</p>
            </div>
            <Link href="/auth/forgot-password" className="flex h-[46px] w-full items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              Request a new reset link
            </Link>
            <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              <FiArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
              <p className="text-base text-slate-500">Choose a new password for your Stokku account.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AuthInput label="New password" type="password" icon={FiLock} placeholder="Enter your new password" error={errors.password?.message} {...register('password')} />
              <AuthInput label="Confirm new password" type="password" icon={FiLock} placeholder="Repeat your new password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
              {error && <div className="rounded-lg border border-red-100 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={loading} className={`w-full rounded-lg px-4 text-sm font-semibold text-white transition-all ${loading ? 'cursor-not-allowed opacity-80' : 'active:scale-[0.98]'}`} style={{ height: '46px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

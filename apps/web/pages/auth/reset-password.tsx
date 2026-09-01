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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const queryToken = typeof router.query.token === 'string' ? router.query.token : '';
    setToken(queryToken);
  }, [router.isReady, router.query.token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError('This password reset link is invalid or incomplete.');
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
      setError(err instanceof ApiError ? err.message : 'Unable to reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
          <p className="text-base text-slate-500">
            Choose a new password for your Stokku account.
          </p>
        </div>

        {success ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3.5 text-sm text-emerald-700">
              Password reset successfully. All existing refresh sessions were revoked. Sign in again with your new password.
            </div>
            <Link
              href="/auth/login"
              className="flex h-[46px] w-full items-center justify-center rounded-lg text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <AuthInput
              label="New password"
              type="password"
              icon={FiLock}
              placeholder="Enter your new password"
              error={errors.password?.message}
              {...register('password')}
            />

            <AuthInput
              label="Confirm new password"
              type="password"
              icon={FiLock}
              placeholder="Repeat your new password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {!token && router.isReady && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3.5 text-sm text-red-700">
                This password reset link is invalid or incomplete.
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className={`w-full rounded-lg px-4 text-sm font-semibold text-white transition-all ${
                loading || !token ? 'cursor-not-allowed opacity-80' : 'active:scale-[0.98]'
              }`}
              style={{ height: '46px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}

        {!success && (
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}

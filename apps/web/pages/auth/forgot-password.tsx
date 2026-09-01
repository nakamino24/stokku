import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import AuthLayout from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
import { api, ApiError } from '../../utils/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.post<{ message: string }>('/auth/forgot-password', data);
      setMessage(response.message);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Unable to request a password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
          <p className="text-base text-slate-500">
            Enter your account email and we&apos;ll send password reset instructions if the account exists.
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

          {message && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3.5 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg px-4 text-sm font-semibold text-white transition-all ${
              loading ? 'cursor-not-allowed opacity-80' : 'active:scale-[0.98]'
            }`}
            style={{ height: '46px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            {loading ? 'Sending...' : 'Send reset instructions'}
          </button>
        </form>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}

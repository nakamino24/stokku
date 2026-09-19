import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AuthLayout from '../../components/auth/AuthLayout'
import { api, ApiError } from '../../utils/api'

type VerificationState = 'idle' | 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [state, setState] = useState<VerificationState>('idle')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!router.isReady || typeof router.query.token !== 'string') return

    setState('loading')
    api.post<{ message: string }>('/auth/verify-email', { token: router.query.token })
      .then((response) => {
        setState('success')
        setMessage(response.message || 'Your email has been verified.')
      })
      .catch((error: unknown) => {
        setState('error')
        setMessage(error instanceof ApiError ? error.message : 'This verification link is no longer valid.')
      })
  }, [router.isReady, router.query.token])

  const resend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResending(true)
    setResent(false)
    try {
      await api.post('/auth/resend-verification', { email })
      setResent(true)
    } catch (error: unknown) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to resend the verification email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
            Verify your email
          </h1>
          <p className="text-base" style={{ color: '#64748b' }}>
            Activate your Stokku account before entering the workspace.
          </p>
        </div>

        {state === 'loading' && <p role="status">Verifying your email address...</p>}
        {state === 'success' && (
          <div role="status" className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <p>{message}</p>
            <Link className="font-semibold underline" href="/auth/login">Continue to sign in</Link>
          </div>
        )}
        {state === 'error' && (
          <div role="alert" className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
            <p>{message}</p>
            <p className="mt-1">Request a new verification link below.</p>
          </div>
        )}

        {state !== 'success' && (
          <form onSubmit={resend} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="verification-email" className="block text-sm font-medium" style={{ color: '#1e293b' }}>
                Email address
              </label>
              <input
                id="verification-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
            <button
              type="submit"
              disabled={resending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
            {resent && <p role="status" className="text-sm text-emerald-700">If an account needs verification, a new email has been sent.</p>}
          </form>
        )}

        <Link className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700" href="/auth/login">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}

'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, MessageCircle, Phone } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

type AuthMode = 'signin' | 'signup'

function errorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return 'Something went wrong. Please try again.'
  const value = error as { message?: string; statusText?: string }
  return value.message ?? value.statusText ?? 'Something went wrong. Please try again.'
}

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function signInWithDiscord() {
    setBusy(true)
    setError('')
    const result = await authClient.signIn.social({
      provider: 'discord',
      callbackURL: `${window.location.origin}/`,
    })
    if (result.error) {
      setError(errorMessage(result.error))
      setBusy(false)
    }
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    const result = await authClient.phoneNumber.sendOtp({ phoneNumber })
    if (result.error) {
      setError(errorMessage(result.error))
    } else {
      setCodeSent(true)
      setMessage(
        mode === 'signup'
          ? 'Code sent. Verifying it will create your Webflix account.'
          : 'Code sent. Check your phone to finish signing in.',
      )
    }
    setBusy(false)
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const result = await authClient.phoneNumber.verify({
      phoneNumber,
      code,
      callbackURL: '/',
    })

    if (result.error) {
      setError(errorMessage(result.error))
      setBusy(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Webflix
        </button>

        <div className="mb-8">
          <p className="font-display text-2xl font-extrabold text-primary">
            WEB<span className="text-foreground">FLIX</span>
          </p>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight">
            {mode === 'signup' ? 'Join the stream' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in or create your account with Discord or your phone number.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-secondary p-1 text-sm">
          {(['signin', 'signup'] as AuthMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item)
                setCodeSent(false)
                setError('')
                setMessage('')
              }}
              className={`rounded-md px-3 py-2 font-semibold transition-colors ${
                mode === item ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              {item === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={signInWithDiscord}
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] font-semibold text-white transition-colors hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MessageCircle className="size-4" /> Continue with Discord
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={codeSent ? verifyCode : sendCode} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="phone-number">
            Phone number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="phone-number"
              type="tel"
              required
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+1 555 123 4567"
              className="h-11 w-full rounded-lg border border-white/10 bg-secondary pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {codeSent && (
            <>
              <label className="block pt-2 text-sm font-medium" htmlFor="phone-code">
                Verification code
              </label>
              <input
                id="phone-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                className="h-11 w-full rounded-lg border border-white/10 bg-secondary px-3 text-sm tracking-[0.3em] outline-none transition-colors focus:border-primary"
              />
            </>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {codeSent ? 'Verify and continue' : 'Send verification code'}
          </button>

          {codeSent && (
            <button
              type="button"
              onClick={() => setCodeSent(false)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Use a different phone number
            </button>
          )}
        </form>

        {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Phone verification is required for phone sign-in. In local development, the OTP is printed by the backend until an SMS webhook is configured.
        </p>
      </div>
    </main>
  )
}

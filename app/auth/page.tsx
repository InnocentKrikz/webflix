'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2, X } from 'lucide-react'
import PhoneInput, { isValidPhoneNumber, type Value } from 'react-phone-number-input'
import { authClient } from '@/lib/auth-client'

type AuthMode = 'signin' | 'signup'

function isValidUsername(value: string) {
  return /^[a-zA-Z0-9_.]{3,30}$/.test(value)
}

function errorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return 'Something went wrong. Please try again.'
  const value = error as { message?: string; statusText?: string }
  return value.message ?? value.statusText ?? 'Something went wrong. Please try again.'
}

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [phoneNumber, setPhoneNumber] = useState<Value>()
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [submittedPhoneNumber, setSubmittedPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode !== 'signup') {
      setUsernameAvailable(null)
      setUsernameChecking(false)
      return
    }

    const value = username.trim()
    setUsernameAvailable(null)
    setUsernameChecking(false)
    if (!value || !isValidUsername(value)) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setUsernameChecking(true)
      try {
        const response = await fetch('/api/auth/is-username-available', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: value }),
        })
        const data = (await response.json()) as { available?: boolean }
        if (!cancelled) setUsernameAvailable(response.ok && data.available === true)
      } catch {
        if (!cancelled) setUsernameAvailable(null)
      } finally {
        if (!cancelled) setUsernameChecking(false)
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [mode, username])

  async function checkUsername(value: string) {
    const normalized = value.trim()
    if (!isValidUsername(normalized)) {
      setUsernameAvailable(false)
      setError('Username must be 3–30 characters using letters, numbers, underscores, or periods.')
      return false
    }

    setUsernameChecking(true)
    try {
      const response = await fetch('/api/auth/is-username-available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: normalized }),
      })
      const data = (await response.json()) as { available?: boolean }
      const available = response.ok && data.available === true
      setUsernameAvailable(available)
      if (!available) setError('That username is already taken. Please choose another one.')
      return available
    } catch {
      setUsernameAvailable(null)
      setError('We could not check that username. Please try again.')
      return false
    } finally {
      setUsernameChecking(false)
    }
  }

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

    if (mode === 'signup') {
      const available = await checkUsername(username)
      if (!available) {
        setBusy(false)
        return
      }
    }

    const normalizedPhoneNumber = phoneNumber?.trim()
    if (!normalizedPhoneNumber || !isValidPhoneNumber(normalizedPhoneNumber)) {
      setError('Enter a valid phone number and choose the correct country.')
      setBusy(false)
      return
    }

    const result = await authClient.phoneNumber.sendOtp({ phoneNumber: normalizedPhoneNumber })
    if (result.error) {
      setError(errorMessage(result.error))
    } else {
      setSubmittedPhoneNumber(normalizedPhoneNumber)
      setCodeSent(true)
      setMessage(
        mode === 'signup'
          ? 'Code sent. Verifying it will create your Sceneflix account.'
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
      phoneNumber: submittedPhoneNumber,
      code,
      ...(mode === 'signup' ? { username: username.trim() } : {}),
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
      <div className="w-full max-w-md rounded-2xl bg-card/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Sceneflix
        </button>

        <div className="mb-8">
          <Image
            src="/sceneflix/sceneflix-long-logo.png"
            alt="Sceneflix"
            width={2172}
            height={724}
            className="h-auto w-44"
          />
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
                setCode('')
                setSubmittedPhoneNumber('')
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
           Continue with Discord
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={codeSent ? verifyCode : sendCode} className="space-y-3">
          {mode === 'signup' && (
            <>
              <label className="block text-sm font-medium" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="your_username"
                  disabled={codeSent}
                  className="h-11 w-full rounded-lg border border-white/10 bg-secondary px-3 pr-10 text-sm outline-none transition-colors focus:border-primary disabled:opacity-60"
                />
                {!usernameChecking && usernameAvailable === true && (
                  <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-400" />
                )}
                {!usernameChecking && usernameAvailable === false && (
                  <X className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-red-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {usernameChecking
                  ? 'Checking username…'
                  : usernameAvailable === true
                    ? 'Username is available.'
                    : '3–30 characters: letters, numbers, underscores, or periods.'}
              </p>
            </>
          )}

          <label className="block text-sm font-medium" htmlFor="phone-number">
            Phone number
          </label>
          <div className="flex gap-2">
            <PhoneInput
              defaultCountry="US"
              value={phoneNumber}
              onChange={setPhoneNumber}
              disabled={codeSent}
              countrySelectProps={{
                'aria-label': 'Country calling code',
                unicodeFlags: true,
              }}
              numberInputProps={{
                id: 'phone-number',
                required: true,
                placeholder: '555 123 4567',
                autoComplete: 'tel-national',
              }}
              className="auth-phone-input h-11 w-full rounded-lg border border-white/10 bg-secondary px-3 text-sm outline-none transition-colors focus-within:border-primary disabled:opacity-60"
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

        {/* <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Phone verification is required for phone sign-in. In local development, the OTP is printed by the backend until an SMS webhook is configured.
        </p> */}
      </div>
    </main>
  )
}

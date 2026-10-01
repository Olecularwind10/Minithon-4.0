import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react'
import { loginUser } from '../services/authService'

type LoginPageProps = {
  onLogin: (user: Awaited<ReturnType<typeof loginUser>>) => void
  errorMessage?: string
}

export default function LoginPage({ onLogin, errorMessage = '' }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(errorMessage)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setIsLoading(true)

    try {
      const user = await loginUser(email, password)
      onLogin(user)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-white text-[#0F172A] lg:grid-cols-2">
      <section className="flex min-h-[250px] flex-col justify-between bg-[#0F172A] px-7 py-8 text-white sm:px-12 sm:py-10 lg:min-h-screen lg:px-16 lg:py-14">
        <Link to="/" aria-label="Neighborly home" className="w-fit text-white no-underline">
          <span aria-label="NEIGHBOR" className="inline-flex items-center text-[30px] font-black leading-none sm:text-[36px]">
            NEIGHB<span aria-hidden="true" className="mx-[2px] inline-block size-[0.52em] rounded-full bg-[#FF6B6B]" />R
          </span>
        </Link>
        <div className="mt-12 max-w-lg lg:mt-0">
          <p className="text-2xl font-bold leading-tight sm:text-[32px]">Local Help. Instantly Routed.</p>
        </div>
        <p className="mt-8 text-xs font-medium text-white/70">Neighborly</p>
      </section>

      <section className="flex min-h-[594px] items-center justify-center bg-white px-6 py-12 sm:px-10 lg:min-h-screen lg:px-16">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="text-[30px] font-bold leading-tight">Welcome back</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#475569]">Sign in to your Neighborly account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#475569]">Email Address</span>
              <span className="relative block">
                <Mail size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" />
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-md border border-[#E2E8F0] bg-white pl-11 pr-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#475569]">Password</span>
              <span className="relative block">
                <LockKeyhole size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-md border border-[#E2E8F0] bg-white pl-11 pr-12 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded text-[#475569] hover:text-[#0F172A] focus-visible:outline-2 focus-visible:outline-[#0D9488]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMessage('Password reset is not configured in this demo.')}
                className="text-sm font-semibold text-[#0D9488] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#0D9488] px-4 text-sm font-bold text-white transition-colors hover:bg-[#0F766E] disabled:cursor-wait disabled:opacity-80"
            >
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : <>Sign in <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4 text-xs font-medium text-[#475569]">
            <span className="h-px flex-1 bg-[#E2E8F0]" />
            <span>Or continue with</span>
            <span className="h-px flex-1 bg-[#E2E8F0]" />
          </div>

          <button
            type="button"
            onClick={() => setMessage('Google sign-in is not configured in this demo.')}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-[#E2E8F0] bg-white text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
          >
            <span aria-hidden="true" className="text-base font-bold text-[#4285F4]">G</span>
            Sign in with Google
          </button>

          {message && <p role="status" className="mt-4 text-center text-sm text-[#475569]">{message}</p>}

          <p className="mt-8 text-center text-sm text-[#475569]">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#0D9488] no-underline hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import type { AuthUser, RegistrationDetails, RegistrationResult } from '../services/authService'

const skillOptions = [
  'Errands and groceries',
  'Pet care',
  'Tutoring',
  'Technology help',
  'Moving and lifting',
  'Home repairs',
  'Transportation',
  'Companionship',
]

const availabilityOptions = ['Weekday mornings', 'Weekday evenings', 'Weekends']

type SignupPageProps = {
  onRegister: (details: RegistrationDetails) => Promise<RegistrationResult>
  onVerify: (userId: string, otp: string, token: string) => Promise<AuthUser>
  onResendCode: (userId: string) => Promise<void>
  onAuthenticated: (user: AuthUser) => void
}

export default function SignupPage({ onRegister, onVerify, onResendCode, onAuthenticated }: SignupPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [availability, setAvailability] = useState<string[]>([])
  const [pendingRegistration, setPendingRegistration] = useState<RegistrationResult | null>(null)
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function toggleValue(value: string, values: string[], setValues: (next: string[]) => void) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (skills.length === 0) {
      setError('Choose at least one way you can help your neighbors.')
      return
    }

    setIsLoading(true)
    try {
      const result = await onRegister({ name, email, phone, address, area, password, skills, availability })
      setPendingRegistration(result)
      setNotice(`A verification code was sent to ${email}.`)
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Sign up failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pendingRegistration) return
    setError('')
    setIsLoading(true)
    try {
      const user = await onVerify(pendingRegistration.user.id, otp, pendingRegistration.token)
      onAuthenticated(user)
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendCode() {
    if (!pendingRegistration) return
    setError('')
    setNotice('')
    setIsLoading(true)
    try {
      await onResendCode(pendingRegistration.user.id)
      setNotice(`A new verification code was sent to ${email}.`)
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Could not resend the code.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-white text-[#0F172A] lg:grid-cols-[0.85fr_1.15fr]">
      <section className="flex min-h-[210px] flex-col justify-between bg-[#0F172A] px-7 py-8 text-white sm:px-12 sm:py-10 lg:min-h-screen lg:px-16 lg:py-14">
        <Link to="/" aria-label="Neighborly home" className="w-fit text-white no-underline">
          <span aria-label="NEIGHBOR" className="inline-flex items-center text-[30px] font-black leading-none sm:text-[36px]">
            NEIGHB<span aria-hidden="true" className="mx-[2px] inline-block size-[0.52em] rounded-full bg-[#FF6B6B]" />R
          </span>
        </Link>
        <div className="mt-10 max-w-lg lg:mt-0">
          <p className="text-2xl font-bold leading-tight sm:text-[32px]">A little help makes a stronger neighborhood.</p>
        </div>
        <p className="mt-8 text-xs font-medium text-white/70">Your details stay with your account.</p>
      </section>

      <section className="flex min-h-[calc(100vh-210px)] items-center justify-center bg-white px-6 py-10 sm:px-10 lg:min-h-screen lg:px-14">
        <div className="w-full max-w-[520px]">
          <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#475569] no-underline hover:text-[#0D9488]">
            <ArrowLeft size={16} /> Back to sign in
          </Link>

          {!pendingRegistration ? (
            <>
              <div className="mb-6">
                <h1 className="text-[30px] font-bold leading-tight">Create your account</h1>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">Tell your neighbors how to reach you and what help you can offer.</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#475569]">Full name</span>
                    <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3.5 text-sm focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#475569]">Email address</span>
                    <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3.5 text-sm focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#475569]">Contact number</span>
                    <input required type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3.5 text-sm focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#475569]">Password</span>
                    <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3.5 text-sm focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#475569]">Confirm password</span>
                    <input required type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3.5 text-sm focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#475569]">Address <span className="font-normal">(private)</span></span>
                    <input required autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street or building address" className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3.5 text-sm placeholder:text-[#94A3B8] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none" />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#475569]">Neighborhood</span>
                  <input required autoComplete="address-level2" value={area} onChange={(event) => setArea(event.target.value)} placeholder="Area or neighborhood" className="h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3.5 text-sm placeholder:text-[#94A3B8] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none" />
                </label>

                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-[#475569]">Ways I can help</legend>
                  <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                    {skillOptions.map((skill) => (
                      <label key={skill} className="flex items-center gap-2.5 py-1 text-sm text-[#0F172A]">
                        <input type="checkbox" checked={skills.includes(skill)} onChange={() => toggleValue(skill, skills, setSkills)} className="size-4 accent-[#0D9488]" />
                        {skill}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-[#475569]">Availability <span className="font-normal">(optional)</span></legend>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {availabilityOptions.map((time) => (
                      <label key={time} className="flex items-center gap-2 text-sm text-[#0F172A]">
                        <input type="checkbox" checked={availability.includes(time)} onChange={() => toggleValue(time, availability, setAvailability)} className="size-4 accent-[#0D9488]" />
                        {time}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {error && <p role="alert" className="text-sm font-medium text-[#c24141]">{error}</p>}
                {notice && <p role="status" className="text-sm font-medium text-[#0D9488]">{notice}</p>}

                <button type="submit" disabled={isLoading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#0D9488] px-4 text-sm font-bold text-white transition-colors hover:bg-[#0F766E] disabled:cursor-wait disabled:opacity-80">
                  {isLoading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : <>Create account <ArrowRight size={17} /></>}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <h1 className="text-[30px] font-bold leading-tight">Verify your email</h1>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">Enter the six-digit code sent to {email} to finish creating your account.</p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#475569]">Verification code</span>
                <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="h-12 w-full rounded-md border border-[#E2E8F0] bg-white px-4 text-center text-lg font-bold tracking-[0.2em] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] focus:outline-none" />
              </label>
              {error && <p role="alert" className="text-sm font-medium text-[#c24141]">{error}</p>}
              {notice && <p role="status" className="text-sm font-medium text-[#0D9488]">{notice}</p>}
              <button type="submit" disabled={isLoading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#0D9488] px-4 text-sm font-bold text-white transition-colors hover:bg-[#0F766E] disabled:cursor-wait disabled:opacity-80">
                {isLoading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <>Verify and continue <ArrowRight size={17} /></>}
              </button>
              <button type="button" disabled={isLoading} onClick={() => void handleResendCode()} className="w-full text-center text-sm font-semibold text-[#0D9488] hover:underline disabled:opacity-60">Resend verification code</button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
import { useState, type FormEvent } from 'react'
import { ArrowRight, HeartHandshake } from 'lucide-react'
import { loginAccount, registerAccount, storeAuthSession, type AuthSession } from '../lib/api'

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const session = mode === 'login'
        ? await loginAccount({ email, password })
        : await registerAccount({ name, email, password, phone, area })
      storeAuthSession(session)
      onAuthenticated(session)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not authenticate')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 py-10 text-ink">
      <section className="w-full max-w-[440px]">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent"><HeartHandshake size={23} /></span>
          <div>
            <p className="text-xs font-bold uppercase text-accent">Neighborhood Help</p>
            <h1 className="text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Join your neighbors'}</h1>
          </div>
        </div>

        <div className="mb-6 flex border-b border-line" role="tablist" aria-label="Account access">
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); setError('') }} className={`min-h-11 flex-1 border-b-2 text-sm font-semibold ${mode === 'login' ? 'border-action text-ink' : 'border-transparent text-muted'}`}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => { setMode('register'); setError('') }} className={`min-h-11 flex-1 border-b-2 text-sm font-semibold ${mode === 'register' ? 'border-action text-ink' : 'border-transparent text-muted'}`}>Create account</button>
        </div>

        <form onSubmit={submit} className="grid gap-4">
          {mode === 'register' && <>
            <label><span className="field-label">Name</span><input required autoComplete="name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="field-input" /></label>
            <label><span className="field-label">Phone</span><input autoComplete="tel" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="field-input" /></label>
            <label><span className="field-label">Neighborhood</span><input autoComplete="address-level2" maxLength={100} value={area} onChange={(event) => setArea(event.target.value)} placeholder="e.g. Parel" className="field-input" /></label>
          </>}
          <label><span className="field-label">Email</span><input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-input" /></label>
          <label><span className="field-label">Password</span><input required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" /></label>
          {error && <p role="alert" className="text-sm font-semibold text-action">{error}</p>}
          <button type="submit" disabled={busy} className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-action px-5 text-sm font-bold text-white disabled:opacity-60">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} {!busy && <ArrowRight size={17} />}
          </button>
        </form>
      </section>
    </main>
  )
}
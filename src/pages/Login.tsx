import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, isEditor, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { if (session && isEditor) navigate('/add') }, [session, isEditor, navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await signIn(email, password)
    setBusy(false)
    if (res.error) setError(res.error)
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="border-l-4 border-primary pl-4 py-1 mb-stack-lg">
        <h1 className="font-display-lg text-display-lg uppercase">Family Only</h1>
        <p className="font-label-mono text-label-mono text-on-surface-variant mt-2">If you have to ask, you're not on the list.</p>
      </header>
      <form onSubmit={submit} className="index-card p-6 flex flex-col gap-stack-md">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-label-caps text-label-caps uppercase">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="brutal-input bg-transparent border-0 brutal-border-bottom w-full font-body-md text-body-md py-2 px-0 outline-none" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-label-caps text-label-caps uppercase">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="brutal-input bg-transparent border-0 brutal-border-bottom w-full font-body-md text-body-md py-2 px-0 outline-none" />
        </div>
        {error && <p className="font-label-mono text-label-mono text-error">{error}</p>}
        <button type="submit" disabled={busy}
          className="bg-primary text-on-primary brutal-border brutal-shadow py-4 px-6 font-headline-sm text-headline-sm uppercase brutal-btn disabled:opacity-50">
          {busy ? 'Checking…' : 'Let Me In'}
        </button>
      </form>
    </div>
  )
}

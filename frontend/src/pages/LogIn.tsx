import { useEffect, useState, type FormEvent } from 'react'
import { login, socialLogin } from '../api/auth'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Field from '../components/ui/Field'
import Turnstile from '../components/Turnstile'

function LogIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  useEffect(() => {
    if (searchParams.get('emailChange') !== 'complete') return

    toast.success('Your email has been changed. You may need to sign in again.')
    const next = new URLSearchParams(searchParams)
    next.delete('emailChange')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, toast])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email || !password) return
    try {
      await login(email, password, captchaToken)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed.')
    }
  }

  async function handleSocialLogin(provider: 'google' | 'github') {
    try {
      await socialLogin(provider)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${provider} login failed.`)
    }
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-lg bg-accent w-9 h-9 flex items-center justify-center mb-3">
            <span className="text-[13px] font-bold font-mono text-on-accent">&lt;/&gt;</span>
          </div>
          <h1 className="text-lg font-semibold text-primary">Snippet Vault</h1>
          <p className="text-sm text-muted mt-1">Sign in to your account</p>
        </div>

        <div className="bg-surface border border-border-default rounded-xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              className="w-full bg-control hover:bg-interactive-strong"
              onClick={() => handleSocialLogin('google')}
            >
              Continue with Google
            </Button>
            <Button
              variant="secondary"
              className="w-full bg-control hover:bg-interactive-strong"
              onClick={() => handleSocialLogin('github')}
            >
              Continue with GitHub
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-divider" />
            <span className="text-[11px] text-muted">or</span>
            <div className="flex-1 h-px bg-divider" />
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </Field>
            <div className="flex justify-center">
              <Turnstile onVerify={setCaptchaToken} />
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Sign In
            </Button>
          </form>

        </div>

        <p className="text-center text-muted text-sm mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="inline-block py-2.5 -my-2.5 text-accent hover:text-accent-text-hover transition-colors duration-150">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}

export default LogIn

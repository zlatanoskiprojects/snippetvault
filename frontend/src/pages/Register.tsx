import { useEffect, useState, type FormEvent } from 'react'
import { register, sendVerificationEmail } from '../api/auth'
import { Link } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Field from '../components/ui/Field'
import Turnstile from '../components/Turnstile'

const RESEND_COOLDOWN_SECONDS = 60

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const toast = useToast()

  useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = window.setTimeout(() => {
      setResendCooldown(current => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resendCooldown])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cleanUsername = username.trim()
    if (!cleanUsername) {
      toast.error('Username is required.')
      return
    }

    try {
      await register(cleanUsername, email, captchaToken)
      setRegisteredEmail(email.trim())
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed.')
    }
  }

  async function handleResend() {
    if (!registeredEmail || isResending || resendCooldown > 0) return

    setIsResending(true)
    try {
      await sendVerificationEmail(registeredEmail)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      toast.success('Verification email sent.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend the verification email.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">

        <div className="flex flex-col items-center mb-7">
          <div className="rounded-lg bg-[#6366f1] w-9 h-9 flex items-center justify-center mb-3">
            <span className="text-[13px] font-bold font-mono text-white">&lt;/&gt;</span>
          </div>
          <h1 className="text-lg font-semibold text-white">Snippet Vault</h1>
          <p className="text-sm text-[#595e69] mt-1">
            {registeredEmail ? 'Verify your email' : 'Create your account'}
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 flex flex-col gap-4">
          {registeredEmail ? (
            <div className="flex flex-col items-center gap-4 text-center" aria-live="polite">
              <div>
                <h2 className="text-base font-semibold text-white">Check your email</h2>
                <p className="text-sm text-[#9ba3af] mt-2 leading-6">
                  We sent a verification link to{' '}
                  <span className="font-medium text-white break-all">{registeredEmail}</span>.
                  Open it to finish creating your account.
                </p>
              </div>
              <Button
                variant="secondary"
                className="w-full h-[40px]"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
              >
                {isResending
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend email'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Username">
                <Input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="h-[40px]"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-[40px]"
                />
              </Field>
              <div className="flex justify-center">
                <Turnstile onVerify={setCaptchaToken} />
              </div>
              <Button type="submit" variant="primary" className="w-full h-[40px]">
                Create Account
              </Button>
            </form>
          )}

        </div>

        <p className="text-center text-[#595e69] text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="inline-block py-2.5 -my-2.5 text-[#6366f1] hover:text-indigo-400 transition-colors duration-150">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register

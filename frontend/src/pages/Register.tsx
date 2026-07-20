import { useState, type FormEvent } from 'react'
import { register } from '../api/auth'
import { useNavigate, Link } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Field from '../components/ui/Field'
import Turnstile from '../components/Turnstile'

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const navigate = useNavigate()
  const toast = useToast()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cleanUsername = username.trim()
    if (!cleanUsername) {
      toast.error('Username is required.')
      return
    }

    try {
      await register(cleanUsername, email, password, captchaToken)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed.')
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
          <p className="text-sm text-[#595e69] mt-1">Create your account</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 flex flex-col gap-4">
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
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a password"
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

          <Button
            variant="ghost"
            className="w-full h-auto p-0 text-[#595e69] text-xs hover:text-[#9ba3af] hover:bg-transparent"
          >
            Continue as guest
          </Button>
        </div>

        <p className="text-center text-[#595e69] text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[#6366f1] hover:text-indigo-400 transition-colors duration-150">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register

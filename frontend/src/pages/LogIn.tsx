import { useState, type FormEvent } from 'react'
import { login } from '../api/auth'
import { useNavigate, Link } from 'react-router-dom'
import { useToast } from '../hooks/useToast'

function LogIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const toast = useToast()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email || !password) return
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-lg bg-[#6366f1] w-9 h-9 flex items-center justify-center mb-3">
            <span className="text-[13px] font-bold font-mono text-white">&lt;/&gt;</span>
          </div>
          <h1 className="text-lg font-semibold text-white">Snippet Vault</h1>
          <p className="text-sm text-[#595e69] mt-1">Sign in to your account</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="w-full h-[40px] bg-[#222] border border-[#2a2a2a] text-[#9ba3af] text-sm rounded-md hover:bg-[#2a2a2a] hover:text-white transition-colors duration-150"
            >
              Continue with Google
            </button>
            <button
              type="button"
              className="w-full h-[40px] bg-[#222] border border-[#2a2a2a] text-[#9ba3af] text-sm rounded-md hover:bg-[#2a2a2a] hover:text-white transition-colors duration-150"
            >
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[11px] text-[#595e69]">or</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-[#9ba3af] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-[40px] bg-[#222] border border-[#2a2a2a] rounded-md text-sm text-white placeholder-[#595e69] px-3 focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9ba3af] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-[40px] bg-[#222] border border-[#2a2a2a] rounded-md text-sm text-white placeholder-[#595e69] px-3 focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
              />
            </div>
            <button
              type="submit"
              className="w-full h-[40px] bg-[#6366f1] hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors duration-150"
            >
              Sign In
            </button>
          </form>

          <button
            type="button"
            className="w-full text-[#595e69] text-xs hover:text-[#9ba3af] transition-colors duration-150"
          >
            Continue as guest
          </button>
        </div>

        <p className="text-center text-[#595e69] text-sm mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#6366f1] hover:text-indigo-400 transition-colors duration-150">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}

export default LogIn
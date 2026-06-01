import { useState } from 'react'
import { register } from '../api/auth'
import { useNavigate } from 'react-router-dom'

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const response = await register(username, email, password)
      localStorage.setItem('token', response.token)
      navigate('/')
    } catch (err) {
      console.error('Registration failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
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
            <div>
              <label className="block text-xs text-[#9ba3af] mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="johndoe"
                className="w-full h-[40px] bg-[#222] border border-[#2a2a2a] rounded-md text-sm text-white placeholder-[#595e69] px-3 focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
              />
            </div>
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
                placeholder="Create a password"
                className="w-full h-[40px] bg-[#222] border border-[#2a2a2a] rounded-md text-sm text-white placeholder-[#595e69] px-3 focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
              />
            </div>
            <button
              type="submit"
              className="w-full h-[40px] bg-[#6366f1] hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors duration-150"
            >
              Create Account
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
          Already have an account?{' '}
          <a href="/login" className="text-[#6366f1] hover:text-indigo-400 transition-colors duration-150">
            Sign in
          </a>
        </p>

      </div>
    </div>
  )
}

export default Register
import { useState } from "react"
import { register } from "../api/auth"
import { useNavigate } from "react-router-dom"

function Register() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

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
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div style={{ width: '400px' }}>
                <div className="text-center mb-4">
                    <div className="logo-icon mx-auto mb-3">{'</>'}</div>
                    <h4 className="fw-bold mb-1">Snippet Vault</h4>
                    <p className="text-muted small mb-0">Create your account</p>
                </div>
                <div className="card">
                    <div className="card-body p-4">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small">Username</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="johndoe"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small">Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-indigo w-100 mb-3">
                                Create Account
                            </button>
                        </form>
                        <button className="btn btn-link w-100 text-muted text-decoration-none small">
                            Continue as guest
                        </button>
                    </div>
                </div>
                <p className="text-center text-muted small mt-3">
                    Already have an account?{' '}
                    <a href="/login" className="link-indigo">Sign in</a>
                </p>
            </div>
        </div>
    )
}

export default Register
function Register() {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div style={{ width: '400px' }}>
                <div className="text-center mb-4">
                    <div className="logo-icon mx-auto mb-3">
                        {'</>'}
                    </div>
                    <h4 className="fw-bold mb-1">Snippet Vault</h4>
                    <p className="text-muted small mb-0">Create your account</p>
                </div>
                <div className="card">
                    <div className="card-body p-4">
                        <div className="mb-3">
                            <label className="form-label small">Full Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="John Doe"
                                                        />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Create a password"
                            /></div>
                        <button className="btn btn-indigo w-100 mb-3">
                            Create Account
                        </button>
                        <button className="btn btn-link w-100 text-muted text-decoration-none small">
                            Continue as guest
                        </button>

                    </div>
                </div>
                <p className="text-center text-muted small mt-3">
                    Already have an account?{' '}
                    <a href="#" className="link-indigo">Sign in</a>
                </p>
            </div>
        </div>
    )
}

export default Register
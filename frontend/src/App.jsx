

import './App.css'

function App() {

  return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div style={{ width: '400px' }}>
          <div className="text-center mb-4">
            <div className="logo-icon mx-auto mb-3">
              &lt;/&gt;
            </div>
            <h4 className="fw-bold mb-1">Snippet Vault</h4>
            <p className="text-muted small mb-0">Sign in to your account</p>
          </div>
          <div className="card">
            <div className="card-body p-4">
              <button className="btn btn-dark w-100 mb-2 oauth-btn">
                Continue with Google
              </button>
              <button className="btn btn-dark w-100 oauth-btn">
                Continue with GitHub
              </button>
              <div className="divider my-4"></div>
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
                    placeholder="Enter your password"
                />
              </div>
              <button className="btn btn-indigo w-100 mb-3">
                Sign In
              </button>
              <button className="btn btn-link w-100 text-muted text-decoration-none small">
                Continue as guest
              </button>
            </div>
          </div>
          <p className="text-center text-muted small mt-3">
            Don't have an account?{' '}
            <a href="#" className="link-indigo">Sign up</a>
          </p>

        </div>
      </div>

  )
}

export default App

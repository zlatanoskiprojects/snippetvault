import {useState} from "react";
import {login} from "../api/auth";
import {useNavigate} from "react-router-dom";


function LogIn() {


    const[email,setEmail] = useState("");
    const[password,setPassword] = useState("");


    //navigate object so we can change the page after authentication is successful
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (!email || !password) {
            return;
        }

        try {
            const response = await login(email, password);
            if (response.error) {
                alert(response.error);
            } else {
                //store the token in local storage for future use
                localStorage.setItem('token', response.token);
                //navigate to the home page after successful login
                navigate('/');
            }
        }catch (error) {
            console.error('Error during login:', error);
        }
    }



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

                        <form onSubmit={handleSubmit}>
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
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-indigo w-100 mb-3">
                            Sign In
                        </button>
                        </form>
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

export default LogIn
import { Routes, Route, useNavigate } from 'react-router-dom'
import LogIn from './pages/LogIn'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'

function App() {
  const navigate = useNavigate()

  return (
    <Routes>
      <Route path="/login" element={<LogIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<LandingPage onGetStarted={() => navigate('/login')} />} />
    </Routes>
  )
}

export default App
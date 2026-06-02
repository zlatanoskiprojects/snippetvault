import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LogIn from './pages/LogIn'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'

function App() {
  const [appView, setAppView] = useState('landing')

  return (
    <Routes>
      <Route path="/login" element={<LogIn />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="*"
        element={
          appView === 'landing'
            ? <LandingPage onGetStarted={() => setAppView('app')} />
            : <Dashboard />
        }
      />
    </Routes>
  )
}

export default App
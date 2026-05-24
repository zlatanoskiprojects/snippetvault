import { Routes, Route } from "react-router-dom";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LogIn />} />
      <Route path="/register" element={<Register />} />

    </Routes>
  );
}

export default App;
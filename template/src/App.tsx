import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import { GuestRoute, ProtectedRoute } from '@/auth/guards'
import ForgotPassword from '@/pages/ForgotPassword'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ResetPassword from '@/pages/ResetPassword'
import VerifyEmail from '@/pages/VerifyEmail'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          {/* Logged in, email not necessarily verified */}
          <Route element={<ProtectedRoute />}>
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>
          {/* Logged in + verified: put your app routes here */}
          <Route element={<ProtectedRoute verified />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route path="*" element={<p className="p-8 text-center">Page not found. <Link className="text-indigo-600" to="/">Go home</Link></p>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

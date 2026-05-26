import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Mail, Lock, Shield, AlertCircle, ArrowRight, Store } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API_URL}/api/admin/auth/login`, { email, password })
      localStorage.setItem('admin_access_token', data.access_token)
      localStorage.setItem('admin_refresh_token', data.refresh_token)
      localStorage.setItem('admin_user', JSON.stringify(data.user))
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 hero-pattern bg-gray-50">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-600/20">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Admin Sign In</h1>
          <p className="text-gray-500 mt-2 flex items-center justify-center gap-2 text-sm">
            <Store size={14} /> ShopVerse Control Center
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-100 p-8">
          {error && (
            <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm border border-red-100">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-sm bg-gray-50/50"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-sm bg-gray-50/50"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

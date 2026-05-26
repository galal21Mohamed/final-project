import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  MessageSquare,
  ScrollText,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { adminApi, logAdminActivity } from './adminApi'

const nav = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/admin/logs', label: 'Activity', icon: ScrollText },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const raw = localStorage.getItem('admin_user')
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        setUser(null)
      }
    }
  }, [])

  const logout = async () => {
    const rt = localStorage.getItem('admin_refresh_token')
    try {
      await adminApi.post('/api/admin/auth/logout', { refresh_token: rt })
    } catch { /* ignore */ }
    await logAdminActivity('admin.logout', 'session', {})
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    navigate('/admin/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-600/20'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transform transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="font-display font-bold text-lg gradient-text">ShopVerse</span>
          <span className="ml-2 text-xs font-bold text-primary-600 uppercase tracking-wider">Admin</span>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)] pb-20">
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setSidebarOpen(false)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={logout}
            className="lg:hidden w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} /> Sign out
          </button>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white hidden lg:block">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl border border-gray-200 bg-white"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Signed in</p>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[12rem] sm:max-w-xs">
                {user?.email || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-primary-50 text-primary-700 uppercase">
              {user?.role || 'admin'}
            </span>
            <button
              type="button"
              onClick={logout}
              className="lg:hidden p-2 rounded-xl border border-gray-200 text-red-600"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

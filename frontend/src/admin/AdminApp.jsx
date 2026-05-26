import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import AdminLoginPage from './AdminLoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsAdminPage from './pages/ProductsAdminPage'
import OrdersAdminPage from './pages/OrdersAdminPage'
import UsersAdminPage from './pages/UsersAdminPage'
import CouponsAdminPage from './pages/CouponsAdminPage'
import ReviewsAdminPage from './pages/ReviewsAdminPage'
import LogsAdminPage from './pages/LogsAdminPage'
import SettingsAdminPage from './pages/SettingsAdminPage'
import NotificationsAdminPage from './pages/NotificationsAdminPage'

function RequireAdminAuth({ children }) {
  const token = localStorage.getItem('admin_access_token')
  if (!token) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route
        element={
          <RequireAdminAuth>
            <AdminLayout />
          </RequireAdminAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsAdminPage />} />
        <Route path="orders" element={<OrdersAdminPage />} />
        <Route path="users" element={<UsersAdminPage />} />
        <Route path="coupons" element={<CouponsAdminPage />} />
        <Route path="reviews" element={<ReviewsAdminPage />} />
        <Route path="logs" element={<LogsAdminPage />} />
        <Route path="notifications" element={<NotificationsAdminPage />} />
        <Route path="settings" element={<SettingsAdminPage />} />
      </Route>
    </Routes>
  )
}

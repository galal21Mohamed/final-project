import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

export const adminApi = axios.create({ baseURL: API_URL })

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

adminApi.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('admin_refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/api/admin/auth/refresh`, {
            refresh_token: refresh,
          })
          localStorage.setItem('admin_access_token', data.access_token)
          localStorage.setItem('admin_refresh_token', data.refresh_token)
          if (data.user) {
            localStorage.setItem('admin_user', JSON.stringify(data.user))
          }
          original.headers.Authorization = `Bearer ${data.access_token}`
          return adminApi(original)
        } catch {
          localStorage.removeItem('admin_access_token')
          localStorage.removeItem('admin_refresh_token')
          localStorage.removeItem('admin_user')
        }
      }
    }
    return Promise.reject(error)
  }
)

export async function logAdminActivity(action, resource, metadata) {
  try {
    await adminApi.post('/api/admin/activity-logs', {
      action,
      resource,
      metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata ?? {}),
    })
  } catch {
    /* best-effort audit */
  }
}

import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { adminApi, logAdminActivity } from '../adminApi'

const ROLES = ['customer', 'support', 'admin', 'super_admin']

export default function UsersAdminPage() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' })
  const [loading, setLoading] = useState(true)
  const me = JSON.parse(localStorage.getItem('admin_user') || '{}')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.get('/api/admin/users', {
        params: { page, limit: 12, search: search || undefined },
      })
      setRows(data.data || [])
      setTotal(data.total || 0)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = search ? 300 : 0
    const t = setTimeout(load, delay)
    return () => clearTimeout(t)
  }, [page, search])

  const create = async () => {
    await adminApi.post('/api/admin/users', { ...form, is_active: true })
    await logAdminActivity('user.create', 'user', { email: form.email })
    setModal(false)
    setForm({ name: '', email: '', password: '', role: 'customer' })
    load()
  }

  const toggleActive = async (u) => {
    await adminApi.put(`/api/admin/users/${u.id}`, { is_active: !u.is_active })
    await logAdminActivity('user.suspend_toggle', `user:${u.id}`, { is_active: !u.is_active })
    load()
  }

  const remove = async (u) => {
    if (u.id === me.id) return alert('Cannot delete yourself')
    if (!confirm(`Delete ${u.email}?`)) return
    await adminApi.delete(`/api/admin/users/${u.id}`)
    await logAdminActivity('user.delete', `user:${u.id}`, {})
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total} accounts</p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-sm"
        >
          <UserPlus size={18} /> New user
        </button>
      </div>

      <input
        placeholder="Search email or name…"
        className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20"
        value={search}
        onChange={(e) => { setPage(1); setSearch(e.target.value); }}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center">Loading…</td></tr>
            ) : rows.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-700">{u.role}</span>
                </td>
                <td className="px-4 py-3">{u.is_active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button type="button" className="text-xs font-bold text-primary-600" onClick={() => toggleActive(u)}>
                    {u.is_active ? 'Suspend' : 'Activate'}
                  </button>
                  <button type="button" className="text-xs font-bold text-red-600" onClick={() => remove(u)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="font-semibold text-primary-600 disabled:opacity-40">Prev</button>
          <button type="button" disabled={page * 12 >= total} onClick={() => setPage((p) => p + 1)} className="font-semibold text-primary-600 disabled:opacity-40">Next</button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-4">Create user</h3>
            <div className="space-y-3">
              <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="w-full border rounded-xl px-3 py-2 text-sm" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="px-4 py-2 rounded-xl border text-sm font-semibold" onClick={() => setModal(false)}>Cancel</button>
              <button type="button" className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold" onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

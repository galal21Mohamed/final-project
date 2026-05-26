import { useEffect, useState } from 'react'
import { adminApi, logAdminActivity } from '../adminApi'

export default function NotificationsAdminPage() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ target: '', subject: '', body: '' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.get('/api/admin/notifications')
      setRows(data.data || [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const send = async () => {
    await adminApi.post('/api/admin/notifications', { channel: 'email', ...form })
    await logAdminActivity('notification.enqueue', 'notification', { target: form.target })
    setForm({ target: '', subject: '', body: '' })
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900">Notifications</h1>
      <p className="text-gray-500 text-sm">Notification service outbox (demo marks messages as sent immediately).</p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3 max-w-xl">
        <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Recipient email" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
        <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <textarea className="w-full border rounded-xl px-3 py-2 text-sm min-h-[100px]" placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <button type="button" onClick={send} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold">Enqueue</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase">
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : rows.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-1 rounded-lg bg-primary-50 text-primary-700">{n.status}</span></td>
                <td className="px-4 py-3">{n.target}</td>
                <td className="px-4 py-3">{n.subject}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(n.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

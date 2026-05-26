import { useEffect, useState } from 'react'
import { adminApi } from '../adminApi'

export default function LogsAdminPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await adminApi.get('/api/admin/activity-logs', { params: { limit: 100 } })
        setRows(data.data || [])
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900">Activity log</h1>
      <p className="text-gray-500 text-sm">Immutable audit trail of admin actions (best-effort from dashboard).</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Meta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{r.admin_id}</td>
                <td className="px-4 py-3 font-semibold">{r.action}</td>
                <td className="px-4 py-3">{r.resource}</td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-500">{r.metadata}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

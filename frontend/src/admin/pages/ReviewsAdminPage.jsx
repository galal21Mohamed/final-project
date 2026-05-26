import { useEffect, useState } from 'react'
import { adminApi, logAdminActivity } from '../adminApi'

export default function ReviewsAdminPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.get('/api/admin/reviews', { params: { approved: 'false' } })
      setRows(Array.isArray(data) ? data : [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const moderate = async (id, approved) => {
    await adminApi.patch(`/api/admin/reviews/${id}`, { approved })
    await logAdminActivity('review.moderate', `review:${id}`, { approved })
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900">Reviews</h1>
      <p className="text-gray-500 text-sm">Pending moderation queue.</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No pending reviews</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.product_id}</td>
                <td className="px-4 py-3">{r.user_id}</td>
                <td className="px-4 py-3">{r.rating}★</td>
                <td className="px-4 py-3 max-w-xs truncate">{r.title}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button type="button" className="text-xs font-bold text-emerald-600" onClick={() => moderate(r.id, true)}>Approve</button>
                  <button type="button" className="text-xs font-bold text-red-600" onClick={() => moderate(r.id, false)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

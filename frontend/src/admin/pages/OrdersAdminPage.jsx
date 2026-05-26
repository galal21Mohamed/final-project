import { useEffect, useState } from 'react'
import { adminApi, logAdminActivity } from '../adminApi'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const PAY = ['pending', 'paid', 'refunded', 'failed']

export default function OrdersAdminPage() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (statusFilter) params.status = statusFilter
      const { data } = await adminApi.get('/api/admin/orders', { params })
      setRows(data.data || [])
      setTotal(data.total || 0)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, statusFilter])

  const patch = async (id, body) => {
    await adminApi.patch(`/api/admin/orders/${id}`, body)
    await logAdminActivity('order.update', `order:${id}`, body)
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Filter by fulfillment or payment state.</p>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
          <select
            className="mt-1 block w-full md:w-56 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading…</td></tr>
              ) : rows.map((o) => (
                <tr key={o.id} className="align-top hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-mono text-gray-500">{o.id}</td>
                  <td className="px-4 py-3">{o.user_id}</td>
                  <td className="px-4 py-3 font-semibold">${o.total_amount?.toFixed?.(2)}</td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      value={o.status}
                      onChange={(e) => patch(o.id, { status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      value={o.payment_status || 'paid'}
                      onChange={(e) => patch(o.id, { payment_status: e.target.value })}
                    >
                      {PAY.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.payment_method || 'card'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="text-sm font-semibold text-primary-600 disabled:opacity-40">Previous</button>
          <span className="text-xs text-gray-500">Page {page} / {total} orders</span>
          <button type="button" disabled={page * 12 >= total} onClick={() => setPage((p) => p + 1)} className="text-sm font-semibold text-primary-600 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  )
}

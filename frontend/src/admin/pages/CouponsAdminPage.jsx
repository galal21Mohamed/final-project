import { useEffect, useState } from 'react'
import { adminApi, logAdminActivity } from '../adminApi'

export default function CouponsAdminPage() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ code: '', percent_off: '10', max_uses: '100', active: true })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.get('/api/admin/coupons')
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

  const create = async () => {
    await adminApi.post('/api/admin/coupons', {
      code: form.code,
      percent_off: parseFloat(form.percent_off),
      max_uses: parseInt(form.max_uses, 10),
      active: form.active,
    })
    await logAdminActivity('coupon.create', 'coupon', { code: form.code })
    setForm({ code: '', percent_off: '10', max_uses: '100', active: true })
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete coupon?')) return
    await adminApi.delete(`/api/admin/coupons/${id}`)
    await logAdminActivity('coupon.delete', `coupon:${id}`, {})
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900">Coupons</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Code</label>
          <input className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">% off</label>
          <input type="number" className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Max uses</label>
          <input type="number" className="mt-1 w-full border rounded-xl px-3 py-2 text-sm" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
        </div>
        <button type="button" onClick={create} className="h-10 rounded-xl bg-primary-600 text-white text-sm font-semibold">Add coupon</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">%</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-3">{c.percent_off}%</td>
                <td className="px-4 py-3">{c.used_count}/{c.max_uses || '∞'}</td>
                <td className="px-4 py-3">{c.active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="text-red-600 text-xs font-bold" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

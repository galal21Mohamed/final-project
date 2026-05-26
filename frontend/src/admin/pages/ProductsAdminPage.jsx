import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminApi, logAdminActivity } from '../adminApi'

const empty = {
  name: '',
  description: '',
  category: '',
  price: '',
  original_price: '',
  stock: '0',
  image_url: '',
  badge: '',
  emoji: '',
  color: '',
}

export default function ProductsAdminPage() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.get('/api/admin/products', { params: { page, limit: 15 } })
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
  }, [page])

  const openCreate = () => {
    setForm(empty)
    setModal('create')
  }

  const openEdit = (p) => {
    setForm({
      ...empty,
      ...p,
      price: String(p.price),
      original_price: String(p.original_price || ''),
      stock: String(p.stock ?? 0),
    })
    setModal(p.id)
  }

  const save = async () => {
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      original_price: parseFloat(form.original_price) || 0,
      stock: parseInt(form.stock, 10) || 0,
    }
    if (modal === 'create') {
      await adminApi.post('/api/admin/products', payload)
      await logAdminActivity('product.create', 'product', { name: form.name })
    } else {
      await adminApi.put(`/api/admin/products/${modal}`, payload)
      await logAdminActivity('product.update', `product:${modal}`, { name: form.name })
    }
    setModal(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return
    await adminApi.delete(`/api/admin/products/${id}`)
    await logAdminActivity('product.delete', `product:${id}`, {})
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{total} items in catalog</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-primary-600/20"
        >
          <Plus size={18} /> New product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">Loading…</td>
                </tr>
              ) : rows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 text-gray-900">${p.price?.toFixed?.(2)}</td>
                  <td className="px-4 py-3">{p.stock ?? 0}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button type="button" className="p-2 rounded-lg text-primary-600 hover:bg-primary-50" onClick={() => openEdit(p)}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="p-2 rounded-lg text-red-600 hover:bg-red-50" onClick={() => remove(p.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-sm font-semibold text-primary-600 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {page}</span>
          <button
            type="button"
            disabled={page * 15 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="text-sm font-semibold text-primary-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
            <h3 className="font-display text-xl font-bold text-gray-900 mb-4">{modal === 'create' ? 'Create product' : 'Edit product'}</h3>
            <div className="grid gap-3">
              {['name', 'category', 'description', 'image_url', 'badge', 'emoji', 'color'].map((k) => (
                <div key={k}>
                  <label className="text-xs font-bold text-gray-500 uppercase">{k.replace('_', ' ')}</label>
                  <input
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    value={form[k] || ''}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
                  <input
                    type="number"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

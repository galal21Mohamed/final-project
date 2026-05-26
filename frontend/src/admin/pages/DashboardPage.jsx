import { useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { TrendingUp, Package, ShoppingBag, DollarSign } from 'lucide-react'
import { adminApi } from '../adminApi'

function StatCard({ title, value, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-display font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${accent}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [sales, setSales] = useState(null)
  const [products, setProducts] = useState({ total: 0 })
  const [orders, setOrders] = useState({ total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const [s, p, o] = await Promise.all([
          adminApi.get('/api/admin/analytics/sales'),
          adminApi.get('/api/admin/products', { params: { page: 1, limit: 1 } }),
          adminApi.get('/api/admin/orders', { params: { page: 1, limit: 1 } }),
        ])
        setSales(s.data)
        setProducts({ total: p.data.total ?? 0 })
        setOrders({ total: o.data.total ?? 0 })
      } catch {
        setSales(null)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const series = (sales?.series_7d || []).map((d) => ({
    day: d.day?.slice(5) || d.day,
    sales: Number(d.sales?.toFixed?.(2) ?? d.sales),
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Sales pulse, catalog size, and fulfillment volume.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total revenue"
              value={sales ? `$${Number(sales.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
              icon={DollarSign}
              accent="bg-gradient-to-br from-emerald-500 to-teal-600"
            />
            <StatCard
              title="Orders"
              value={orders.total.toLocaleString()}
              icon={ShoppingBag}
              accent="bg-gradient-to-br from-primary-600 to-indigo-600"
            />
            <StatCard
              title="Products"
              value={products.total.toLocaleString()}
              icon={Package}
              accent="bg-gradient-to-br from-violet-500 to-purple-600"
            />
            <StatCard
              title="7-day sales trend"
              value={series.length ? 'Live' : '—'}
              icon={TrendingUp}
              accent="bg-gradient-to-br from-pink-500 to-rose-600"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Sales (last 7 days)</h2>
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series.length ? series : [{ day: '—', sales: 0 }]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                    formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Sales']}
                  />
                  <Bar dataKey="sales" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

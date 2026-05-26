import { useEffect, useState } from 'react'
import { adminApi, logAdminActivity } from '../adminApi'

export default function SettingsAdminPage() {
  const [rows, setRows] = useState([])
  const [storeName, setStoreName] = useState('ShopVerse')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await adminApi.get('/api/admin/settings')
        setRows(data || [])
        const sn = data?.find?.((s) => s.key === 'store_branding')
        if (sn?.value) {
          try {
            const j = JSON.parse(sn.value)
            if (j.store_name) setStoreName(j.store_name)
          } catch { /* ignore */ }
        }
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const save = async () => {
    const value = JSON.stringify({ store_name: storeName, tagline: 'Curated commerce.' })
    await adminApi.put('/api/admin/settings/store_branding', { value })
    await logAdminActivity('settings.update', 'store_branding', { store_name: storeName })
    alert('Saved')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-gray-900">Settings</h1>
      <p className="text-gray-500 text-sm">Configuration stored in the user-service database (JSON values).</p>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Store display name</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>
          <button type="button" onClick={save} className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold">
            Save branding
          </button>
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer font-semibold text-gray-700">Raw keys ({rows.length})</summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded-lg overflow-x-auto">{JSON.stringify(rows, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  )
}

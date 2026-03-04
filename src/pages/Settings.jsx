import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { 
  User, 
  Shield, 
  Bell, 
  Globe,
  RefreshCw,
  Save
} from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { useAgentStore } from '../store/agent.store'
import LoadingSpinner from '../components/LoadingSpinner'

const Settings = () => {
  const { agent, logout } = useAuthStore()
  const { loadAgentData, isLoading } = useAgentStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState({
    refreshInterval: import.meta.env.VITE_REFRESH_INTERVAL || 5000,
    lowInkThreshold: import.meta.env.VITE_LOW_INK_THRESHOLD || 15,
    criticalThreshold: import.meta.env.VITE_CRITICAL_INK_THRESHOLD || 10,
    notifications: true,
    sound: false
  })

  useEffect(() => {
    loadAgentData()
  }, [])

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('client-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleRefresh = () => {
    loadAgentData()
  }

  if (isLoading && !agent) {
    return <LoadingSpinner />
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Globe }
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-500 text-sm">Manage your account and preferences</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </header>

      {saved && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm">
          Settings saved successfully!
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={agent?.name || ''}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={agent?.company || '-'}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={agent?.department || '-'}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hostname
                </label>
                <input
                  type="text"
                  value={agent?.hostname || '-'}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Platform
                </label>
                <input
                  type="text"
                  value={agent?.platform || '-'}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Agent ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agent?.id || ''}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(agent?.id || '')
                    }}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={agent?.apiKey || '••••••••••••••••'}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (agent?.apiKey) {
                        navigator.clipboard.writeText(agent.apiKey)
                      }
                    }}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Use this key for API authentication
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={logout}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  Logout from All Devices
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">Enable Notifications</h4>
                  <p className="text-sm text-slate-500">Receive alerts about printer status</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">Sound Alerts</h4>
                  <p className="text-sm text-slate-500">Play sound when new alert arrives</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sound}
                    onChange={(e) => setSettings({ ...settings, sound: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Refresh Interval (ms)
                </label>
                <select
                  value={settings.refreshInterval}
                  onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="3000">3 seconds</option>
                  <option value="5000">5 seconds</option>
                  <option value="10000">10 seconds</option>
                  <option value="30000">30 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Low Ink Threshold (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.lowInkThreshold}
                  onChange={(e) => setSettings({ ...settings, lowInkThreshold: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Critical Ink Threshold (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.criticalThreshold}
                  onChange={(e) => setSettings({ ...settings, criticalThreshold: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">System Info</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Version:</span> 1.0.0</p>
                  <p><span className="text-slate-500">API URL:</span> {import.meta.env.VITE_API_URL}</p>
                  <p><span className="text-slate-500">WS URL:</span> {import.meta.env.VITE_WS_URL}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Settings
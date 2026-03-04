import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Printer, 
  FileText, 
  Settings,
  Activity
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/auth.store'

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Printers', to: '/printers', icon: Printer },
  { name: 'Reports', to: '/reports', icon: FileText },
//   { name: 'Settings', to: '/settings', icon: Settings }
]

const Sidebar = () => {
  const { agent } = useAuthStore()

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden lg:flex">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Activity size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {agent?.name || 'Client'}
          </h1>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

    </aside>
  )
}

export default Sidebar
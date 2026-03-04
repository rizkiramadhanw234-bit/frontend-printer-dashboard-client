import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Bell, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/auth.store'
import { useUIStore } from '../store/ui.store'

const Header = () => {
  const navigate = useNavigate()
  const { agent, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [search, setSearch] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900">{agent?.name || 'Agent'}</p>
            <p className="text-xs text-slate-500">{agent?.department || 'Client'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-indigo-600 font-bold">
            {agent?.name?.charAt(0) || 'A'}
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}

export default Header
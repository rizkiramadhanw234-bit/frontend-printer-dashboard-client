import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, Printer } from 'lucide-react' 
import PrinterCard from '../components/PrinterCard'
import PrinterDetail from '../components/PrinterDetail' 
import LoadingSpinner from '../components/LoadingSpinner'
import { useAgentStore } from '../store/agent.store'
import { useWebSocket } from '../hooks/useWebSocket'
import { cn } from '../lib/utils'

const Printers = () => {
  const { printers, isLoading, loadAgentData } = useAgentStore()
  const { lastMessage } = useWebSocket()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPrinter, setSelectedPrinter] = useState(null)  // state buat printer yang diklik

  useEffect(() => {
    loadAgentData()
  }, [])

  useEffect(() => {
    if (lastMessage) {
      loadAgentData()
    }
  }, [lastMessage])

  const filteredPrinters = printers.filter(printer => {
    const matchesSearch = printer.name?.toLowerCase().includes(search.toLowerCase()) ||
                         printer.model?.toLowerCase().includes(search.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    if (statusFilter === 'online') {
      return matchesSearch && (printer.status === 'READY' || printer.status === 'ONLINE')
    }
    if (statusFilter === 'offline') {
      return matchesSearch && (printer.status === 'OFFLINE' || printer.status === 'DISCONNECTED')
    }
    if (statusFilter === 'warning') {
      return matchesSearch && printer.status === 'WARNING'
    }
    return matchesSearch
  })

  const statusOptions = [
    { value: 'all', label: 'All Printers' },
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'warning', label: 'Warning' }
  ]

  if (isLoading && !printers.length) {
    return <LoadingSpinner />
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Manajemen Printer</h2>
          <p className="text-slate-500 text-sm">Lihat detail dan status semua printer yang tersedia.</p>
        </header>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search printers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                    statusFilter === option.value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Printers Grid */}
        <AnimatePresence mode="wait">
          {filteredPrinters.length > 0 ? (
            <motion.div 
              key="printers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPrinters.map((printer) => (
                <div 
                  key={printer.id} 
                  onClick={() => setSelectedPrinter(printer)}  // ← klik card buka modal
                  className="cursor-pointer"
                >
                  <PrinterCard printer={printer} />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white p-12 rounded-2xl border border-slate-100 text-center"
            >
              <Printer className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No printers found</h3>
              <p className="text-slate-500 text-sm">
                {search || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No printers available for this agent'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal Detail Printer */}
      {selectedPrinter && (
        <PrinterDetail 
          printer={selectedPrinter} 
          onClose={() => setSelectedPrinter(null)} 
        />
      )}
    </>
  )
}

export default Printers
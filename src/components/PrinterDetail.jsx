import { X, Printer, Calendar } from 'lucide-react'
import { cn } from '../lib/utils'

const PrinterDetail = ({ printer, onClose, onViewHistory }) => {
  if (!printer) return null

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\./g, '')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{printer.name}</h2>
            <p className="text-sm text-slate-500">{printer.displayName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Agent ID</p>
              <p className="font-mono text-xs text-slate-900 mt-1 break-all">
                AGENT_YNIAAT8K_TUXI7W
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Vendor</p>
              <p className="font-medium text-slate-900 mt-1">{printer.vendor || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">IP Address</p>
              <p className="font-mono text-xs text-slate-900 mt-1">{printer.ipAddress || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Network</p>
              <p className="font-medium text-slate-900 mt-1">{printer.isNetwork ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Ink Levels */}
          {printer.inkLevels && Object.keys(printer.inkLevels).length > 0 && (
            <div>
              <p className="text-slate-500 text-xs mb-3">Ink Levels</p>
              <div className="space-y-3">
                {Object.entries(printer.inkLevels).map(([color, level]) => {
                  const levelNum = parseInt(level) || 0
                  let bgColor = 'bg-slate-900'
                  let label = color.charAt(0).toUpperCase() + color.slice(1)
                  
                  if (color.toLowerCase().includes('cyan')) bgColor = 'bg-cyan-400'
                  else if (color.toLowerCase().includes('magenta')) bgColor = 'bg-pink-500'
                  else if (color.toLowerCase().includes('yellow')) bgColor = 'bg-yellow-400'
                  else if (color.toLowerCase().includes('black')) bgColor = 'bg-slate-900'

                  return (
                    <div key={color} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-slate-600">{label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${levelNum}%` }}
                          className={cn("h-full rounded-full", bgColor)}
                        />
                      </div>
                      <span className="w-12 text-sm text-right text-slate-600">{levelNum}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-slate-500 text-xs">Today</p>
              <p className="text-lg font-bold text-slate-900">{printer.pagesToday || 0}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Total</p>
              <p className="text-lg font-bold text-slate-900">{printer.totalPages?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Last Print</p>
              <p className="text-sm font-medium text-slate-900">{printer.lastPrintTime ? formatDate(printer.lastPrintTime) : '-'}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>Created: {formatDate(printer.createdAt)}</p>
            <p>Updated: {formatDate(printer.updatedAt)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PrinterDetail
import { Printer, ChevronRight, FileText, Palette, ScanLine } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils'
import InkLevelIndicator from './InkLevelIndicator'

const PrinterCard = ({ printer, onClick }) => {
  const statusColors = {
    READY: 'bg-emerald-50 text-emerald-600',
    ONLINE: 'bg-emerald-50 text-emerald-600',
    PRINTING: 'bg-blue-50 text-blue-600',
    OFFLINE: 'bg-rose-50 text-rose-600',
    DISCONNECTED: 'bg-rose-50 text-rose-600',
    ERROR: 'bg-rose-50 text-rose-600',
    WARNING: 'bg-amber-50 text-amber-600'
  }

  const statusDotColors = {
    READY: 'bg-emerald-500',
    ONLINE: 'bg-emerald-500',
    PRINTING: 'bg-blue-500',
    OFFLINE: 'bg-rose-500',
    DISCONNECTED: 'bg-rose-500',
    ERROR: 'bg-rose-500',
    WARNING: 'bg-amber-500'
  }

  const status = printer.status || 'UNKNOWN'
  const statusColor = statusColors[status] || 'bg-slate-50 text-slate-600'
  const dotColor = statusDotColors[status] || 'bg-slate-500'

  // Parse ink levels
  let inkLevels = printer.ink_levels || printer.inkLevels || {}
  if (typeof inkLevels === 'string') {
    try { inkLevels = JSON.parse(inkLevels) } catch { inkLevels = {} }
  }
  const hasInkData = Object.keys(inkLevels).length > 0

  // Color/BW data — support both snake_case and camelCase
  const pagesToday = printer.pages_today ?? printer.pagesToday ?? 0
  const colorPagesToday = printer.color_pages_today ?? printer.colorPagesToday ?? 0
  const bwPagesToday = printer.bw_pages_today ?? printer.bwPagesToday ?? 0
  const hasColorData = colorPagesToday > 0 || bwPagesToday > 0
  const colorRatio = pagesToday > 0 ? Math.round((colorPagesToday / pagesToday) * 100) : 0
  const bwRatio = pagesToday > 0 ? 100 - colorRatio : 0

  const getInkAlert = () => {
    if (printer.printer_status_detail === 'no_ink') {
      return (
        <div className="mb-3 p-2 bg-rose-50 rounded-lg border border-rose-200">
          <p className="text-xs font-bold text-rose-600">
            No Ink - {printer.low_ink_colors?.join(', ') || 'Unknown'}
          </p>
        </div>
      )
    }
    if (printer.printer_status_detail === 'low_ink') {
      return (
        <div className="mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs font-bold text-amber-600">
            Low Ink - {printer.low_ink_colors?.join(', ') || 'Unknown'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      layout
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105"
    >
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className={cn("p-3 rounded-xl", statusColor)}>
            <Printer size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{printer.name || printer.display_name}</h4>
            <p className="text-xs text-slate-500">{printer.model || 'Printer'}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn("w-2 h-2 rounded-full", dotColor)} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {status}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-400" />
      </div>

      {getInkAlert()}

      {/* ── Ink Levels ── */}
      {hasInkData && (
        <div className="space-y-4">
          {Object.entries(inkLevels).map(([color, level]) => {
            if (color === 'drum') return null
            const levelNum = parseInt(level) || 0
            let bgColor = 'bg-slate-900'
            if (color.toLowerCase().includes('cyan')) bgColor = 'bg-cyan-400'
            else if (color.toLowerCase().includes('magenta')) bgColor = 'bg-pink-500'
            else if (color.toLowerCase().includes('yellow')) bgColor = 'bg-yellow-400'
            else if (color.toLowerCase().includes('black')) bgColor = 'bg-slate-900'
            return (
              <InkLevelIndicator key={color} label={color} percentage={levelNum} color={bgColor} />
            )
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
        {/* Pages today */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText size={14} />
            <span className="text-xs font-medium">{pagesToday.toLocaleString()} pages today</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 uppercase">
            {printer.location || printer.department || 'Office'}
          </span>
        </div>

        {/* ── Color vs B&W breakdown ── */}
        {hasColorData && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 bg-indigo-50 rounded-lg px-2 py-1.5">
                <Palette size={12} className="text-indigo-400 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-indigo-700">{colorPagesToday.toLocaleString()}</div>
                  <div className="text-[10px] text-indigo-400">Color {colorRatio}%</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 py-1.5">
                <ScanLine size={12} className="text-slate-400 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-700">{bwPagesToday.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">B&W {bwRatio}%</div>
                </div>
              </div>
            </div>
            {/* Ratio bar */}
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-100 flex">
              <div style={{ width: `${colorRatio}%`, backgroundColor: '#6366f1', transition: 'width 0.4s ease' }} />
              <div style={{ width: `${bwRatio}%`, backgroundColor: '#374151', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default PrinterCard
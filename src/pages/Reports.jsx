import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import {
  FileText, Calendar, ChevronLeft, ChevronRight,
  Download, FileDown, TrendingUp, Printer, Users,
  AlertCircle, BarChart3, Palette, ScanLine
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useReportStore } from '../store/report.store'
import { cn } from '../lib/utils'

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportToPDF(elementRef, filename) {
  const { default: jsPDF } = await import('jspdf')
  let html2canvas
  try {
    html2canvas = (await import('html2canvas-pro')).default
  } catch {
    html2canvas = (await import('html2canvas')).default
  }
  const element = elementRef.current
  if (!element) return
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgHeight = (canvas.height * pageWidth) / canvas.width
  let heightLeft = imgHeight, position = 0
  pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
  heightLeft -= pageHeight
  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
    heightLeft -= pageHeight
  }
  pdf.save(filename)
}

// ─── Shared Components ────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-500 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.fill || p.stroke }} />
          {p.name}: <span className="font-bold" style={{ color: p.fill || p.stroke }}>{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
      {payload.length >= 2 && (
        <p className="text-xs text-slate-400 border-t mt-1 pt-1">
          Total: {payload.reduce((s, p) => s + p.value, 0).toLocaleString()}
        </p>
      )}
    </div>
  )
}

// ─── Color vs B&W Summary ─────────────────────────────────────────────────────
function ColorBwSummary({ colorPages, bwPages, label = 'Breakdown' }) {
  const total = (colorPages || 0) + (bwPages || 0)
  const colorRatio = total > 0 ? Math.round((colorPages / total) * 100) : 0
  const bwRatio = total > 0 ? 100 - colorRatio : 0
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">{total.toLocaleString()} pages</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2.5">
          <Palette size={14} className="text-indigo-400 flex-shrink-0" />
          <div>
            <div className="text-base font-bold text-indigo-700">{(colorPages || 0).toLocaleString()}</div>
            <div className="text-[10px] text-indigo-400">Color — {colorRatio}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
          <ScanLine size={14} className="text-slate-400 flex-shrink-0" />
          <div>
            <div className="text-base font-bold text-slate-700">{(bwPages || 0).toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">B&W — {bwRatio}%</div>
          </div>
        </div>
      </div>
      {total > 0 && (
        <div className="space-y-1">
          <div className="h-2.5 w-full rounded-full overflow-hidden bg-slate-100 flex">
            <div style={{ width: `${colorRatio}%`, backgroundColor: '#6366f1', transition: 'width 0.5s ease' }} />
            <div style={{ width: `${bwRatio}%`, backgroundColor: '#374151', transition: 'width 0.5s ease' }} />
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-indigo-400" />Color</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-slate-600" />B&W</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getDatesBetween(start, end) {
  const dates = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

// ─── DAILY TAB ────────────────────────────────────────────────────────────────
function DailyTab() {
  const { fetchDailyDetail, dailyReport, isLoading, error } = useReportStore()
  const printRef = useRef(null)
  const today = new Date().toISOString().split('T')[0]
  const defaultStart = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0] })()

  const [mode, setMode] = useState('range')
  const [selectedDate, setSelectedDate] = useState(today)
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(today)
  const [appliedStart, setAppliedStart] = useState(defaultStart)
  const [appliedEnd, setAppliedEnd] = useState(today)
  const [chartType, setChartType] = useState('bar')
  const [isExporting, setIsExporting] = useState(false)
  const [rangeReports, setRangeReports] = useState([])
  const [rangeLoading, setRangeLoading] = useState(false)
  const [rangeSummary, setRangeSummary] = useState(null)

  useEffect(() => {
    if (mode === 'single') fetchDailyDetail(selectedDate)
  }, [selectedDate, mode])

  const fetchRange = async (start, end) => {
    if (!start || !end || start > end) return
    setRangeLoading(true)
    setRangeSummary(null)
    const dates = getDatesBetween(start, end)
    const agentId = localStorage.getItem('agent_id')
    const { api } = await import('../services/api')

    const responses = await Promise.allSettled(
      dates.map(date => api.getDailyReport({ date, agentId: agentId || undefined }))
    )

    const normalized = responses.map((res, i) => {
      const date = dates[i]
      if (res.status === 'rejected' || !res.value?.success) {
        return { date, totalPages: 0, agentCount: 0, printerCount: 0, colorPages: 0, bwPages: 0 }
      }
      const r = res.value
      const colorPages = parseInt(r.totalColorPages || r.colorPages || 0) ||
        (r.byPrinter?.reduce((s, p) => s + parseInt(p.colorPages || p.color_pages || 0), 0) ?? 0)
      const bwPages = parseInt(r.totalBwPages || r.bwPages || 0) ||
        (r.byPrinter?.reduce((s, p) => s + parseInt(p.bwPages || p.bw_pages || 0), 0) ?? 0)
      return {
        date,
        totalPages: parseInt(r.totalPages || 0),
        agentCount: r.agentCount || 0,
        printerCount: r.printerCount || (r.byPrinter?.length ?? 0),
        colorPages,
        bwPages,
      }
    })

    const totalPages = normalized.reduce((s, r) => s + r.totalPages, 0)
    const colorPages = normalized.reduce((s, r) => s + r.colorPages, 0)
    const bwPages = normalized.reduce((s, r) => s + r.bwPages, 0)
    const daysWithData = normalized.filter(r => r.totalPages > 0).length
    const pagesArr = normalized.map(r => r.totalPages)

    setRangeReports(normalized)
    setRangeSummary({
      totalPages, colorPages, bwPages,
      averagePages: daysWithData ? Math.round(totalPages / daysWithData) : 0,
      maxPages: Math.max(...pagesArr, 0),
      minPages: daysWithData ? Math.min(...pagesArr.filter(v => v > 0)) : 0,
      daysWithData,
      totalDays: dates.length,
    })
    setRangeLoading(false)
  }

  useEffect(() => {
    if (mode === 'range') fetchRange(appliedStart, appliedEnd)
  }, [mode])

  const handleApply = () => {
    setAppliedStart(startDate)
    setAppliedEnd(endDate)
    fetchRange(startDate, endDate)
  }

  // Stacked color/bw chart data
  const chartData = rangeReports.map(r => ({
    date: new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    color: r.colorPages,
    bw: r.bwPages,
    total: r.totalPages,
  }))

  const handleExportCSV = () => {
    if (mode === 'range') {
      const csv = [
        ['Date', 'Total Pages', 'Color Pages', 'B&W Pages', 'Printer Count'].join(','),
        ...rangeReports.map(r => [r.date, r.totalPages, r.colorPages, r.bwPages, r.printerCount].join(',')),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const a = document.createElement('a')
      a.href = window.URL.createObjectURL(blob)
      a.download = `daily-report-${appliedStart}-to-${appliedEnd}.csv`
      a.click()
    } else {
      const printers = dailyReport?.byPrinter || []
      const csv = [
        ['Printer', 'Agent', 'Total', 'Color', 'B&W'].join(','),
        ...printers.map(p => [
          `"${p.name || p.printer_name}"`,
          `"${p.agentName || p.agent_name || ''}"`,
          p.pages || p.total_pages || 0,
          p.colorPages || p.color_pages || 0,
          p.bwPages || p.bw_pages || 0,
        ].join(',')),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const a = document.createElement('a')
      a.href = window.URL.createObjectURL(blob)
      a.download = `daily-report-${selectedDate}.csv`
      a.click()
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportToPDF(printRef, mode === 'range'
        ? `daily-report-${appliedStart}-to-${appliedEnd}.pdf`
        : `daily-report-${selectedDate}.pdf`)
    } finally { setIsExporting(false) }
  }

  // Single day data
  const totalPagesSingle = parseInt(dailyReport?.totalPages || 0)
  const colorPagesSingle = parseInt(dailyReport?.totalColorPages || dailyReport?.colorPages || 0)
  const bwPagesSingle = parseInt(dailyReport?.totalBwPages || dailyReport?.bwPages || 0)
  const showLoading = mode === 'range' ? rangeLoading : isLoading

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {['single', 'range'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize',
                mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500')}>
              {m === 'single' ? 'Single Date' : 'Date Range'}
            </button>
          ))}
        </div>

        {mode === 'single' && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input type="date" value={selectedDate} max={today}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm outline-none bg-transparent" />
          </div>
        )}

        {mode === 'range' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input type="date" value={startDate} max={endDate}
                onChange={e => setStartDate(e.target.value)}
                className="text-sm outline-none bg-transparent" />
            </div>
            <span className="text-slate-400 text-sm">–</span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input type="date" value={endDate} min={startDate} max={today}
                onChange={e => setEndDate(e.target.value)}
                className="text-sm outline-none bg-transparent" />
            </div>
            <button onClick={handleApply}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
              Apply
            </button>
          </div>
        )}

        {mode === 'range' && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['bar', 'line'].map(type => (
              <button key={type} onClick={() => setChartType(type)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize',
                  chartType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500')}>
                {type}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 ml-auto">
          <button onClick={handleExportCSV}
            disabled={showLoading || (mode === 'single' ? !dailyReport : !rangeSummary)}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Download size={15} />CSV
          </button>
          <button onClick={handleExportPDF}
            disabled={isExporting || showLoading || (mode === 'single' ? !dailyReport : !rangeSummary)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <FileDown size={15} />{isExporting ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>

      {showLoading && <div className="flex justify-center py-16"><LoadingSpinner /></div>}

      {error && !showLoading && mode === 'single' && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {!showLoading && (
        <div ref={printRef} className="space-y-6 bg-white rounded-2xl">

          {/* ── RANGE MODE ── */}
          {mode === 'range' && rangeSummary && (
            <>
              {/* Header */}
              <div className="bg-slate-900 text-white rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Daily Report</div>
                    <div className="text-xl font-bold">
                      {new Date(appliedStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' – '}
                      {new Date(appliedEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {rangeSummary.daysWithData} of {rangeSummary.totalDays} days with activity
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Pages</div>
                    <div className="text-4xl font-black">{rangeSummary.totalPages.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Pages" value={rangeSummary.totalPages.toLocaleString()} />
                <SummaryCard label="Average Daily" value={rangeSummary.averagePages.toLocaleString()} sub="Pages per day" />
                <SummaryCard label="Peak Day" value={rangeSummary.maxPages.toLocaleString()} sub="Highest volume" />
                <SummaryCard label="Lowest Day" value={rangeSummary.minPages.toLocaleString()} sub="Lowest volume" />
              </div>

              {/* Color vs B&W Summary */}
              <ColorBwSummary
                colorPages={rangeSummary.colorPages}
                bwPages={rangeSummary.bwPages}
                label="Color vs B&W Breakdown (Range)"
              />

              {/* ── Stacked Chart ── */}
              {chartData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 size={16} className="text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-900">Color vs B&W Volume Trend</h3>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={chartData} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                            formatter={v => v === 'color' ? 'Color' : 'B&W'} />
                          <Bar dataKey="color" name="color" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]}
                            barSize={rangeSummary.totalDays > 20 ? 8 : 24} />
                          <Bar dataKey="bw" name="bw" stackId="a" fill="#374151" radius={[4, 4, 0, 0]}
                            barSize={rangeSummary.totalDays > 20 ? 8 : 24} />
                        </BarChart>
                      ) : (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                            formatter={v => v === 'color' ? 'Color' : 'B&W'} />
                          <Line type="monotone" dataKey="color" name="color" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
                          <Line type="monotone" dataKey="bw" name="bw" stroke="#374151" strokeWidth={3} dot={{ fill: '#374151', r: 4 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Daily Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="font-bold text-slate-700 text-sm">Daily Breakdown</span>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Date', 'Total', 'Color', 'B&W', 'Printers'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rangeReports.filter(r => r.totalPages > 0).map(r => {
                      const cRatio = r.totalPages > 0 ? Math.round((r.colorPages / r.totalPages) * 100) : 0
                      return (
                        <tr key={r.date} onClick={() => { setSelectedDate(r.date); setMode('single') }}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {new Date(r.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-indigo-600">{r.totalPages.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-indigo-500">
                            {r.colorPages.toLocaleString()}
                            <span className="text-[10px] text-slate-400 ml-1">({cRatio}%)</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{r.bwPages.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">{r.printerCount}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── SINGLE MODE ── */}
          {mode === 'single' && dailyReport && (
            <>
              <div className="bg-slate-900 text-white rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Daily Detail Report</div>
                    <div className="text-xl font-bold">
                      {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Pages</div>
                    <div className="text-4xl font-black">{totalPagesSingle.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Active Agents" value={dailyReport.agentCount ?? '-'} />
                <SummaryCard label="Active Printers" value={dailyReport.printerCount ?? '-'} />
                <SummaryCard label="Data Source" value={dailyReport.source ?? '-'} />
              </div>

              {/* Color vs B&W */}
              <ColorBwSummary
                colorPages={colorPagesSingle}
                bwPages={bwPagesSingle}
                label="Color vs B&W Breakdown"
              />

              {/* By Printer */}
              {dailyReport.byPrinter?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                    <Printer size={16} className="text-slate-400" />
                    <span className="font-bold text-slate-700 text-sm">By Printer</span>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Printer', 'Agent', 'Total', 'Color', 'B&W'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dailyReport.byPrinter.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3 text-sm font-medium text-slate-900 max-w-[200px] truncate">
                            {p.name || p.printer_name}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-500">{p.agentName || p.agent_name || '-'}</td>
                          <td className="px-6 py-3 text-sm font-bold text-indigo-600">
                            {parseInt(p.pages || p.total_pages || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-sm text-indigo-500">
                            {parseInt(p.colorPages || p.color_pages || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-500">
                            {parseInt(p.bwPages || p.bw_pages || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {mode === 'single' && !dailyReport && !isLoading && (
            <div className="text-center py-16 text-slate-400">
              <FileText className="mx-auto mb-3 text-slate-300" size={40} />
              <p>No data for this date</p>
            </div>
          )}

          <div className="text-xs text-slate-400 text-right">
            Generated {new Date().toLocaleString('id-ID')} • Printer Dashboard
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MONTHLY TAB ──────────────────────────────────────────────────────────────
function MonthlyTab() {
  const { fetchMonthlyReport, monthlyReport, isLoading, error, getMonthlyChartData } = useReportStore()
  const printRef = useRef(null)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [isExporting, setIsExporting] = useState(false)

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  useEffect(() => { fetchMonthlyReport(year, month) }, [year, month])

  const handlePrev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const handleNext = () => {
    if (isCurrentMonth) return
    if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const handleExportCSV = () => {
    const breakdown = monthlyReport?.dailyBreakdown || []
    const csv = [
      ['Date', 'Total Pages', 'Color Pages', 'B&W Pages', 'Active Agents', 'Active Printers'].join(','),
      ...breakdown.map(d => [
        new Date(d.print_date).toLocaleDateString('id-ID'),
        d.total_pages, d.color_pages || 0, d.bw_pages || 0,
        d.active_agents, d.active_printers,
      ].join(',')),
    ].join('\n')
    const a = document.createElement('a')
    a.href = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `monthly-report-${year}-${String(month).padStart(2, '0')}.csv`
    a.click()
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try { await exportToPDF(printRef, `monthly-report-${year}-${String(month).padStart(2, '0')}.pdf`) }
    finally { setIsExporting(false) }
  }

  const chartData = getMonthlyChartData()
  const summary = monthlyReport?.summary || {}
  const byPrinter = monthlyReport?.byPrinter || []
  const byAgent = monthlyReport?.byAgent || []
  const totalPages = parseInt(summary.totalPages) || 0
  // ✅ FIX: read totalColorPages/totalBwPages
  const colorPagesM = parseInt(summary.totalColorPages || summary.colorPages) || 0
  const bwPagesM = parseInt(summary.totalBwPages || summary.bwPages) || 0

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button onClick={handlePrev} className="px-3 py-2 hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16} className="text-slate-500" />
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-slate-800 min-w-[140px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={handleNext} disabled={isCurrentMonth} className="px-3 py-2 hover:bg-slate-50 disabled:opacity-30 transition-colors">
            <ChevronRight size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-400">Year</span>
          <input type="number" value={year} min={2020} max={now.getFullYear()}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm outline-none bg-transparent w-16 font-semibold" />
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={handleExportCSV}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Download size={15} />CSV
          </button>
          <button onClick={handleExportPDF} disabled={isExporting || isLoading || !monthlyReport}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <FileDown size={15} />{isExporting ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-16"><LoadingSpinner /></div>}
      {error && !isLoading && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {!isLoading && monthlyReport && (
        <div ref={printRef} className="space-y-6 bg-white rounded-2xl">
          {/* Header */}
          <div className="bg-slate-900 text-white rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Monthly Report</div>
                <div className="text-xl font-bold">{MONTHS[month - 1]} {year}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {monthlyReport.dailyBreakdown?.length || 0} active days •{' '}
                  Peak:{' '}
                  {summary.peakDay?.date
                    ? new Date(summary.peakDay.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                    : '-'}{' '}
                  ({parseInt(summary.peakDay?.pages || 0).toLocaleString()} pages)
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Total Pages</div>
                <div className="text-4xl font-black">{totalPages.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Total Pages" value={totalPages.toLocaleString()} />
            <SummaryCard label="Avg / Day" value={Math.round(summary.averageDailyPages || 0).toLocaleString()} sub="Pages per day" />
            <SummaryCard label="Print Jobs" value={summary.totalPrintJobs || 0} />
            <SummaryCard label="Active Printers" value={summary.activePrinters || 0} sub={`${summary.activeAgents || 0} agents`} />
          </div>

          {/* Color vs B&W Summary */}
          <ColorBwSummary
            colorPages={colorPagesM}
            bwPages={bwPagesM}
            label={`Color vs B&W — ${MONTHS[month - 1]} ${year}`}
          />

          {/* ── Stacked Chart ── */}
          {chartData.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={16} className="text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900">Daily Color vs B&W Volume</h3>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                      formatter={v => v === 'color' ? 'Color' : 'B&W'} />
                    <Bar dataKey="color" name="color" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={24} />
                    <Bar dataKey="bw" name="bw" stackId="a" fill="#374151" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* By Printer */}
          {byPrinter.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <Printer size={16} className="text-slate-400" />
                <span className="font-bold text-slate-700 text-sm">By Printer</span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Printer', 'Vendor', 'Jobs', 'Total Pages', 'Color', 'B&W'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {byPrinter.map((p, i) => {
                    // ✅ FIX: backend returns camelCase
                    const total = parseInt(p.pages || p.total_pages || 0)
                    const color = parseInt(p.colorPages || p.color_pages || 0)
                    const bw = parseInt(p.bwPages || p.bw_pages || 0)
                    const cRat = total > 0 ? Math.round((color / total) * 100) : 0
                    return (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 text-sm font-medium text-slate-900 max-w-[180px]">
                          <div className="truncate">{p.name || p.display_name || p.printer_name}</div>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-500">
                          {p.vendor && p.vendor !== 'Unknown'
                            ? <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold">{p.vendor}</span>
                            : '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-500">{p.printCount || p.print_count}</td>
                        <td className="px-6 py-3 text-sm font-bold text-indigo-600">{total.toLocaleString()}</td>
                        <td className="px-6 py-3 text-sm text-indigo-500">
                          {color.toLocaleString()}
                          <span className="text-[10px] text-slate-400 ml-1">({cRat}%)</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-500">{bw.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* By Agent */}
          {byAgent.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <Users size={16} className="text-slate-400" />
                <span className="font-bold text-slate-700 text-sm">By Agent</span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Agent', 'Department', 'Jobs', 'Total', 'Color', 'B&W', 'Last Print'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {byAgent.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      {/* ✅ FIX: camelCase */}
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">{a.agentName || a.agent_name}</td>
                      <td className="px-6 py-3 text-sm text-slate-500">{a.departmentName || a.department_name || '-'}</td>
                      <td className="px-6 py-3 text-sm text-slate-500">{a.printCount || a.print_count}</td>
                      <td className="px-6 py-3 text-sm font-bold text-indigo-600">
                        {parseInt(a.pages || a.total_pages || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-indigo-500">
                        {parseInt(a.colorPages || a.color_pages || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">
                        {parseInt(a.bwPages || a.bw_pages || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {(a.lastPrint || a.last_print)
                          ? new Date(a.lastPrint || a.last_print).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-xs text-slate-400 text-right">
            Generated {new Date().toLocaleString('id-ID')} • Printer Dashboard
          </div>
        </div>
      )}

      {!isLoading && !error && !monthlyReport && (
        <div className="text-center py-16 text-slate-400">
          <BarChart3 className="mx-auto mb-3 text-slate-300" size={40} />
          <p>No data for this period</p>
        </div>
      )}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily')
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Laporan</h2>
          <p className="text-slate-500 text-sm">Daily & monthly print history</p>
        </div>
      </header>

      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {[
          { id: 'daily', icon: <Calendar size={15} />, label: 'Daily' },
          { id: 'monthly', icon: <TrendingUp size={15} />, label: 'Monthly' },
        ].map(({ id, icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
              activeTab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500')}>
            {icon}{label}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && <DailyTab />}
      {activeTab === 'monthly' && <MonthlyTab />}
    </motion.div>
  )
}

export default Reports
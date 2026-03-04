import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { 
  FileText, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useReportStore } from '../store/report.store'
import { cn } from '../lib/utils'

const Reports = () => {
  const { 
    reports, 
    summary,
    pagination,
    isLoading,
    fetchReports,
    goToPage,
    getChartData
  } = useReportStore()

  const [chartType, setChartType] = useState('bar')
  const [dateRange, setDateRange] = useState('7')

  useEffect(() => {
    fetchReports({ limit: parseInt(dateRange) })
  }, [dateRange])

  const chartData = getChartData()

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1)
      fetchReports({ page: pagination.page - 1, limit: pagination.limit })
    }
  }

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      goToPage(pagination.page + 1)
      fetchReports({ page: pagination.page + 1, limit: pagination.limit })
    }
  }

  const handleExport = () => {
    const csv = [
      ['Date', 'Total Pages', 'Printer Count', 'B&W Pages', 'Color Pages'].join(','),
      ...reports.map(r => [
        r.report_date,
        r.total_pages,
        r.printer_count,
        r.bw_pages || 0,
        r.color_pages || 0
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Laporan Harian</h2>
          <p className="text-slate-500 text-sm">History pemakaian printer per hari</p>
        </div>

        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Pages</p>
          <h3 className="text-2xl font-bold text-slate-900">{summary.totalPages.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 mt-2">From {summary.daysWithData} days</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Average Daily</p>
          <h3 className="text-2xl font-bold text-slate-900">{summary.averagePages.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 mt-2">Pages per day</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Peak Day</p>
          <h3 className="text-2xl font-bold text-slate-900">{summary.maxPages.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 mt-2">Highest volume</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Lowest Day</p>
          <h3 className="text-2xl font-bold text-slate-900">{summary.minPages.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 mt-2">Lowest volume</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Volume Trend</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setChartType('bar')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  chartType === 'bar' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                )}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('line')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  chartType === 'line' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                )}
              >
                Line
              </button>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pages" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="pages" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pages</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">B&W</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Color</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Printers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {new Date(report.report_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{report.total_pages}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{report.bw_pages || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{report.color_pages || 0}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                        {report.printer_count}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <FileText className="mx-auto text-slate-300 mb-3" size={40} />
                    <p>No reports found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.page === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextPage}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default Reports
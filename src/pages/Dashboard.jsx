import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FileText,
    Printer,
    Droplets,
    Activity
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { motion } from 'motion/react'
import StatCard from '../components/StatCard'
import PrinterCard from '../components/PrinterCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAgentStore } from '../store/agent.store'
import { useReportStore } from '../store/report.store'
import { useWebSocket } from '../hooks/useWebSocket'
import { cn } from '../lib/utils'

const CHART_MODES = [
    { key: 'daily', label: 'Daily', days: 1 },
    { key: 'weekly', label: 'Weekly', days: 7 },
    { key: 'monthly', label: 'Monthly', days: 30 },
]

const Dashboard = () => {
    const navigate = useNavigate()
    const {
        printers,
        isLoading: agentLoading,
        loadAgentData,
        getStats
    } = useAgentStore()
    const {
        reports,
        isLoading: reportLoading,
        fetchReports,
        getChartData
    } = useReportStore()

    const { lastMessage } = useWebSocket()
    const stats = getStats()

    const [chartMode, setChartMode] = useState('weekly')

    useEffect(() => {
        loadAgentData()
        fetchReports({ limit: 7 }) // default weekly
    }, [])

    useEffect(() => {
        if (lastMessage) {
            loadAgentData()
        }
    }, [lastMessage])

    const handleChartMode = (mode) => {
        setChartMode(mode.key)
        fetchReports({ limit: mode.days })
    }

    if (agentLoading && !printers.length) {
        return <LoadingSpinner />
    }

    const chartData = getChartData()

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                    <p className="text-slate-500 text-sm">Overview printer dan aktivitas hari ini</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className='hover:scale-105 transition-all cursor-pointer'>
                    <StatCard
                        title="Total Prints Today"
                        value={stats.pagesToday.toLocaleString()}
                        icon={FileText}
                        color="bg-indigo-600"
                    />
                </div>
                <div className='hover:scale-105 transition-all cursor-pointer'>
                    <StatCard
                        title="Active Printers"
                        value={`${stats.online} / ${stats.total}`}
                        icon={Printer}
                        color="bg-emerald-500"
                    />
                </div>
                <div className='hover:scale-105 transition-all cursor-pointer'>
                    <StatCard
                        title="Low Ink Alerts"
                        value={stats.lowInk + stats.criticalInk}
                        icon={Droplets}
                        color="bg-amber-500"
                    />
                </div>
                <div className='hover:scale-105 transition-all cursor-pointer'>
                    <StatCard
                        title="System Status"
                        value={stats.offline > 0 ? 'Issues' : 'Healthy'}
                        icon={Activity}
                        color="bg-slate-900"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Charts Section */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className='flex items-center gap-4 mb-6'>
                            <h3 className="text-lg font-bold text-slate-900 flex-1">
                                Print Volume
                                <span className="text-slate-400 font-normal text-sm ml-2">
                                    {chartMode === 'daily' && '(Hari Ini)'}
                                    {chartMode === 'weekly' && '(7 Hari Terakhir)'}
                                    {chartMode === 'monthly' && '(30 Hari Terakhir)'}
                                </span>
                            </h3>

                            {/* Mode Toggle */}
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                {CHART_MODES.map((mode) => (
                                    <button
                                        key={mode.key}
                                        onClick={() => handleChartMode(mode)}
                                        disabled={reportLoading}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50',
                                            chartMode === mode.key
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        )}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {reportLoading ? (
                            <div className="h-72 flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        ) : chartData.length > 0 ? (
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                            interval={chartMode === 'monthly' ? 4 : 0}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                            }}
                                            formatter={(value, name) => [value, name === 'color' ? 'Color' : 'B&W']}
                                        />
                                        <Legend 
                                            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                                            formatter={v => v === 'color' ? 'Color' : 'B&W'} 
                                        />
                                        <Bar
                                            dataKey="color"
                                            name="color"
                                            stackId="a"
                                            fill="#6366f1"
                                            radius={[0, 0, 0, 0]}
                                            barSize={chartMode === 'monthly' ? 10 : 30}
                                        />
                                        <Bar
                                            dataKey="bw"
                                            name="bw"
                                            stackId="a"
                                            fill="#374151"
                                            radius={[4, 4, 0, 0]}
                                            barSize={chartMode === 'monthly' ? 10 : 30}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                                No data for this period
                            </div>
                        )}
                    </section>

                    {/* Recent Reports */}
                    {reports.length > 0 && (
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Laporan Terbaru</h3>
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left border-b border-slate-50">
                                            <th className="pb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal</th>
                                            <th className="pb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pages</th>
                                            <th className="pb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Printers</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {reports.filter(r => r.total_pages > 0).slice(0, 5).map((report, index) => (
                                            <tr key={report.id || `report-${index}`} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 text-sm font-medium text-slate-900">
                                                    {new Date(report.report_date).toLocaleDateString('id-ID', {
                                                        weekday: 'short', day: 'numeric', month: 'short'
                                                    })}
                                                </td>
                                                <td className="py-4 text-sm font-bold text-indigo-600">
                                                    {report.total_pages.toLocaleString()}
                                                </td>
                                                <td className="py-4 text-sm text-slate-500">{report.printer_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>

                {/* Printers Preview */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Printer Status</h3>
                        <button
                            onClick={() => navigate('/printers')}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            View All
                        </button>
                    </div>

                    <div className="space-y-4">
                        {printers.slice(0, 3).map((printer) => (
                            <PrinterCard
                                key={printer.id}
                                printer={printer}
                                onClick={() => navigate('/printers')}
                            />
                        ))}
                    </div>

                    {printers.length === 0 && (
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
                            <Printer className="mx-auto text-slate-300 mb-3" size={40} />
                            <p className="text-slate-500 text-sm">No printers found</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

export default Dashboard
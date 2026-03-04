import { useEffect } from 'react'
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
    ResponsiveContainer
} from 'recharts'
import { motion } from 'motion/react'
import StatCard from '../components/StatCard'
import PrinterCard from '../components/PrinterCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAgentStore } from '../store/agent.store'
import { useReportStore } from '../store/report.store'
import { useWebSocket } from '../hooks/useWebSocket'

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

    useEffect(() => {
        loadAgentData()
        fetchReports({ limit: 7 })
    }, [])

    useEffect(() => {
        if (lastMessage) {
            loadAgentData()
        }
    }, [lastMessage])

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
                    {chartData.length > 0 && (
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className='flex max-w-oo7xl gap-4'>
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Print Volume (7 Hari Terakhir)</h3>
                                <div className='bg-blue-700 flex items-center justify-center px-4 py-2 rounded-xl cursor-pointer hover:bg-blue-600 hover:scale-105 transition-all'>
                                    <p className=' text-white text-sm'>Daily</p>
                                </div>
                                <div className='bg-blue-700 flex items-center justify-center px-4 py-2 rounded-xl cursor-pointer hover:bg-blue-600 hover:scale-105 transition-all'>
                                    <p className=' text-white text-sm'>Weekly</p>
                                </div>
                                <div className='bg-blue-700 flex items-center justify-center px-4 py-2 rounded-xl cursor-pointer hover:bg-blue-600 hover:scale-105 transition-all'>
                                    <p className='text-white'>Montly</p>
                                </div>
                            </div>

                            <div className="h-75 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
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
                                        />
                                        <Bar dataKey="pages" name="Pages" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    )}

                    {/* Recent Reports */}
                    {reports.length > 0 && (
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Laporan Terbaru</h3>
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
                                        {reports.slice(0, 5).map((report) => (
                                            <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 text-sm font-medium text-slate-900">
                                                    {new Date(report.report_date).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 text-sm text-slate-500">{report.total_pages}</td>
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
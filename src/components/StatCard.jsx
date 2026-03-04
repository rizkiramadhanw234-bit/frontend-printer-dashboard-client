import { motion } from 'motion/react'
import { cn } from '../lib/utils'

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
        {trend !== undefined && (
          <p className={cn("text-xs mt-2 font-medium", trend > 0 ? "text-emerald-600" : "text-rose-600")}>
            {trend > 0 ? '+' : ''}{trend}%
          </p>
        )}
      </div>
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </motion.div>
)

export default StatCard
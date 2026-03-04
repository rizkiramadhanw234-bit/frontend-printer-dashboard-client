import { cn } from '../lib/utils'

const InkLevelIndicator = ({ label, percentage, color }) => {
  const threshold = parseInt(import.meta.env.VITE_LOW_INK_THRESHOLD) || 15
  const criticalThreshold = parseInt(import.meta.env.VITE_CRITICAL_INK_THRESHOLD) || 10
  
  let textColor = 'text-slate-900'
  if (percentage <= criticalThreshold) textColor = 'text-rose-600'
  else if (percentage <= threshold) textColor = 'text-amber-600'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={cn(textColor)}>{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          style={{ width: `${percentage}%` }}
          className={cn("h-full rounded-full transition-all duration-500", color)}
        />
      </div>
    </div>
  )
}

export default InkLevelIndicator
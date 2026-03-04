export const PRINTER_STATUS = {
  READY: 'READY',
  ONLINE: 'ONLINE',
  PRINTING: 'PRINTING',
  OFFLINE: 'OFFLINE',
  DISCONNECTED: 'DISCONNECTED',
  ERROR: 'ERROR',
  WARNING: 'WARNING'
}

export const INK_COLORS = {
  CYAN: { label: 'Cyan', bg: 'bg-cyan-400' },
  MAGENTA: { label: 'Magenta', bg: 'bg-pink-500' },
  YELLOW: { label: 'Yellow', bg: 'bg-yellow-400' },
  BLACK: { label: 'Black', bg: 'bg-slate-900' }
}

export const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' }
]

export const REFRESH_INTERVALS = [
  { value: 3000, label: '3 seconds' },
  { value: 5000, label: '5 seconds' },
  { value: 10000, label: '10 seconds' },
  { value: 30000, label: '30 seconds' }
]
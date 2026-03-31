export const PRINTER_STATUS = {
  READY: 'READY',
  ONLINE: 'ONLINE',
  PRINTING: 'PRINTING',
  OFFLINE: 'OFFLINE',
  DISCONNECTED: 'DISCONNECTED',
  ERROR: 'ERROR',
  WARNING: 'WARNING'
}

export const PRINTER_STATUS_DETAIL = {
  READY: 'ready',
  PRINTING: 'printing',
  OFFLINE: 'offline',
  PAUSED: 'paused',
  PAPER_JAM: 'paper_jam',
  OUT_OF_PAPER: 'out_of_paper',
  DOOR_OPEN: 'door_open',
  LOW_INK: 'low_ink',
  NO_INK: 'no_ink',
  ERROR_OTHER: 'error_other',
  UNKNOWN: 'unknown'
}

export const INK_COLORS = {
  black: { label: 'Black', bg: 'bg-slate-900', text: 'text-white' },
  cyan: { label: 'Cyan', bg: 'bg-cyan-400', text: 'text-white' },
  magenta: { label: 'Magenta', bg: 'bg-pink-500', text: 'text-white' },
  yellow: { label: 'Yellow', bg: 'bg-yellow-400', text: 'text-slate-900' },
  drum: { label: 'Drum', bg: 'bg-purple-500', text: 'text-white' }
}

export const INK_THRESHOLDS = {
  CRITICAL: 10,
  LOW: 15,
  NORMAL: 100
}
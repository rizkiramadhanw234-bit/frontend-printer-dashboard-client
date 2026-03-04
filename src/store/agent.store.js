import { create } from 'zustand'
import { api } from '../services/api'
import { useAuthStore } from './auth.store'

export const useAgentStore = create((set, get) => ({
  agent: null,
  printers: [],
  statistics: {},
  systemInfo: {},
  isLoading: false,
  error: null,

  loadAgentData: async () => {
    const { agentId } = useAuthStore.getState()
    if (!agentId) return

    set({ isLoading: true, error: null })

    try {
      const response = await api.getAgent(agentId)

      if (response.success) {
        set({
          agent: response.agent,
          printers: response.printers || [],
          statistics: response.statistics || {},
          systemInfo: response.system || {},
          isLoading: false
        })
      }
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  refresh: () => {
    get().loadAgentData()
  },

  getStats: () => {
    const printers = get().printers
    const lowInkThreshold = parseInt(import.meta.env.VITE_LOW_INK_THRESHOLD) || 15
    const criticalThreshold = parseInt(import.meta.env.VITE_CRITICAL_INK_THRESHOLD) || 10

    let lowInk = 0
    let criticalInk = 0
    let pagesToday = 0

    printers.forEach(printer => {
      if (printer.ink_levels) {
        Object.values(printer.ink_levels).forEach(level => {
          const numLevel = parseInt(level) || 0
          if (numLevel <= criticalThreshold) criticalInk++
          else if (numLevel <= lowInkThreshold) lowInk++
        })
      }
      pagesToday += printer.pagesToday || 0
    })

    return {
      total: printers.length,
      online: printers.filter(p => p.status === 'READY' || p.status === 'ONLINE').length,
      offline: printers.filter(p => p.status === 'OFFLINE' || p.status === 'DISCONNECTED').length,
      lowInk,
      criticalInk,
      pagesToday
    }
  },

  getPrinterByName: (name) => {
    return get().printers.find(p => p.name === name || p.display_name === name)
  },

  pausePrinter: async (printerName) => {
    const { agentId } = useAuthStore.getState()
    if (!agentId) return

    try {
      await api.pausePrinter(agentId, printerName)
      setTimeout(() => get().loadAgentData(), 1000)
    } catch (error) {
      console.error('Failed to pause printer:', error)
    }
  },

  resumePrinter: async (printerName) => {
    const { agentId } = useAuthStore.getState()
    if (!agentId) return

    try {
      await api.resumePrinter(agentId, printerName)
      setTimeout(() => get().loadAgentData(), 1000)
    } catch (error) {
      console.error('Failed to resume printer:', error)
    }
  },

  reset: () => {
    set({
      agent: null,
      printers: [],
      statistics: {},
      systemInfo: {},
      error: null,
      isLoading: false
    })
  }
}))
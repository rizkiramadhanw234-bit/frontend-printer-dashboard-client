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
        if (!agentId) {
            console.warn('❌ No agentId found')
            return
        }

        set({ isLoading: true, error: null })

        try {
            const response = await api.getAgent(agentId)
            console.log('🔥 RAW getAgent response:', response)
            
            if (response.printers?.length > 0) {
                console.log('📦 Printer pertama (asli):', response.printers[0])
            }

            if (response.success) {
                const normalizedPrinters = (response.printers || []).map(p => ({
                    ...p,
                    printer_status_detail: p.printer_status_detail || p.printerStatusDetail || 'unknown',
                    low_ink_colors: p.low_ink_colors || p.lowInkColors || [],
                    ink_levels: p.ink_levels || p.inkLevels || {},
                }))

                set({
                    agent: response.agent,
                    printers: normalizedPrinters,
                    statistics: response.statistics || {},
                    systemInfo: response.system || {},
                    isLoading: false
                })

                console.log('✅ Printers setelah normalisasi:', normalizedPrinters)
            }
        } catch (error) {
            console.error('❌ loadAgentData error:', error)
            set({ error: error.message, isLoading: false })
        }
    },

    refresh: () => get().loadAgentData(),

    getStats: () => {
        const printers = get().printers
        const statistics = get().statistics
        const lowInkThreshold = 15
        const criticalThreshold = 10

        let lowInk = 0
        let criticalInk = 0

        // Hitung low ink dan critical ink dari printer
        printers.forEach(p => {
            if (p.printer_status_detail === 'no_ink') {
                criticalInk++
            } else if (p.printer_status_detail === 'low_ink') {
                lowInk++
            } else if (p.low_ink_colors?.length) {
                const hasZero = p.low_ink_colors.some(c => p.ink_levels?.[c] === 0)
                hasZero ? criticalInk++ : lowInk++
            } else if (p.ink_levels) {
                const levels = typeof p.ink_levels === 'string' ? JSON.parse(p.ink_levels) : p.ink_levels
                Object.values(levels).forEach(lvl => {
                    const num = parseInt(lvl) || 0
                    if (num === 0) criticalInk++
                    else if (num <= criticalThreshold) criticalInk++
                    else if (num <= lowInkThreshold) lowInk++
                })
            }
        })

        // 🔥 Gunakan statistics.totalPagesToday untuk pagesToday
        const pagesToday = statistics.totalPagesToday || 0

        return {
            total: printers.length,
            online: printers.filter(p => p.status === 'READY' || p.status === 'ONLINE').length,
            offline: printers.filter(p => p.status === 'OFFLINE' || p.status === 'DISCONNECTED').length,
            lowInk,
            criticalInk,
            pagesToday
        }
    },

    getPrinterByName: (name) => get().printers.find(p => p.name === name || p.display_name === name),

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

    reset: () => set({
        agent: null,
        printers: [],
        statistics: {},
        systemInfo: {},
        error: null,
        isLoading: false
    })
}))
import { create } from 'zustand'
import { api } from '../services/api'
import { useAuthStore } from './auth.store'

export const useReportStore = create((set, get) => ({
  reports: [],
  summary: {
    totalPages: 0,
    averagePages: 0,
    daysWithData: 0,
    maxPages: 0,
    minPages: 0
  },
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 30
  },
  isLoading: false,
  error: null,
  filters: {
    startDate: null,
    endDate: null
  },

  fetchReports: async (options = {}) => {
    const { agentId } = useAuthStore.getState()
    if (!agentId) return

    const { page = 1, limit = 30, startDate, endDate } = options

    set({ 
      isLoading: true, 
      error: null,
      filters: { startDate, endDate }
    })

    try {
      const response = await api.getAgentDailyReports(agentId, {
        page, limit, startDate, endDate
      })

      set({
        reports: response.reports || [],
        summary: get().calculateSummary(response.reports || []),
        pagination: {
          page: response.page || page,
          totalPages: response.totalPages || 1,
          total: response.total || response.reports?.length || 0,
          limit
        },
        isLoading: false
      })

      return response
    } catch (error) {
      set({ error: error.message, isLoading: false, reports: [] })
      throw error
    }
  },

  calculateSummary: (reports) => {
    if (!reports.length) {
      return { totalPages: 0, averagePages: 0, daysWithData: 0, maxPages: 0, minPages: 0 }
    }

    const totalPages = reports.reduce((sum, r) => sum + (r.total_pages || 0), 0)
    const pages = reports.map(r => r.total_pages || 0)

    return {
      totalPages,
      averagePages: Math.round(totalPages / reports.length),
      daysWithData: reports.length,
      maxPages: Math.max(...pages),
      minPages: Math.min(...pages)
    }
  },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  goToPage: (page) => {
    const { totalPages } = get().pagination
    if (page >= 1 && page <= totalPages) {
      set(state => ({ pagination: { ...state.pagination, page } }))
    }
  },

  getChartData: () => {
    return get().reports.map(report => ({
      date: new Date(report.report_date).toLocaleDateString(),
      pages: report.total_pages,
      printers: report.printer_count
    })).reverse()
  },

  reset: () => {
    set({
      reports: [],
      summary: { totalPages: 0, averagePages: 0, daysWithData: 0, maxPages: 0, minPages: 0 },
      pagination: { page: 1, totalPages: 1, total: 0, limit: 30 },
      isLoading: false,
      error: null,
      filters: { startDate: null, endDate: null }
    })
  }
}))
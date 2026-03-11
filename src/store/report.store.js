import { create } from "zustand";
import { api } from "../services/api";

export const useReportStore = create((set, get) => ({
    //  State 
    reports: [],
    dailyReport: null,
    monthlyReport: null,

    summary: {
        totalPages: 0,
        averagePages: 0,
        maxPages: 0,
        minPages: 0,
        daysWithData: 0,
    },

    pagination: { page: 1, limit: 10, totalPages: 1, total: 0 },
    isLoading: false,
    error: null,

    fetchReports: async (params = {}) => {
        try {
            set({ isLoading: true, error: null });

            const agentId = localStorage.getItem("agent_id");
            const days = parseInt(params.limit) || 7;

            // Buat array tanggal N hari ke belakang
            const dates = Array.from({ length: days }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (days - 1 - i));
                return d.toISOString().split("T")[0];
            });

            // Fetch semua hari paralel
            const responses = await Promise.allSettled(
                dates.map((date) =>
                    api.getDailyReport({ date, agentId: agentId || undefined })
                )
            );

            const normalizedReports = responses.map((res, i) => {
                const date = dates[i];
                if (res.status === "rejected" || !res.value?.success) {
                    return { id: date, report_date: date, total_pages: 0, printer_count: 0, bw_pages: 0, color_pages: 0 };
                }
                const r = res.value;
                const totalPages = parseInt(r.totalPages) || 0;
                const printerCount = r.printerCount || (r.byPrinter?.length ?? 0);

                const bwPages = r.byPrinter?.reduce((sum, p) => sum + (parseInt(p.bw_pages) || 0), 0) ?? 0;
                const colorPages = r.byPrinter?.reduce((sum, p) => sum + (parseInt(p.color_pages) || 0), 0) ?? 0;

                return {
                    id: date,
                    report_date: date,
                    total_pages: totalPages,
                    printer_count: printerCount,
                    bw_pages: bwPages,
                    color_pages: colorPages,
                };
            });

            const pagesValues = normalizedReports.map((r) => r.total_pages);
            const totalPages = pagesValues.reduce((a, b) => a + b, 0);
            const daysWithData = normalizedReports.filter((r) => r.total_pages > 0).length;

            set({
                reports: normalizedReports,
                summary: {
                    totalPages,
                    averagePages: daysWithData ? Math.round(totalPages / daysWithData) : 0,
                    maxPages: Math.max(...pagesValues, 0),
                    minPages: daysWithData ? Math.min(...pagesValues.filter((v) => v > 0)) : 0,
                    daysWithData,
                },
                isLoading: false,
            });

            return normalizedReports;
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // ── Fetch single day detail ────────────────────────────────────────────────
    fetchDailyDetail: async (date) => {
        try {
            set({ isLoading: true, error: null });
            const agentId = localStorage.getItem("agent_id");
            const response = await api.getDailyReport({
                date,
                agentId: agentId || undefined,
            });
            set({ dailyReport: response, isLoading: false });
            return response;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // ── Fetch monthly ──────────────────────────────────────────────────────────
    fetchMonthlyReport: async (year, month) => {
        try {
            set({ isLoading: true, error: null });
            const agentId = localStorage.getItem("agent_id");
            const response = await api.getMonthlyReport(year, month, {
                agentId: agentId || undefined,
            });
            set({ monthlyReport: response, isLoading: false });
            return response;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // ── Chart helpers ──────────────────────────────────────────────────────────
    getChartData: () => {
        return get().reports.map((r) => ({
            date: new Date(r.report_date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
            }),
            pages: r.total_pages,
        }));
    },

    getMonthlyChartData: () => {
        const report = get().monthlyReport;
        if (!report?.dailyBreakdown) return [];
        return report.dailyBreakdown.map((d) => ({
            date: new Date(d.print_date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
            }),
            pages: parseInt(d.total_pages) || 0,
            printers: d.active_printers || 0,
        }));
    },

    // ── Pagination ─────────────────────────────────────────────────────────────
    goToPage: (page) =>
        set((state) => ({ pagination: { ...state.pagination, page } })),

    // ── Reset ──────────────────────────────────────────────────────────────────
    reset: () =>
        set({
            reports: [],
            dailyReport: null,
            monthlyReport: null,
            summary: { totalPages: 0, averagePages: 0, maxPages: 0, minPages: 0, daysWithData: 0 },
            pagination: { page: 1, limit: 10, totalPages: 1, total: 0 },
            isLoading: false,
            error: null,
        }),
}));
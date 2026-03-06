import { create } from "zustand";
import { api } from "../services/api";

export const useReportStore = create((set, get) => ({
    reports: [],
    dailyReport: null,
    summary: { totalPages: 0, averagePages: 0, maxPages: 0, minPages: 0, daysWithData: 0 },
    pagination: { page: 1, limit: 10, totalPages: 1, total: 0 },
    isLoading: false,
    error: null,

    fetchReports: async (params = {}) => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.getDailyReport(params);
            console.log('📊 RAW daily report response:', response);

            // Ekstrak array reports dari response.byPrinter (struktur backend)
            let reportsData = [];
            if (response.byPrinter && Array.isArray(response.byPrinter)) {
                reportsData = response.byPrinter;
            } else if (response.printers && Array.isArray(response.printers)) {
                reportsData = response.printers;
            } else if (response.reports && Array.isArray(response.reports)) {
                reportsData = response.reports;
            }

            // Normalisasi setiap report
            const normalizedReports = reportsData.map((r, index) => ({
                id: r.id || `${response.date}-${r.name || r.printer_name || index}`,
                report_date: response.date,
                total_pages: parseInt(r.pages) || 0,   // pastikan angka
                printer_count: 1,
                bw_pages: r.bw_pages || 0,
                color_pages: r.color_pages || 0,
                printer_name: r.name || r.printer_name,
            }));

            // Hitung totalPages dari response (bisa string, konversi ke number)
            const totalPages = parseInt(response.totalPages) || 0;
            const pagesValues = normalizedReports.map(r => r.total_pages);

            set({
                reports: normalizedReports,
                dailyReport: response,
                summary: {
                    totalPages,
                    averagePages: normalizedReports.length ? Math.round(totalPages / normalizedReports.length) : 0,
                    maxPages: Math.max(...pagesValues, 0),
                    minPages: Math.min(...pagesValues, Infinity) || 0,
                    daysWithData: normalizedReports.length
                },
                isLoading: false
            });

            console.log('✅ Reports setelah normalisasi:', normalizedReports);
            return response;
        } catch (error) {
            console.error("Failed to fetch daily report:", error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    getChartData: () => {
        const reports = get().reports;
        // Jika reports hanya berisi satu hari, chartData hanya satu titik.
        // Untuk chart 7 hari, kita perlu mengambil data dari 7 hari berbeda.
        // Tapi karena fetchReports hanya mengambil satu hari, kita perlu mengubah endpoint
        // untuk mengambil beberapa hari. Sementara, kita bisa menggunakan data dari summary.
        // Alternatif: gunakan data dari response yang mungkin sudah menyediakan daily breakdown.
        // Di sini kita asumsikan reports adalah array per hari (jika ada).
        return reports.map(r => ({
            date: new Date(r.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            pages: r.total_pages || 0
        }));
    },

    goToPage: (page) => set(state => ({ pagination: { ...state.pagination, page } })),
    reset: () => set({ reports: [], dailyReport: null, summary: {}, pagination: { page: 1, limit: 10, totalPages: 1, total: 0 }, isLoading: false, error: null })
}));
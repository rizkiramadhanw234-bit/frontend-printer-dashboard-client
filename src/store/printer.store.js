import { create } from "zustand";
import { api } from "../services/api";
import { useAppStore } from "./app.store"; 

export const usePrinterStore = create((set, get) => ({
    // ========== STATE ==========
    allPrinters: [],
    agentPrinters: {},
    selectedPrinter: null,

    printerLifetimeReports: {},

    isLoading: false,
    error: null,

    // ========== ALL PRINTERS ==========

    fetchAllPrinters: async () => {
        try {
            set({ isLoading: true, error: null });

            const response = await api.getAllPrinters(); // ← GET /api/printers

            set({
                allPrinters: response.printers || [],
                isLoading: false
            });

            console.log(`✅ Loaded ${response.printers?.length || 0} printers from all agents`);
            return response;

        } catch (error) {
            console.error("Failed to fetch all printers:", error);
            set({
                error: error.message,
                isLoading: false,
                allPrinters: []
            });
            throw error;
        }
    },

    // ========== AGENT PRINTERS (PAKAI API KEY) ==========

    fetchAgentPrinters: async (agentId) => {
        try {
            set({ isLoading: true, error: null });

            // 🔥 Ambil API key dari app store
            const appState = useAppStore.getState();
            let apiKey = appState.agentsWithKeys?.[agentId];

            // Kalau belum ada, ambil dulu dari API
            if (!apiKey) {
                console.log(`🔑 Fetching API key for agent ${agentId}...`);
                const keyRes = await api.getAgentApiKey(agentId);
                apiKey = keyRes.apiKey;

                // Simpan di store
                useAppStore.setState(state => ({
                    agentsWithKeys: {
                        ...(state.agentsWithKeys || {}),
                        [agentId]: apiKey
                    }
                }));
            }

            // Panggil printer dengan API key
            const response = await api.getAgentPrinters(agentId, apiKey);

            set(state => ({
                agentPrinters: {
                    ...state.agentPrinters,
                    [agentId]: response.printers || []
                },
                isLoading: false
            }));

            console.log(`✅ Loaded ${response.printers?.length || 0} printers for agent ${agentId}`);
            return response;

        } catch (error) {
            console.error(`Failed to fetch printers for agent ${agentId}:`, error);
            set({
                error: error.message,
                isLoading: false
            });
            throw error;
        }
    },

    // ========== SINGLE PRINTER (PAKAI API KEY) ==========

    fetchAgentPrinter: async (agentId, printerName) => {
        try {
            set({ isLoading: true, error: null });

            // 🔥 Ambil API key
            const appState = useAppStore.getState();
            let apiKey = appState.agentsWithKeys?.[agentId];

            if (!apiKey) {
                const keyRes = await api.getAgentApiKey(agentId);
                apiKey = keyRes.apiKey;

                useAppStore.setState(state => ({
                    agentsWithKeys: {
                        ...(state.agentsWithKeys || {}),
                        [agentId]: apiKey
                    }
                }));
            }

            const response = await api.getAgentPrinter(agentId, printerName, apiKey);

            set({
                selectedPrinter: response.printer,
                isLoading: false
            });

            console.log(`✅ Loaded printer ${printerName} from agent ${agentId}`);
            return response;

        } catch (error) {
            console.error(`Failed to fetch printer ${printerName}:`, error);
            set({
                error: error.message,
                isLoading: false,
                selectedPrinter: null
            });
            throw error;
        }
    },

    // ========== PRINTER LIFETIME REPORT ==========

    fetchPrinterLifetimeReport: async (printerName) => {
        try {
            set({ isLoading: true, error: null });

            const response = await api.getPrinterLifetimeReport(printerName);

            set(state => ({
                printerLifetimeReports: {
                    ...state.printerLifetimeReports,
                    [printerName]: response
                },
                isLoading: false
            }));

            console.log(`✅ Loaded lifetime report for ${printerName}`);
            return response;

        } catch (error) {
            console.error(`Failed to fetch lifetime report for ${printerName}:`, error);
            set({
                error: error.message,
                isLoading: false
            });
            throw error;
        }
    },

    // ========== PRINTER CONTROL (PAKAI API KEY) ==========

    pausePrinter: async (agentId, printerName) => {
        try {
            const appState = useAppStore.getState();
            const apiKey = appState.agentsWithKeys?.[agentId];

            if (!apiKey) throw new Error('API key not found');

            const response = await api.pausePrinter(agentId, printerName, apiKey);

            // Refresh printer data after pause
            await get().fetchAgentPrinter(agentId, printerName);

            console.log(`✅ Paused printer ${printerName}`);
            return response;

        } catch (error) {
            console.error(`Failed to pause printer ${printerName}:`, error);
            throw error;
        }
    },

    resumePrinter: async (agentId, printerName) => {
        try {
            const appState = useAppStore.getState();
            const apiKey = appState.agentsWithKeys?.[agentId];

            if (!apiKey) throw new Error('API key not found');

            const response = await api.resumePrinter(agentId, printerName, apiKey);

            // Refresh printer data after resume
            await get().fetchAgentPrinter(agentId, printerName);

            console.log(`✅ Resumed printer ${printerName}`);
            return response;

        } catch (error) {
            console.error(`Failed to resume printer ${printerName}:`, error);
            throw error;
        }
    },

    // ========== GETTERS ==========

    getPrintersWithLowInk: () => {
        return get().allPrinters.filter(p => {
            // 🔥 PAKAI snake_case!
            if (p.low_ink_colors && p.low_ink_colors.length > 0) return true;

            if (!p.ink_levels) return false;

            const levels = typeof p.ink_levels === 'string'
                ? JSON.parse(p.ink_levels)
                : p.ink_levels;

            return Object.values(levels).some(level => {
                const lvl = parseInt(level);
                return lvl > 0 && lvl <= 20;
            });
        });
    },

    getPrintersWithCriticalInk: () => {
        return get().allPrinters.filter(p => {
            // 🔥 PAKAI snake_case!
            if (p.printer_status_detail === 'no_ink') return true;

            if (!p.ink_levels) return false;

            const levels = typeof p.ink_levels === 'string'
                ? JSON.parse(p.ink_levels)
                : p.ink_levels;

            return Object.values(levels).some(level => {
                const lvl = parseInt(level);
                return lvl > 0 && lvl <= 10;
            });
        });
    },

    // ========== STATISTICS ==========
    getAllPrintersStatistics: () => {
        const printers = get().allPrinters;

        const total = printers.length;
        const online = printers.filter(p =>
            p.status === "READY" || p.status === "ONLINE" || p.status === "PRINTING"
        ).length;

        const offline = printers.filter(p =>
            p.status === "OFFLINE" || p.status === "DISCONNECTED"
        ).length;

        const error = printers.filter(p =>
            p.status === "OTHER" || p.status === "ERROR" || p.printer_status_detail === 'error_other'
        ).length;

        const printing = printers.filter(p =>
            p.status === "PRINTING" || p.printer_status_detail === 'printing'
        ).length;

        // 🔥 HITUNG LOW INK - PAKAI snake_case!
        const lowInk = printers.filter(p => {
            if (p.printer_status_detail === 'low_ink') return true;
            if (p.low_ink_colors && p.low_ink_colors.length > 0) {
                // Parse ink_levels dulu
                const inkLevels = typeof p.ink_levels === 'string'
                    ? JSON.parse(p.ink_levels)
                    : p.ink_levels || {};
                const hasZero = p.low_ink_colors.some(color => inkLevels[color] === 0);
                if (!hasZero) return true;
            }
            return false;
        }).length;

        // 🔥 HITUNG CRITICAL INK - PAKAI snake_case!
        const criticalInk = printers.filter(p => {
            if (p.printer_status_detail === 'no_ink') return true;

            const inkLevels = typeof p.ink_levels === 'string'
                ? JSON.parse(p.ink_levels)
                : p.ink_levels || {};

            if (Object.values(inkLevels).some(v => v === 0)) return true;

            if (p.low_ink_colors && p.low_ink_colors.length > 0) {
                const hasZero = p.low_ink_colors.some(color => inkLevels[color] === 0);
                if (hasZero) return true;
            }

            return false;
        }).length;

        // Detail status counts
        const paperJam = printers.filter(p => p.printerStatusDetail === 'paper_jam').length;
        const outOfPaper = printers.filter(p => p.printerStatusDetail === 'out_of_paper').length;
        const doorOpen = printers.filter(p => p.printerStatusDetail === 'door_open').length;

        // Group by vendor
        const byVendor = printers.reduce((acc, p) => {
            const vendor = p.vendor || "Unknown";
            acc[vendor] = (acc[vendor] || 0) + 1;
            return acc;
        }, {});

        // Total pages today
        const totalPagesToday = printers.reduce((sum, p) =>
            sum + (p.pages_today || 0), 0
        );

        // Color/BW breakdown
        const colorPagesToday = printers.reduce((sum, p) =>
            sum + (p.color_pages_today || 0), 0
        );

        const bwPagesToday = printers.reduce((sum, p) =>
            sum + (p.bw_pages_today || 0), 0
        );

        return {
            total,
            online,
            offline,
            error,
            printing,
            paperJam,
            outOfPaper,
            doorOpen,
            byVendor,
            totalPagesToday,
            colorPagesToday,
            bwPagesToday,
            lowInk,
            criticalInk
        };
    },

    // ========== UTILS ==========

    refresh: async () => {
        await get().fetchAllPrinters();

        // Refresh juga agent printers untuk agent yang sedang dipilih
        const { selectedAgentId } = useAppStore.getState();
        if (selectedAgentId) {
            await get().fetchAgentPrinters(selectedAgentId);
        }
    },

    reset: () => {
        set({
            allPrinters: [],
            agentPrinters: {},
            selectedPrinter: null,
            printerLifetimeReports: {},
            isLoading: false,
            error: null
        });
    }
}));
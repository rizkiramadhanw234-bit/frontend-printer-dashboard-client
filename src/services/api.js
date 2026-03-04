const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:15000'

const getAgentToken = () => {
    return localStorage.getItem('agent_token')
}

const getAgentId = () => {
    return localStorage.getItem('agent_id')
}

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`
    const token = getAgentToken()
    const agentId = getAgentId()

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    try {
        const res = await fetch(url, { headers, ...options })

        if (!res.ok) {
            if (res.status === 401) {
                localStorage.removeItem('agent_token')
                localStorage.removeItem('agent_id')
                window.location.href = '/login'
                throw new Error('Session expired')
            }

            const error = await res.text()
            throw new Error(error || `API Error ${res.status}`)
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error('API Error:', error)
        throw error
    }
}

export const api = {
    // ========== AUTH ==========
    login: (agentId, apiKey) =>
        fetchAPI('/api/agents/agent-login', {
            method: 'POST',
            body: JSON.stringify({
                agent_id: agentId, 
                api_key: apiKey
            })
        }),

    // ========== AGENT ==========
    getAgent: (agentId) =>
        fetchAPI(`/api/agents/${agentId}`),

    // ========== PRINTERS ==========
    getAllPrinters: () =>
        fetchAPI('/api/printers'),

    pausePrinter: (agentId, printerName) =>
        fetchAPI(`/api/agents/${agentId}/printer/pause`, {
            method: 'POST',
            body: JSON.stringify({ printerName })
        }),

    resumePrinter: (agentId, printerName) =>
        fetchAPI(`/api/agents/${agentId}/printer/resume`, {
            method: 'POST',
            body: JSON.stringify({ printerName })
        }),

    // ========== REPORTS ==========
    getAgentDailyReports: (agentId, params = {}) => {
        const queryString = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 30,
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate })
        }).toString()

        return fetchAPI(`/api/agents/${agentId}/daily-reports${queryString ? `?${queryString}` : ''}`)
    }
}
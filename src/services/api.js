const API_URL = import.meta.env.VITE_API_URL || 'https://api.mpsnewton.com'

const getAgentToken = () => localStorage.getItem('agent_token')
const getAgentId = () => localStorage.getItem('agent_id')

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`
    const token = getAgentToken()

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
    }

    if (token) headers['Authorization'] = `Bearer ${token}`

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
        return await res.json()
    } catch (error) {
        console.error('API Error:', error)
        throw error
    }
}

export const api = {
    // AUTH
    login: (agentId, apiKey) =>
        fetchAPI('/api/agents/agent-login', {
            method: 'POST',
            body: JSON.stringify({ agent_id: agentId, api_key: apiKey })
        }),

    // AGENT
    getAgent: (agentId) => fetchAPI(`/api/agents/${agentId}`),

    // PRINTERS (pake API key)
    getAgentPrinters: (agentId, apiKey) => {
        const url = `${API_URL}/api/agents/${agentId}/printers`
        return fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        }).then(res => res.ok ? res.json() : Promise.reject(res))
    },

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

    // REPORTS
    getDailyReport: (params = {}) => {
        const query = new URLSearchParams()
        if (params.date) query.append('date', params.date)
        if (params.agentId) query.append('agentId', params.agentId)
        if (params.page) query.append('page', params.page)
        if (params.limit) query.append('limit', params.limit)
        if (params.startDate) query.append('startDate', params.startDate)
        if (params.endDate) query.append('endDate', params.endDate)

        return fetchAPI(`/api/reports/daily${query.toString() ? `?${query}` : ''}`)
    },
}
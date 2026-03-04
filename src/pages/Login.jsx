import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
    const navigate = useNavigate()
    const { login, isLoading, error } = useAuth()
    const [agentId, setAgentId] = useState('')
    const [token, setToken] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        const result = await login(agentId, token)
        if (result.success) {
            navigate('/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                            <Activity size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
                        MPS Newton <br />Client Dashboard
                    </h2>
                    <p className="text-center text-slate-500 text-sm mb-8">
                        Login dengan Agent ID dan Token dari agent.exe
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Agent ID
                            </label>
                            <input
                                type="text"
                                value={agentId}
                                onChange={(e) => setAgentId(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                placeholder="Masukkan Agent ID"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Token
                            </label>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                placeholder="Masukkan Token"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Loading...' : 'Login'}
                        </button>
                    </form>

                    <p className="text-xs text-center text-slate-400 mt-8">
                        Dapatkan Agent ID dan Token dari aplikasi agent.exe
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
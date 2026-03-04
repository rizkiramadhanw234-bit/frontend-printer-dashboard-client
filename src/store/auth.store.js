import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      agent: null,
      token: null,
      agentId: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (agentId, apiKey) => {  
        set({ isLoading: true, error: null })

        try {
          const response = await api.login(agentId, apiKey)

          if (response.success) {
            localStorage.setItem('agent_token', response.token)
            localStorage.setItem('agent_id', agentId)

            set({
              agent: response.agent,
              token: response.token,  
              agentId,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })

            return { success: true }
          } else {
            throw new Error(response.message || 'Login failed')
          }
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false
          })
          return { success: false, error: error.message }
        }
      },

      logout: () => {
        localStorage.removeItem('agent_token')
        localStorage.removeItem('agent_id')
        set({
          agent: null,
          token: null,
          agentId: null,
          isAuthenticated: false,
          error: null
        })
      },

      checkAuth: async () => {
        const token = localStorage.getItem('agent_token')
        const agentId = localStorage.getItem('agent_id')

        if (!token || !agentId) {
          set({ isAuthenticated: false })
          return false
        }

        try {
          const response = await api.getAgent(agentId)
          
          if (response.success) {
            set({
              agent: response.agent,
              token,
              agentId,
              isAuthenticated: true
            })
            return true
          }
          return false
        } catch (error) {
          localStorage.removeItem('agent_token')
          localStorage.removeItem('agent_id')
          set({ isAuthenticated: false })
          return false
        }
      }
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        agent: state.agent,
        token: state.token,
        agentId: state.agentId,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
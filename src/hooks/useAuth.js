import { useAuthStore } from '../store/auth.store'

export const useAuth = () => {
  const { 
    agent, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    logout, 
    checkAuth 
  } = useAuthStore()

  return {
    agent,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth
  }
}
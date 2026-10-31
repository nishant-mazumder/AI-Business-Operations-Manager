import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'

export interface AuthUser {
  id: number
  email: string
  username: string
  full_name: string
  phone?: string
  role: string
  avatar_initials: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    full_name: string
    password: string
    password_confirm: string
    role?: string
    phone?: string
  }) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cached = localStorage.getItem('nexusops_user')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        return null
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('nexusops_access_token')
      if (token) {
        try {
          const profile = await api.get<AuthUser>('/auth/profile/')
          setUser(profile)
          localStorage.setItem('nexusops_user', JSON.stringify(profile))
        } catch {
          // Token invalid or network down, clear stale local session
          api.clearTokens()
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    initAuth()

    const handleExpired = () => {
      setUser(null)
    }
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login/', { email, password })
    if (res.tokens) {
      api.setTokens(res.tokens.access, res.tokens.refresh)
      setUser(res.user)
      localStorage.setItem('nexusops_user', JSON.stringify(res.user))
    }
  }

  const register = async (data: {
    email: string
    full_name: string
    password: string
    password_confirm: string
    role?: string
    phone?: string
  }) => {
    const res = await api.post('/auth/register/', data)
    if (res.tokens) {
      api.setTokens(res.tokens.access, res.tokens.refresh)
      setUser(res.user)
      localStorage.setItem('nexusops_user', JSON.stringify(res.user))
    }
  }

  const logout = async () => {
    const refresh = localStorage.getItem('nexusops_refresh_token')
    if (refresh) {
      try {
        await api.post('/auth/logout/', { refresh })
      } catch {
        // Logout gracefully even if network fails
      }
    }
    api.clearTokens()
    setUser(null)
  }

  const refreshProfile = async () => {
    try {
      const profile = await api.get<AuthUser>('/auth/profile/')
      setUser(profile)
      localStorage.setItem('nexusops_user', JSON.stringify(profile))
    } catch {
      // Ignore
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

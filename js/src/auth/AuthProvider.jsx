import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  login as loginRequest,
  logout as logoutRequest,
  me as meRequest,
  register as registerRequest,
  resendVerificationEmail as resendVerificationEmailRequest,
} from '../api/auth'
import { setUnauthorizedHandler } from '../api/http'
import { AuthContext } from './AuthContext'

const meQueryOptions = {
  queryKey: ['me'],
  queryFn: async () => {
    const response = await meRequest()

    return response.user
  },
  retry: false,
  refetchOnWindowFocus: false,
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const meQuery = useQuery(meQueryOptions)

  const user = meQuery.data ?? null

  const refreshMe = useCallback(async () => {
    try {
      return await queryClient.fetchQuery(meQueryOptions)
    } catch {
      queryClient.setQueryData(['me'], null)

      return null
    }
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(['me'], null)
      navigate('/login', { replace: true })
    })

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [navigate, queryClient])

  const login = useCallback(
    async (payload) => {
      await loginRequest(payload)
      await refreshMe()
      toast.success('Вы успешно вошли в систему')
      navigate('/app', { replace: true })
    },
    [navigate, refreshMe],
  )

  const register = useCallback(
    async (payload) => {
      const response = await registerRequest(payload)

      await refreshMe()
      toast.success('Аккаунт создан')
      navigate('/app', { replace: true })

      return response
    },
    [navigate, refreshMe],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      queryClient.setQueryData(['me'], null)
      toast.success('Вы вышли из аккаунта')
      navigate('/login', { replace: true })
    }
  }, [navigate, queryClient])

  const resendVerificationEmail = useCallback(async () => {
    await resendVerificationEmailRequest()
    toast.success('Письмо отправлено повторно')
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading: meQuery.isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshMe,
      resendVerificationEmail,
    }),
    [
      user,
      meQuery.isLoading,
      login,
      register,
      logout,
      refreshMe,
      resendVerificationEmail,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

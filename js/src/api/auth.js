import http, { backendUrl } from './http'

export async function getCsrfCookie() {
  await http.get('/sanctum/csrf-cookie', { skipAuthRedirect: true })
}

export async function register(payload) {
  await getCsrfCookie()

  const { data } = await http.post('/api/v1/auth/register', payload, {
    skipAuthRedirect: true,
  })

  return data
}

export async function login(payload) {
  await getCsrfCookie()

  const { data } = await http.post('/api/v1/auth/login', payload, {
    skipAuthRedirect: true,
  })

  return data
}

export async function logout() {
  await getCsrfCookie()

  const { data } = await http.post(
    '/api/v1/auth/logout',
    {},
    {
      skipAuthRedirect: true,
    },
  )

  return data
}

export async function me() {
  const { data } = await http.get('/api/v1/auth/me', {
    skipAuthRedirect: true,
  })

  return data
}

export async function resendVerificationEmail() {
  await getCsrfCookie()

  const { data } = await http.post(
    '/api/v1/auth/email/verification-notification',
    {},
    {
      skipAuthRedirect: true,
    },
  )

  return data
}

export async function forgotPassword(payload) {
  await getCsrfCookie()

  const { data } = await http.post('/api/v1/auth/forgot-password', payload, {
    skipAuthRedirect: true,
  })

  return data
}

export async function resetPassword(payload) {
  await getCsrfCookie()

  const { data } = await http.post('/api/v1/auth/reset-password', payload, {
    skipAuthRedirect: true,
  })

  return data
}

export function getGoogleLoginUrl() {
  return `${backendUrl}/api/v1/auth/google/redirect`
}

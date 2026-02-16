import axios from 'axios'

const defaultBackendUrl =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:18080`
    : 'http://127.0.0.1:18080'

export const backendUrl = import.meta.env.VITE_BACKEND_URL ?? defaultBackendUrl

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

const http = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      !error?.config?.skipAuthRedirect &&
      typeof unauthorizedHandler === 'function'
    ) {
      unauthorizedHandler()
    }

    return Promise.reject(error)
  },
)

export default http

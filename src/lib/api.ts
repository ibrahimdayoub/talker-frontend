import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(
  config => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access-token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/refresh')) {
        handleGlobalLogout()
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        const rt = localStorage.getItem('refresh-token')

        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${rt}` },
            withCredentials: true
          }
        )

        localStorage.setItem('access-token', data.accessToken)
        localStorage.setItem('refresh-token', data.refreshToken)

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        handleGlobalLogout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

function handleGlobalLogout () {
  useAuthStore.getState().logout()
  if (typeof window !== 'undefined') {
    window.location.href = '/signin'
  }
}

export default api

import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// 1. Request Interceptor: إضافة Access Token لكل طلب
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

// 2. Response Interceptor: التعامل مع انتهاء الصلاحية (401)
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // التحقق من حالة 401 والتأكد أننا لم نحاول التجديد مسبقاً لهذا الطلب
    if (error.response?.status === 401 && !originalRequest._retry) {
      // إذا فشل طلب الـ refresh نفسه، سجل خروج فوراً
      if (originalRequest.url.includes('/auth/refresh')) {
        handleGlobalLogout()
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        const rt = localStorage.getItem('refresh-token')

        // طلب التجديد باستخدام الـ Refresh Token في الهيدر
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${rt}` },
            withCredentials: true
          }
        )

        // تخزين التوكنات الجديدة (Rotation)
        localStorage.setItem('access-token', data.accessToken)
        localStorage.setItem('refresh-token', data.refreshToken)

        // تحديث الهيدر وإعادة تنفيذ الطلب الأصلي
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        // في حال فشل التجديد (مثلاً RT منتهي)، طرد المستخدم
        handleGlobalLogout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

/**
 * دالة مركزية لتنظيف حالة المستخدم والتوجيه لصفحة تسجيل الدخول
 */
function handleGlobalLogout () {
  useAuthStore.getState().logout()
  if (typeof window !== 'undefined') {
    // نستخدم window.location لضمان مسح كافة حالات الكاش في المتصفح
    window.location.href = '/signin'
  }
}

export default api

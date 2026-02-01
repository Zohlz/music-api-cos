import type { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { message } from 'ant-design-vue'
import type { ApiResponse } from '../../types'

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API ?? '/api',
  timeout: 60000,
})

const requestHandler = async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
  // 从localStorage获取token并添加到请求头
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

const responseHandler = (response: AxiosResponse): AxiosResponse => {
  return response
}

const errorHandler = (error: AxiosError): Promise<any> => {
  if (error.response) {
    const { status, data } = error.response as AxiosResponse<ApiResponse>
    const msg = data?.msg || '请求失败'
    
    if (status === 401) {
      message.error('未授权，请重新登录')
      // 清除token并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
    } else if (status === 403) {
      message.error('没有权限访问')
    } else if (status === 404) {
      message.error('请求的资源不存在')
    } else if (status === 500) {
      message.error('服务器内部错误')
    } else {
      message.error(msg)
    }
  } else if (error.message.includes('timeout')) {
    message.error('请求超时，请稍后重试')
  } else {
    message.error('网络错误，请检查网络连接')
  }
  
  return Promise.reject(error)
}

instance.interceptors.request.use(requestHandler)
instance.interceptors.response.use(responseHandler, errorHandler)

export default instance

export const useGet = <R = any, T = any>(
  url: string,
  params?: T,
  config?: AxiosRequestConfig
): Promise<ApiResponse<R>> => {
  return instance.request({
    url,
    params,
    method: 'GET',
    ...config,
  }).then(res => res.data)
}

export const usePost = <R = any, T = any>(
  url: string,
  data?: T,
  config?: AxiosRequestConfig
): Promise<ApiResponse<R>> => {
  return instance.request({
    url,
    data,
    method: 'POST',
    ...config,
  }).then(res => res.data)
}

export const usePut = <R = any, T = any>(
  url: string,
  data?: T,
  config?: AxiosRequestConfig
): Promise<ApiResponse<R>> => {
  return instance.request({
    url,
    data,
    method: 'PUT',
    ...config,
  }).then(res => res.data)
}

export const useDelete = <R = any, T = any>(
  url: string,
  data?: T,
  config?: AxiosRequestConfig
): Promise<ApiResponse<R>> => {
  return instance.request({
    url,
    data,
    method: 'DELETE',
    ...config,
  }).then(res => res.data)
}

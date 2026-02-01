import { useGet, usePost } from '~/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: {
    userId: number
    username: string
    nickname: string
    email: string
    avatar: string
  }
}

export interface UserInfo {
  userId: number
  username: string
  nickname: string
  email: string
  avatar: string
  lastLoginTime: string
  lastLoginIp: string
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

/**
 * 用户登录
 */
export function login(data: LoginParams) {
  return usePost<LoginResult>('/auth/login', data)
}

/**
 * 用户登出
 */
export function logout() {
  return usePost('/auth/logout')
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return useGet<UserInfo>('/auth/info')
}

/**
 * 修改密码
 */
export function changePassword(data: ChangePasswordParams) {
  return usePost('/auth/change-password', data)
}

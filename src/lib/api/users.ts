import { request } from '@/lib/api'
import type { RoleVO } from './roles'
import { buildQuery, type PageQuery, type PageResult } from './types'

/** Mirrors backend UserVO (never carries password / passwordHash). */
export interface UserVO {
  id: number
  username: string
  nickname: string
  gender?: string
  status: number
  builtIn?: boolean
  roles: RoleVO[]
}

export interface UserPayload {
  username: string
  nickname: string
  gender?: string
  password?: string
  status?: number
}

export interface UserQuery extends PageQuery {
  username?: string
  status?: number
}

export function listUsers(query: UserQuery): Promise<PageResult<UserVO>> {
  return request<PageResult<UserVO>>(`/api/users${buildQuery({ ...query })}`)
}

export function createUser(payload: UserPayload): Promise<UserVO> {
  return request<UserVO>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUser(id: number, payload: UserPayload): Promise<UserVO> {
  return request<UserVO>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteUser(id: number): Promise<void> {
  return request<void>(`/api/users/${id}`, { method: 'DELETE' })
}

export function updateUserStatus(id: number, status: number): Promise<UserVO> {
  return request<UserVO>(`/api/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export function resetUserPassword(id: number, password: string): Promise<void> {
  return request<void>(`/api/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  })
}

export function fetchUserRoles(id: number): Promise<RoleVO[]> {
  return request<RoleVO[]>(`/api/users/${id}/roles`)
}

/** Full replace: the backend deletes existing grants and inserts the given role ids. */
export function saveUserRoles(id: number, roleIds: number[]): Promise<UserVO> {
  return request<UserVO>(`/api/users/${id}/roles`, {
    method: 'PUT',
    body: JSON.stringify(roleIds),
  })
}

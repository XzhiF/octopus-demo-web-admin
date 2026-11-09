import { request } from '@/lib/api'
import { buildQuery, type PageQuery, type PageResult } from './types'

/** Mirrors backend RoleVO. */
export interface RoleVO {
  id: number
  name: string
  code: string
  status: number
  builtIn?: boolean
}

export interface RolePayload {
  name: string
  code: string
  status?: number
}

export interface RoleQuery extends PageQuery {
  name?: string
  status?: number
}

export function listRoles(query: RoleQuery): Promise<PageResult<RoleVO>> {
  return request<PageResult<RoleVO>>(`/api/roles${buildQuery({ ...query })}`)
}

export function createRole(payload: RolePayload): Promise<RoleVO> {
  return request<RoleVO>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRole(id: number, payload: RolePayload): Promise<RoleVO> {
  return request<RoleVO>(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteRole(id: number): Promise<void> {
  return request<void>(`/api/roles/${id}`, { method: 'DELETE' })
}

export function updateRoleStatus(id: number, status: number): Promise<RoleVO> {
  return request<RoleVO>(`/api/roles/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export function fetchRoleMenuIds(id: number): Promise<number[]> {
  return request<number[]>(`/api/roles/${id}/menus`)
}

/** Full replace: the backend deletes existing grants and inserts the given menu ids. */
export function saveRoleMenus(id: number, menuIds: number[]): Promise<RoleVO> {
  return request<RoleVO>(`/api/roles/${id}/menus`, {
    method: 'PUT',
    body: JSON.stringify(menuIds),
  })
}

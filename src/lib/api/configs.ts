import { request } from '@/lib/api'
import { buildQuery, type PageQuery, type PageResult } from './types'

/** Mirrors backend ConfigVO. Values are plain strings interpreted by consumers. */
export interface ConfigVO {
  id: number
  configKey: string
  configValue: string
  remark?: string | null
}

export interface ConfigPayload {
  configKey: string
  configValue: string
  remark?: string
}

export interface ConfigQuery extends PageQuery {
  key?: string
}

export function listConfigs(query: ConfigQuery): Promise<PageResult<ConfigVO>> {
  return request<PageResult<ConfigVO>>(`/api/configs${buildQuery({ ...query })}`)
}

export function createConfig(payload: ConfigPayload): Promise<ConfigVO> {
  return request<ConfigVO>('/api/configs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateConfig(id: number, payload: ConfigPayload): Promise<ConfigVO> {
  return request<ConfigVO>(`/api/configs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteConfig(id: number): Promise<void> {
  return request<void>(`/api/configs/${id}`, { method: 'DELETE' })
}

/** Runtime read by key; resolves to the raw string value. */
export function fetchConfigValue(key: string): Promise<string> {
  return request<string>(`/api/configs/key/${encodeURIComponent(key)}`, {
    redirectOnUnauthorized: false,
  })
}

import { request } from '@/lib/api'
import { buildQuery, type PageQuery, type PageResult } from './types'

/** Mirrors backend DictTypeVO. */
export interface DictTypeVO {
  id: number
  dictType: string
  dictName: string
  status: number
  remark?: string | null
}

/** Mirrors backend SysDictData (management payload). */
export interface DictDataVO {
  id: number
  dictType: string
  dictLabel: string
  dictValue: string
  sort: number
  status: number
}

/** Option shape returned by GET /api/dicts/data/{dictType}. */
export interface DictOptionVO {
  label: string
  value: string
}

export interface DictTypePayload {
  dictType: string
  dictName: string
  status?: number
  remark?: string | null
}

export interface DictDataPayload {
  dictType: string
  dictLabel: string
  dictValue: string
  sort?: number
  status?: number
}

export interface DictTypeQuery extends PageQuery {
  dictType?: string
  dictName?: string
}

export function listDictTypes(query: DictTypeQuery): Promise<PageResult<DictTypeVO>> {
  return request<PageResult<DictTypeVO>>(`/api/dicts/types${buildQuery({ ...query })}`)
}

export function createDictType(payload: DictTypePayload): Promise<DictTypeVO> {
  return request<DictTypeVO>('/api/dicts/types', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDictType(id: number, payload: DictTypePayload): Promise<DictTypeVO> {
  return request<DictTypeVO>(`/api/dicts/types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteDictType(id: number): Promise<void> {
  return request<void>(`/api/dicts/types/${id}`, { method: 'DELETE' })
}

export function listDictData(dictType: string): Promise<DictDataVO[]> {
  return request<DictDataVO[]>(`/api/dicts/data${buildQuery({ dictType })}`)
}

export function createDictData(payload: DictDataPayload): Promise<DictDataVO> {
  return request<DictDataVO>('/api/dicts/data', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDictData(id: number, payload: DictDataPayload): Promise<DictDataVO> {
  return request<DictDataVO>(`/api/dicts/data/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteDictData(id: number): Promise<void> {
  return request<void>(`/api/dicts/data/${id}`, { method: 'DELETE' })
}

/** Dropdown feed: enabled items only, ordered by sort. Login required. */
export function fetchDictOptions(dictType: string): Promise<DictOptionVO[]> {
  return request<DictOptionVO[]>(`/api/dicts/data/${encodeURIComponent(dictType)}`, {
    redirectOnUnauthorized: false,
  })
}

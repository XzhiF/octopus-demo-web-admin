import { request } from '@/lib/api'
import { buildQuery, type PageQuery, type PageResult } from './types'

/** Mirrors backend OperLogVO (sys_oper_log row). status: 0 = failure, 1 = success. */
export interface OperLogVO {
  id: number
  title: string
  module?: string | null
  httpMethod?: string | null
  requestUri?: string | null
  params?: string | null
  operator?: string | null
  ip?: string | null
  status: number
  errorMsg?: string | null
  durationMs?: number | null
  createdAt: string
}

export interface OperLogQuery extends PageQuery {
  operator?: string
  module?: string
  status?: number
  from?: string
  to?: string
}

export function listOperLogs(query: OperLogQuery): Promise<PageResult<OperLogVO>> {
  return request<PageResult<OperLogVO>>(`/api/logs/oper${buildQuery({ ...query })}`)
}

export function getOperLog(id: number): Promise<OperLogVO> {
  return request<OperLogVO>(`/api/logs/oper/${id}`)
}

import { request } from '@/lib/api'
import { buildQuery, type PageQuery, type PageResult } from './types'

/** Mirrors backend LoginLogVO (sys_login_log row). status: 0 = failure, 1 = success. */
export interface LoginLogVO {
  id: number
  username?: string | null
  ip?: string | null
  userAgent?: string | null
  status: number
  message?: string | null
  loginAt: string
}

export interface LoginLogQuery extends PageQuery {
  username?: string
  status?: number
  from?: string
  to?: string
}

export function listLoginLogs(query: LoginLogQuery): Promise<PageResult<LoginLogVO>> {
  return request<PageResult<LoginLogVO>>(`/api/logs/login${buildQuery({ ...query })}`)
}

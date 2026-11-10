import { request } from '@/lib/api'
import { buildQuery, type PageQuery, type PageResult } from './types'

/** Mirrors backend JobVO (sys_job row). */
export interface JobVO {
  id: number
  jobName: string
  jobGroup: string
  beanName: string
  cron: string
  params?: string | null
  /** 0 = paused, 1 = enabled. */
  status: number
  remark?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  /** Latest execution start; null until the job has run. */
  lastRunAt?: string | null
}

/** Body of POST /api/jobs and PUT /api/jobs/{id}. */
export interface JobPayload {
  jobName: string
  jobGroup?: string
  beanName: string
  cron: string
  params?: string
  status: number
  remark?: string
}

export interface JobQuery extends PageQuery {
  jobName?: string
  status?: number
}

/** Mirrors backend JobLogVO (sys_job_log row). status: 0 = failure, 1 = success. */
export interface JobLogVO {
  id: number
  jobId: number | null
  jobName: string | null
  status: number
  message?: string | null
  startedAt: string
  finishedAt?: string | null
  durationMs?: number | null
  /** cron | manual */
  triggerType: string
}

export interface JobLogQuery extends PageQuery {
  jobId?: number
  status?: number
  from?: string
  to?: string
}

export function listJobs(query: JobQuery): Promise<PageResult<JobVO>> {
  return request<PageResult<JobVO>>(`/api/jobs${buildQuery({ ...query })}`)
}

export function createJob(payload: JobPayload): Promise<JobVO> {
  return request<JobVO>('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateJob(id: number, payload: JobPayload): Promise<JobVO> {
  return request<JobVO>(`/api/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteJob(id: number): Promise<void> {
  return request<void>(`/api/jobs/${id}`, { method: 'DELETE' })
}

export function pauseJob(id: number): Promise<JobVO> {
  return request<JobVO>(`/api/jobs/${id}/pause`, { method: 'POST' })
}

export function resumeJob(id: number): Promise<JobVO> {
  return request<JobVO>(`/api/jobs/${id}/resume`, { method: 'POST' })
}

/** Triggers one extra execution without touching cron or status. */
export function runJob(id: number): Promise<JobVO> {
  return request<JobVO>(`/api/jobs/${id}/run`, { method: 'POST' })
}

export function listJobLogs(query: JobLogQuery): Promise<PageResult<JobLogVO>> {
  return request<PageResult<JobLogVO>>(`/api/jobs/logs${buildQuery({ ...query })}`)
}

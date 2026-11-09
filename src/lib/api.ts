import type { ApiResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:18081'
const TOKEN_KEY = 'octopus_token'

export class ApiError extends Error {
  readonly code: number
  readonly status: number

  constructor(message: string, code: number, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_KEY)
}

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>
  auth?: boolean
  redirectOnUnauthorized?: boolean
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  window.location.assign('/')
}

/**
 * Fetch wrapper for the api-admin BFF. Attaches the bearer token, unwraps R<T>,
 * and clears the session on 401.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, redirectOnUnauthorized = true, headers, ...rest } = options
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  }
  if (rest.body !== undefined && rest.body !== null) {
    finalHeaders['Content-Type'] ??= 'application/json'
  }
  if (auth) {
    const token = getToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    cache: 'no-store',
  })

  let body: ApiResponse<T> | null = null
  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    body = null
  }

  if (response.status === 401) {
    if (redirectOnUnauthorized) {
      clearToken()
      redirectToLogin()
    }
    throw new ApiError(body?.msg ?? '用户名或密码错误', body?.code ?? 401, 401)
  }

  if (!response.ok || !body || body.code !== 200) {
    throw new ApiError(
      body?.msg ?? `请求失败（${response.status}）`,
      body?.code ?? response.status,
      response.status,
    )
  }

  return body.data
}

/** Mirrors java-common-bean PageQueryBean (page is 1-based, size capped at 100). */
export interface PageQuery {
  page: number
  size: number
}

/** Mirrors java-common-bean PageResultBean. */
export interface PageResult<T> {
  count: number
  list: T[]
}

type QueryValue = string | number | boolean | null | undefined

export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

import { request } from '@/lib/api'

export type MenuType = 'catalog' | 'menu' | 'button'

/** Mirrors backend MenuVO for GET /api/menus/tree (all levels, buttons included). */
export interface MenuVO {
  id: number
  parentId: number | null
  name: string
  type: MenuType
  path?: string | null
  icon?: string | null
  perms?: string | null
  sort: number
  status: number
  children?: MenuVO[]
}

export interface MenuPayload {
  parentId: number | null
  name: string
  type: MenuType
  path?: string
  icon?: string
  perms?: string
  sort?: number
  status?: number
}

export function fetchMenuTree(): Promise<MenuVO[]> {
  return request<MenuVO[]>('/api/menus/tree')
}

export function createMenu(payload: MenuPayload): Promise<MenuVO> {
  return request<MenuVO>('/api/menus', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMenu(id: number, payload: MenuPayload): Promise<MenuVO> {
  return request<MenuVO>(`/api/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteMenu(id: number): Promise<void> {
  return request<void>(`/api/menus/${id}`, { method: 'DELETE' })
}

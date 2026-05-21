import type { MenuItem } from '@/types'

export const MENU_TREE: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/dashboard',
  },
  {
    id: 'system',
    label: 'System Management',
    icon: '⚙️',
    children: [
      { id: 'users', label: 'User Management', icon: '👤', path: '/system/users' },
      { id: 'roles', label: 'Role Management', icon: '🛡️', path: '/system/roles' },
      { id: 'permissions', label: 'Permission Management', icon: '🔑', path: '/system/permissions' },
    ],
  },
  {
    id: 'content',
    label: 'Content Management',
    icon: '📝',
    children: [
      { id: 'articles', label: 'Articles', icon: '📄', path: '/content/articles' },
      { id: 'categories', label: 'Categories', icon: '📂', path: '/content/categories' },
      { id: 'media', label: 'Media Library', icon: '🖼️', path: '/content/media' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: '📡',
    children: [
      { id: 'logs', label: 'System Logs', icon: '📋', path: '/monitoring/logs' },
      { id: 'metrics', label: 'Performance Metrics', icon: '📈', path: '/monitoring/metrics' },
      { id: 'alerts', label: 'Alert Rules', icon: '🔔', path: '/monitoring/alerts' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '🔧',
    path: '/settings',
  },
]
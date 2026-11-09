'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { DictSelect } from '@/components/ui/DictSelect'
import { FormField, inputClass, selectClass } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import {
  createUser,
  deleteUser,
  fetchUserRoles,
  listUsers,
  resetUserPassword,
  saveUserRoles,
  updateUser,
  updateUserStatus,
  type UserVO,
} from '@/lib/api/users'
import { listRoles, type RoleVO } from '@/lib/api/roles'
import { useAuthStore } from '@/stores/auth'

type Notice = { type: 'success' | 'error'; text: string }

type EditorState = {
  open: boolean
  mode: 'create' | 'edit'
  id?: number
  username: string
  nickname: string
  gender: string
  password: string
  status: number
  builtIn: boolean
}

const EMPTY_EDITOR: EditorState = {
  open: false,
  mode: 'create',
  username: '',
  nickname: '',
  gender: '',
  password: '',
  status: 1,
  builtIn: false,
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : '操作失败'
}

export default function UsersPage() {
  const permissions = useAuthStore((state) => state.permissions)
  const canAdd = permissions.includes('sys:user:add')
  const canUpdate = permissions.includes('sys:user:update')
  const canDelete = permissions.includes('sys:user:delete')

  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameFilter, setUsernameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | '0' | '1'>('')

  const [rows, setRows] = useState<UserVO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR)
  const [saving, setSaving] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState<UserVO | null>(null)
  const [resetting, setResetting] = useState<UserVO | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [assigning, setAssigning] = useState<UserVO | null>(null)
  const [roleOptions, setRoleOptions] = useState<RoleVO[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [modalBusy, setModalBusy] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listUsers({
        page,
        size,
        username: usernameFilter || undefined,
        status: statusFilter === '' ? undefined : Number(statusFilter),
      })
      setRows(result.list)
      setTotal(result.count)
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [page, size, usernameFilter, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const search = () => {
    setPage(1)
    setUsernameFilter(usernameInput.trim())
  }

  const resetFilters = () => {
    setUsernameInput('')
    setUsernameFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const openCreate = () => {
    setEditor({ ...EMPTY_EDITOR, open: true, mode: 'create' })
    setEditorError(null)
  }

  const openEdit = (user: UserVO) => {
    setEditor({
      open: true,
      mode: 'edit',
      id: user.id,
      username: user.username,
      nickname: user.nickname ?? '',
      gender: user.gender ?? '',
      password: '',
      status: user.status ?? 1,
      builtIn: Boolean(user.builtIn),
    })
    setEditorError(null)
  }

  const submitEditor = async () => {
    setEditorError(null)
    if (!editor.username.trim()) {
      setEditorError('用户名不能为空')
      return
    }
    if (editor.mode === 'create' && !editor.password) {
      setEditorError('密码不能为空')
      return
    }
    setSaving(true)
    try {
      if (editor.mode === 'create') {
        await createUser({
          username: editor.username.trim(),
          nickname: editor.nickname.trim(),
          gender: editor.gender,
          password: editor.password,
          status: editor.status,
        })
      } else if (editor.id !== undefined) {
        await updateUser(editor.id, {
          username: editor.username.trim(),
          nickname: editor.nickname.trim(),
          gender: editor.gender,
          password: editor.password || undefined,
          status: editor.status,
        })
      }
      setEditor(EMPTY_EDITOR)
      setNotice({ type: 'success', text: editor.mode === 'create' ? '用户已创建' : '用户已更新' })
      await load()
    } catch (error) {
      setEditorError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (user: UserVO) => {
    const next = user.status === 1 ? 0 : 1
    try {
      await updateUserStatus(user.id, next)
      setNotice({ type: 'success', text: next === 1 ? '用户已启用' : '用户已停用' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteUser(deleting.id)
      setNotice({ type: 'success', text: '用户已删除' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setDeleting(null)
    }
  }

  const openReset = (user: UserVO) => {
    setResetting(user)
    setNewPassword('')
    setModalError(null)
  }

  const submitReset = async () => {
    if (!resetting) return
    if (!newPassword) {
      setModalError('密码不能为空')
      return
    }
    setModalBusy(true)
    setModalError(null)
    try {
      await resetUserPassword(resetting.id, newPassword)
      setResetting(null)
      setNotice({ type: 'success', text: '密码已重置' })
    } catch (error) {
      setModalError(errorMessage(error))
    } finally {
      setModalBusy(false)
    }
  }

  const openAssign = async (user: UserVO) => {
    setAssigning(user)
    setSelectedRoleIds([])
    setModalError(null)
    setModalBusy(true)
    try {
      const [roles, assigned] = await Promise.all([
        listRoles({ page: 1, size: 100 }),
        fetchUserRoles(user.id),
      ])
      setRoleOptions(roles.list)
      setSelectedRoleIds(assigned.map((role) => role.id))
    } catch (error) {
      setModalError(errorMessage(error))
    } finally {
      setModalBusy(false)
    }
  }

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    )
  }

  const submitRoles = async () => {
    if (!assigning) return
    setModalBusy(true)
    setModalError(null)
    try {
      await saveUserRoles(assigning.id, selectedRoleIds)
      setAssigning(null)
      setNotice({ type: 'success', text: '角色已保存' })
      await load()
    } catch (error) {
      setModalError(errorMessage(error))
    } finally {
      setModalBusy(false)
    }
  }

  const columns: DataTableColumn<UserVO>[] = [
    { key: 'username', title: '用户名', width: '160px', render: (row) => row.username },
    { key: 'nickname', title: '昵称', render: (row) => row.nickname || '-' },
    {
      key: 'roles',
      title: '角色',
      render: (row) =>
        row.roles && row.roles.length > 0
          ? row.roles.map((role) => role.code).join(', ')
          : '-',
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
            row.status === 1
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-slate-500/10 text-slate-400'
          }`}
        >
          {row.status === 1 ? '正常' : '停用'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          {canUpdate ? (
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
            >
              编辑
            </button>
          ) : null}
          {canUpdate ? (
            <button
              type="button"
              disabled={Boolean(row.builtIn)}
              onClick={() => void toggleStatus(row)}
              className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {row.status === 1 ? '停用' : '启用'}
            </button>
          ) : null}
          {canUpdate ? (
            <button
              type="button"
              onClick={() => openReset(row)}
              className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
            >
              重置密码
            </button>
          ) : null}
          {canUpdate ? (
            <button
              type="button"
              onClick={() => void openAssign(row)}
              className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
            >
              分配角色
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={() => setDeleting(row)}
              className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
            >
              删除
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">用户管理</h1>
          <p className="mt-1 text-sm text-slate-400">维护账号、状态与角色授权</p>
        </div>
        {canAdd ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            新增用户
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={usernameInput}
          onChange={(event) => setUsernameInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') search()
          }}
          placeholder="按用户名筛选"
          className={`${inputClass} max-w-xs`}
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as '' | '0' | '1')
            setPage(1)
          }}
          className={`${selectClass} max-w-[140px]`}
        >
          <option value="">全部状态</option>
          <option value="1">正常</option>
          <option value="0">停用</option>
        </select>
        <button
          type="button"
          onClick={search}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
        >
          查询
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/10"
        >
          重置
        </button>
      </div>

      {notice ? (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            notice.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        loading={loading}
        pagination={{
          page,
          size,
          total,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        open={editor.open}
        title={editor.mode === 'create' ? '新增用户' : '编辑用户'}
        onClose={() => setEditor(EMPTY_EDITOR)}
        onConfirm={() => void submitEditor()}
        confirmLoading={saving}
        confirmText="保存"
      >
        <div className="space-y-3">
          <FormField label="用户名" htmlFor="user-username" required>
            <input
              id="user-username"
              value={editor.username}
              onChange={(event) => setEditor((state) => ({ ...state, username: event.target.value }))}
              className={inputClass}
            />
          </FormField>
          <FormField label="昵称" htmlFor="user-nickname">
            <input
              id="user-nickname"
              value={editor.nickname}
              onChange={(event) => setEditor((state) => ({ ...state, nickname: event.target.value }))}
              className={inputClass}
            />
          </FormField>
          <FormField label="性别" htmlFor="user-gender">
            <DictSelect
              id="user-gender"
              dictType="sys_user_sex"
              value={editor.gender}
              onChange={(gender) => setEditor((state) => ({ ...state, gender }))}
              disabled={editor.builtIn}
            />
          </FormField>
          <FormField
            label={editor.mode === 'create' ? '密码' : '密码（留空则不修改）'}
            htmlFor="user-password"
            required={editor.mode === 'create'}
          >
            <input
              id="user-password"
              type="password"
              value={editor.password}
              onChange={(event) => setEditor((state) => ({ ...state, password: event.target.value }))}
              className={inputClass}
            />
          </FormField>
          <FormField label="状态" htmlFor="user-status">
            <select
              id="user-status"
              disabled={editor.builtIn}
              value={editor.status}
              onChange={(event) =>
                setEditor((state) => ({ ...state, status: Number(event.target.value) }))
              }
              className={selectClass}
            >
              <option value={1}>正常</option>
              <option value={0}>停用</option>
            </select>
          </FormField>
          {editorError ? <p className="text-xs text-red-400">{editorError}</p> : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="删除用户"
        danger
        message={deleting ? `确定删除用户「${deleting.username}」吗？` : ''}
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      <Modal
        open={resetting !== null}
        title="重置密码"
        onClose={() => setResetting(null)}
        onConfirm={() => void submitReset()}
        confirmLoading={modalBusy}
        confirmText="重置"
      >
        <p className="mb-3 text-slate-400">
          为用户「{resetting?.username}」设置新密码。
        </p>
        <FormField label="新密码" htmlFor="reset-password" required>
          <input
            id="reset-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className={inputClass}
          />
        </FormField>
        {modalError ? <p className="mt-2 text-xs text-red-400">{modalError}</p> : null}
      </Modal>

      <Modal
        open={assigning !== null}
        title="分配角色"
        onClose={() => setAssigning(null)}
        onConfirm={() => void submitRoles()}
        confirmLoading={modalBusy}
        confirmText="保存"
      >
        <p className="mb-3 text-slate-400">
          为用户「{assigning?.username}」选择角色（全量覆盖保存）。
        </p>
        {roleOptions.length === 0 ? (
          <p className="text-sm text-slate-500">暂无可分配角色</p>
        ) : (
          <div className="space-y-2">
            {roleOptions.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900"
                />
                <span>
                  {role.name} <span className="text-slate-500">({role.code})</span>
                </span>
              </label>
            ))}
          </div>
        )}
        {modalError ? <p className="mt-2 text-xs text-red-400">{modalError}</p> : null}
      </Modal>
    </div>
  )
}

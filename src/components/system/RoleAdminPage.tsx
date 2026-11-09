'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'
import {
  createRole,
  deleteRole,
  fetchRoleMenuIds,
  listRoles,
  saveRoleMenus,
  updateRole,
  updateRoleStatus,
  type RoleVO,
} from '@/lib/api/roles'
import { fetchMenuTree, type MenuVO } from '@/lib/api/menus'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField, inputClass, selectClass } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { Tree, type TreeNodeData } from '@/components/ui/Tree'

const CODE_PATTERN = /^[a-z0-9_]+$/

interface RoleForm {
  name: string
  code: string
  status: number
}

const EMPTY_FORM: RoleForm = { name: '', code: '', status: 1 }

function buildTree(menus: MenuVO[]): TreeNodeData[] {
  return menus.map((menu) => ({
    id: menu.id,
    label: menu.type === 'button' ? `${menu.name}（按钮）` : menu.name,
    children: menu.children?.length ? buildTree(menu.children) : undefined,
  }))
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : '操作失败，请稍后重试'
}

export function RoleAdminPage() {
  const [rows, setRows] = useState<RoleVO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [nameInput, setNameInput] = useState('')
  const [statusInput, setStatusInput] = useState('')
  const [appliedName, setAppliedName] = useState('')
  const [appliedStatus, setAppliedStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [notice, setNotice] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RoleVO | null>(null)
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<RoleVO | null>(null)

  const [grantTarget, setGrantTarget] = useState<RoleVO | null>(null)
  const [treeNodes, setTreeNodes] = useState<TreeNodeData[]>([])
  const [checkedIds, setCheckedIds] = useState<number[]>([])
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantError, setGrantError] = useState('')
  const [savingGrant, setSavingGrant] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const result = await listRoles({
        page,
        size,
        name: appliedName || undefined,
        status: appliedStatus === '' ? undefined : Number(appliedStatus),
      })
      setRows(result.list)
      setTotal(result.count)
    } catch (error) {
      setListError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [page, size, appliedName, appliedStatus])

  useEffect(() => {
    void load()
  }, [load])

  const search = () => {
    setPage(1)
    setAppliedName(nameInput.trim())
    setAppliedStatus(statusInput)
  }

  const resetSearch = () => {
    setNameInput('')
    setStatusInput('')
    setPage(1)
    setAppliedName('')
    setAppliedStatus('')
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (row: RoleVO) => {
    setEditing(row)
    setForm({ name: row.name, code: row.code, status: row.status })
    setFormError('')
    setFormOpen(true)
  }

  const submitForm = async () => {
    const name = form.name.trim()
    const code = form.code.trim()
    if (!name) {
      setFormError('请输入角色名称')
      return
    }
    if (!CODE_PATTERN.test(code)) {
      setFormError('编码只能包含小写字母、数字和下划线')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await updateRole(editing.id, { name, code, status: form.status })
      } else {
        await createRole({ name, code, status: form.status })
      }
      setFormOpen(false)
      setNotice(editing ? '角色已更新' : '角色已创建')
      await load()
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (row: RoleVO) => {
    setListError('')
    try {
      await updateRoleStatus(row.id, row.status === 1 ? 0 : 1)
      setNotice(row.status === 1 ? '角色已停用' : '角色已启用')
      await load()
    } catch (error) {
      setListError(errorMessage(error))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setListError('')
    try {
      await deleteRole(deleteTarget.id)
      setDeleteTarget(null)
      setNotice('角色已删除')
      await load()
    } catch (error) {
      setDeleteTarget(null)
      setListError(errorMessage(error))
    }
  }

  const openGrant = async (row: RoleVO) => {
    setGrantTarget(row)
    setTreeNodes([])
    setCheckedIds([])
    setGrantError('')
    setGrantLoading(true)
    try {
      const [tree, ids] = await Promise.all([fetchMenuTree(), fetchRoleMenuIds(row.id)])
      setTreeNodes(buildTree(tree))
      setCheckedIds(ids)
    } catch (error) {
      setGrantError(errorMessage(error))
    } finally {
      setGrantLoading(false)
    }
  }

  const saveGrant = async () => {
    if (!grantTarget) return
    setSavingGrant(true)
    setGrantError('')
    try {
      await saveRoleMenus(grantTarget.id, checkedIds)
      setGrantTarget(null)
      setNotice('菜单授权已保存')
    } catch (error) {
      setGrantError(errorMessage(error))
    } finally {
      setSavingGrant(false)
    }
  }

  const columns: DataTableColumn<RoleVO>[] = [
    { key: 'id', title: 'ID', width: '70px', render: (row) => row.id },
    {
      key: 'name',
      title: '角色名称',
      render: (row) => <span className="font-medium text-white">{row.name}</span>,
    },
    {
      key: 'code',
      title: '编码',
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">{row.code}</code>
          {row.builtIn ? (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">内置</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row) =>
        row.status === 1 ? (
          <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">启用</span>
        ) : (
          <span className="rounded bg-slate-600/30 px-2 py-0.5 text-xs text-slate-400">停用</span>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">角色管理</h1>
          <p className="mt-1 text-xs text-slate-500">维护角色信息并配置角色的菜单与按钮权限</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          新增角色
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          角色名称
          <input
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') search()
            }}
            placeholder="按名称模糊筛选"
            className={`${inputClass} w-48`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          状态
          <select
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
            className={`${selectClass} w-32`}
          >
            <option value="">全部</option>
            <option value="1">启用</option>
            <option value="0">停用</option>
          </select>
        </label>
        <button
          type="button"
          onClick={search}
          className="rounded-lg border border-indigo-500/60 px-4 py-2 text-sm text-indigo-200 transition hover:bg-indigo-500/10"
        >
          查询
        </button>
        <button
          type="button"
          onClick={resetSearch}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
        >
          重置
        </button>
      </div>

      {notice ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {notice}
        </div>
      ) : null}
      {listError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {listError}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        loading={loading}
        emptyText="暂无角色"
        pagination={{ page, size, total, onChange: (nextPage, nextSize) => { setPage(nextPage); setSize(nextSize) } }}
        rowActions={(row) => (
          <div className="flex justify-end gap-2 text-xs">
            <button type="button" onClick={() => openEdit(row)} className="text-indigo-300 transition hover:text-indigo-200">
              编辑
            </button>
            <button type="button" onClick={() => void openGrant(row)} className="text-sky-300 transition hover:text-sky-200">
              菜单授权
            </button>
            <button
              type="button"
              disabled={row.builtIn}
              onClick={() => void toggleStatus(row)}
              className="text-amber-300 transition hover:text-amber-200 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              {row.status === 1 ? '停用' : '启用'}
            </button>
            <button
              type="button"
              disabled={row.builtIn}
              onClick={() => setDeleteTarget(row)}
              className="text-red-300 transition hover:text-red-200 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              删除
            </button>
          </div>
        )}
      />

      <Modal
        open={formOpen}
        title={editing ? '编辑角色' : '新增角色'}
        onClose={() => setFormOpen(false)}
        onConfirm={() => void submitForm()}
        onCancel={() => setFormOpen(false)}
        confirmLoading={saving}
        confirmText="保存"
      >
        <div className="space-y-4">
          <FormField label="角色名称" htmlFor="role-name" required>
            <input
              id="role-name"
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="如：运维管理员"
              className={inputClass}
            />
          </FormField>
          <FormField
            label="角色编码"
            htmlFor="role-code"
            required
            hint={editing?.builtIn ? '内置角色编码不可修改' : '仅允许小写字母、数字与下划线'}
          >
            <input
              id="role-code"
              value={form.code}
              disabled={Boolean(editing?.builtIn)}
              onChange={(event) => setForm((previous) => ({ ...previous, code: event.target.value }))}
              placeholder="如：ops_admin"
              className={inputClass}
            />
          </FormField>
          <FormField label="状态" htmlFor="role-status">
            <select
              id="role-status"
              value={form.status}
              disabled={Boolean(editing?.builtIn)}
              onChange={(event) => setForm((previous) => ({ ...previous, status: Number(event.target.value) }))}
              className={selectClass}
            >
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </FormField>
          {formError ? <p className="text-xs text-red-400">{formError}</p> : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除角色"
        message={`确定删除角色「${deleteTarget?.name ?? ''}」吗？`}
        confirmText="删除"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal
        open={grantTarget !== null}
        title={`菜单授权${grantTarget ? ` · ${grantTarget.name}` : ''}`}
        width={560}
        onClose={() => setGrantTarget(null)}
        footer={
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">勾选目录、菜单与按钮节点</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGrantTarget(null)}
                disabled={savingGrant}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void saveGrant()}
                disabled={savingGrant || grantLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingGrant ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {grantError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {grantError}
            </div>
          ) : null}
          {grantLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">加载中...</p>
          ) : (
            <Tree nodes={treeNodes} checked={checkedIds} onChange={setCheckedIds} defaultExpandAll />
          )}
        </div>
      </Modal>
    </div>
  )
}

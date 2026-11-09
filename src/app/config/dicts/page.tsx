'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField, inputClass, selectClass } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import {
  createDictData,
  createDictType,
  deleteDictData,
  deleteDictType,
  listDictData,
  listDictTypes,
  updateDictData,
  updateDictType,
  type DictDataVO,
  type DictTypeVO,
} from '@/lib/api/dicts'
import { useAuthStore } from '@/stores/auth'

type Notice = { type: 'success' | 'error'; text: string }

type TypeEditorState = {
  open: boolean
  mode: 'create' | 'edit'
  id?: number
  dictType: string
  dictName: string
  status: number
  remark: string
}

type DataEditorState = {
  open: boolean
  mode: 'create' | 'edit'
  id?: number
  dictLabel: string
  dictValue: string
  sort: number
  status: number
}

const EMPTY_TYPE_EDITOR: TypeEditorState = {
  open: false,
  mode: 'create',
  dictType: '',
  dictName: '',
  status: 1,
  remark: '',
}

function emptyDataEditor(): DataEditorState {
  return {
    open: false,
    mode: 'create',
    dictLabel: '',
    dictValue: '',
    sort: 0,
    status: 1,
  }
}

const DICT_TYPE_PATTERN = /^[a-z0-9_]+$/

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : '操作失败'
}

export default function DictPage() {
  const permissions = useAuthStore((state) => state.permissions)
  const canAdd = permissions.includes('sys:dict:add')
  const canEdit = permissions.includes('sys:dict:edit')
  const canDelete = permissions.includes('sys:dict:delete')

  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [typeInput, setTypeInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')

  const [types, setTypes] = useState<DictTypeVO[]>([])
  const [total, setTotal] = useState(0)
  const [typesLoading, setTypesLoading] = useState(false)
  const [selected, setSelected] = useState<DictTypeVO | null>(null)

  const [items, setItems] = useState<DictDataVO[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)

  const [notice, setNotice] = useState<Notice | null>(null)

  const [typeEditor, setTypeEditor] = useState<TypeEditorState>(EMPTY_TYPE_EDITOR)
  const [typeError, setTypeError] = useState<string | null>(null)
  const [savingType, setSavingType] = useState(false)

  const [dataEditor, setDataEditor] = useState<DataEditorState>(emptyDataEditor())
  const [dataError, setDataError] = useState<string | null>(null)
  const [savingData, setSavingData] = useState(false)

  const [deletingType, setDeletingType] = useState<DictTypeVO | null>(null)
  const [deletingData, setDeletingData] = useState<DictDataVO | null>(null)

  const loadTypes = useCallback(async () => {
    setTypesLoading(true)
    try {
      const result = await listDictTypes({
        page,
        size,
        dictType: typeFilter || undefined,
        dictName: nameFilter || undefined,
      })
      setTypes(result.list)
      setTotal(result.count)
      setSelected((previous) => {
        if (previous) {
          const stillThere = result.list.find((item) => item.id === previous.id)
          if (stillThere) return stillThere
        }
        return result.list[0] ?? null
      })
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setTypesLoading(false)
    }
  }, [page, size, typeFilter, nameFilter])

  useEffect(() => {
    void loadTypes()
  }, [loadTypes])

  const selectedType = selected?.dictType ?? ''

  const loadItems = useCallback(async () => {
    if (!selectedType) {
      setItems([])
      return
    }
    setItemsLoading(true)
    try {
      setItems(await listDictData(selectedType))
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setItemsLoading(false)
    }
  }, [selectedType])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const search = () => {
    setPage(1)
    setTypeFilter(typeInput.trim())
    setNameFilter(nameInput.trim())
  }

  const resetFilters = () => {
    setTypeInput('')
    setNameInput('')
    setTypeFilter('')
    setNameFilter('')
    setPage(1)
  }

  const openCreateType = () => {
    setTypeEditor({ ...EMPTY_TYPE_EDITOR, open: true, mode: 'create' })
    setTypeError(null)
  }

  const openEditType = (type: DictTypeVO) => {
    setTypeEditor({
      open: true,
      mode: 'edit',
      id: type.id,
      dictType: type.dictType,
      dictName: type.dictName,
      status: type.status,
      remark: type.remark ?? '',
    })
    setTypeError(null)
  }

  const submitType = async () => {
    setTypeError(null)
    const dictType = typeEditor.dictType.trim()
    const dictName = typeEditor.dictName.trim()
    if (!dictName) {
      setTypeError('字典名称不能为空')
      return
    }
    if (!DICT_TYPE_PATTERN.test(dictType)) {
      setTypeError('字典类型只允许小写字母、数字和下划线')
      return
    }
    setSavingType(true)
    try {
      const payload = {
        dictType,
        dictName,
        status: typeEditor.status,
        remark: typeEditor.remark.trim(),
      }
      if (typeEditor.mode === 'create') {
        await createDictType(payload)
      } else if (typeEditor.id !== undefined) {
        await updateDictType(typeEditor.id, payload)
      }
      setTypeEditor(EMPTY_TYPE_EDITOR)
      setNotice({ type: 'success', text: typeEditor.mode === 'create' ? '字典类型已创建' : '字典类型已更新' })
      await loadTypes()
    } catch (error) {
      setTypeError(errorMessage(error))
    } finally {
      setSavingType(false)
    }
  }

  const confirmDeleteType = async () => {
    if (!deletingType) return
    try {
      await deleteDictType(deletingType.id)
      setNotice({ type: 'success', text: '字典类型已删除' })
      if (selected?.id === deletingType.id) {
        setSelected(null)
      }
      await loadTypes()
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setDeletingType(null)
    }
  }

  const openCreateData = () => {
    if (!selected) return
    setDataEditor({ ...emptyDataEditor(), open: true, mode: 'create' })
    setDataError(null)
  }

  const openEditData = (data: DictDataVO) => {
    setDataEditor({
      open: true,
      mode: 'edit',
      id: data.id,
      dictLabel: data.dictLabel,
      dictValue: data.dictValue,
      sort: data.sort,
      status: data.status,
    })
    setDataError(null)
  }

  const submitData = async () => {
    if (!selected) return
    setDataError(null)
    const dictLabel = dataEditor.dictLabel.trim()
    const dictValue = dataEditor.dictValue.trim()
    if (!dictLabel) {
      setDataError('字典标签不能为空')
      return
    }
    if (!dictValue) {
      setDataError('字典键值不能为空')
      return
    }
    setSavingData(true)
    try {
      const payload = {
        dictType: selected.dictType,
        dictLabel,
        dictValue,
        sort: dataEditor.sort,
        status: dataEditor.status,
      }
      if (dataEditor.mode === 'create') {
        await createDictData(payload)
      } else if (dataEditor.id !== undefined) {
        await updateDictData(dataEditor.id, payload)
      }
      setDataEditor(emptyDataEditor())
      setNotice({ type: 'success', text: dataEditor.mode === 'create' ? '字典项已创建' : '字典项已更新' })
      await loadItems()
    } catch (error) {
      setDataError(errorMessage(error))
    } finally {
      setSavingData(false)
    }
  }

  const confirmDeleteData = async () => {
    if (!deletingData) return
    try {
      await deleteDictData(deletingData.id)
      setNotice({ type: 'success', text: '字典项已删除' })
      await loadItems()
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setDeletingData(null)
    }
  }

  const typeColumns: DataTableColumn<DictTypeVO>[] = [
    {
      key: 'dictName',
      title: '字典名称',
      render: (row) => (
        <span className={selected?.id === row.id ? 'font-medium text-indigo-300' : 'text-slate-200'}>
          {row.dictName}
        </span>
      ),
    },
    {
      key: 'dictType',
      title: '字典类型',
      render: (row) => (
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">{row.dictType}</code>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '70px',
      render: (row) =>
        row.status === 1 ? (
          <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">启用</span>
        ) : (
          <span className="rounded bg-slate-600/30 px-2 py-0.5 text-xs text-slate-400">停用</span>
        ),
    },
  ]

  const dataColumns: DataTableColumn<DictDataVO>[] = [
    { key: 'dictLabel', title: '标签', render: (row) => row.dictLabel },
    {
      key: 'dictValue',
      title: '键值',
      render: (row) => (
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">{row.dictValue}</code>
      ),
    },
    { key: 'sort', title: '排序', width: '70px', render: (row) => row.sort },
    {
      key: 'status',
      title: '状态',
      width: '70px',
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">数据字典</h1>
          <p className="mt-1 text-sm text-slate-400">维护字典类型与字典项，字典项按排序升序下发给下拉</p>
        </div>
        {canAdd ? (
          <button
            type="button"
            onClick={openCreateType}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            新增类型
          </button>
        ) : null}
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={typeInput}
              onChange={(event) => setTypeInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') search()
              }}
              placeholder="按类型搜索"
              className={`${inputClass} max-w-[10rem]`}
            />
            <input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') search()
              }}
              placeholder="按名称搜索"
              className={`${inputClass} max-w-[10rem]`}
            />
            <button
              type="button"
              onClick={search}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              查询
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:bg-white/10"
            >
              重置
            </button>
          </div>

          <DataTable
            columns={typeColumns}
            data={types}
            rowKey={(row) => row.id}
            loading={typesLoading}
            emptyText="暂无字典类型"
            onRowClick={(row) => setSelected(row)}
            pagination={{
              page,
              size,
              total,
              onChange: (nextPage, nextSize) => {
                setPage(nextPage)
                setSize(nextSize)
              },
            }}
            rowActions={(row) => (
              <div className="flex justify-end gap-1.5">
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => openEditType(row)}
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                  >
                    编辑
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => setDeletingType(row)}
                    className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
                  >
                    删除
                  </button>
                ) : null}
              </div>
            )}
          />
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
            <div className="text-sm text-slate-300">
              {selected ? (
                <>
                  <span className="font-medium text-white">{selected.dictName}</span>
                  <code className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
                    {selected.dictType}
                  </code>
                </>
              ) : (
                <span className="text-slate-500">请选择左侧字典类型</span>
              )}
            </div>
            {canAdd ? (
              <button
                type="button"
                disabled={!selected}
                onClick={openCreateData}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                新增字典项
              </button>
            ) : null}
          </div>

          <DataTable
            columns={dataColumns}
            data={items}
            rowKey={(row) => row.id}
            loading={itemsLoading}
            emptyText={selected ? '该类型下暂无字典项' : '请先选择字典类型'}
            rowActions={(row) => (
              <div className="flex justify-end gap-1.5">
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => openEditData(row)}
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                  >
                    编辑
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => setDeletingData(row)}
                    className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
                  >
                    删除
                  </button>
                ) : null}
              </div>
            )}
          />
        </section>
      </div>

      <Modal
        open={typeEditor.open}
        title={typeEditor.mode === 'create' ? '新增字典类型' : '编辑字典类型'}
        onClose={() => setTypeEditor(EMPTY_TYPE_EDITOR)}
        onConfirm={() => void submitType()}
        confirmLoading={savingType}
        confirmText="保存"
      >
        <div className="space-y-3">
          <FormField label="字典名称" htmlFor="dict-name" required>
            <input
              id="dict-name"
              value={typeEditor.dictName}
              onChange={(event) =>
                setTypeEditor((state) => ({ ...state, dictName: event.target.value }))
              }
              placeholder="如：用户性别"
              className={inputClass}
            />
          </FormField>
          <FormField
            label="字典类型"
            htmlFor="dict-type"
            required
            hint="仅允许小写字母、数字与下划线"
          >
            <input
              id="dict-type"
              value={typeEditor.dictType}
              onChange={(event) =>
                setTypeEditor((state) => ({ ...state, dictType: event.target.value }))
              }
              placeholder="如：sys_user_sex"
              className={inputClass}
            />
          </FormField>
          <FormField label="状态" htmlFor="dict-type-status">
            <select
              id="dict-type-status"
              value={typeEditor.status}
              onChange={(event) =>
                setTypeEditor((state) => ({ ...state, status: Number(event.target.value) }))
              }
              className={selectClass}
            >
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </FormField>
          <FormField label="备注" htmlFor="dict-type-remark">
            <input
              id="dict-type-remark"
              value={typeEditor.remark}
              onChange={(event) =>
                setTypeEditor((state) => ({ ...state, remark: event.target.value }))
              }
              className={inputClass}
            />
          </FormField>
          {typeError ? <p className="text-xs text-red-400">{typeError}</p> : null}
        </div>
      </Modal>

      <Modal
        open={dataEditor.open}
        title={dataEditor.mode === 'create' ? '新增字典项' : '编辑字典项'}
        onClose={() => setDataEditor(emptyDataEditor())}
        onConfirm={() => void submitData()}
        confirmLoading={savingData}
        confirmText="保存"
      >
        <div className="space-y-3">
          <FormField label="字典标签" htmlFor="dict-label" required>
            <input
              id="dict-label"
              value={dataEditor.dictLabel}
              onChange={(event) =>
                setDataEditor((state) => ({ ...state, dictLabel: event.target.value }))
              }
              placeholder="如：男"
              className={inputClass}
            />
          </FormField>
          <FormField label="字典键值" htmlFor="dict-value" required>
            <input
              id="dict-value"
              value={dataEditor.dictValue}
              onChange={(event) =>
                setDataEditor((state) => ({ ...state, dictValue: event.target.value }))
              }
              placeholder="如：1"
              className={inputClass}
            />
          </FormField>
          <FormField label="排序" htmlFor="dict-sort" hint="数字越小越靠前">
            <input
              id="dict-sort"
              type="number"
              value={dataEditor.sort}
              onChange={(event) =>
                setDataEditor((state) => ({ ...state, sort: Number(event.target.value) }))
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="状态" htmlFor="dict-data-status">
            <select
              id="dict-data-status"
              value={dataEditor.status}
              onChange={(event) =>
                setDataEditor((state) => ({ ...state, status: Number(event.target.value) }))
              }
              className={selectClass}
            >
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </FormField>
          {dataError ? <p className="text-xs text-red-400">{dataError}</p> : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={deletingType !== null}
        title="删除字典类型"
        danger
        message={
          deletingType
            ? `确定删除字典类型「${deletingType.dictName}」吗？类型下仍有字典项时无法删除。`
            : ''
        }
        confirmText="删除"
        onConfirm={confirmDeleteType}
        onCancel={() => setDeletingType(null)}
      />

      <ConfirmDialog
        open={deletingData !== null}
        title="删除字典项"
        danger
        message={deletingData ? `确定删除字典项「${deletingData.dictLabel}」吗？` : ''}
        confirmText="删除"
        onConfirm={confirmDeleteData}
        onCancel={() => setDeletingData(null)}
      />
    </div>
  )
}

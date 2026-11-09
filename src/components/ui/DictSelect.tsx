'use client'

import { useEffect, useState } from 'react'
import { fetchDictOptions, type DictOptionVO } from '@/lib/api/dicts'
import { selectClass } from './FormField'

export interface DictSelectProps {
  dictType: string
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
}

export function DictSelect({ dictType, value = '', onChange, disabled = false, id }: DictSelectProps) {
  const [options, setOptions] = useState<DictOptionVO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchDictOptions(dictType)
      .then((items) => {
        if (!cancelled) setOptions(items)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setOptions([])
        setError(cause instanceof Error && cause.message ? cause.message : '字典加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [dictType])

  const empty = !loading && error === null && options.length === 0

  return (
    <div className="space-y-1">
      <select
        id={id}
        value={value}
        disabled={disabled || loading || error !== null || empty}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        <option value="">{loading ? '加载中…' : empty ? '暂无选项' : '请选择'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-400">字典加载失败：{error}</p> : null}
    </div>
  )
}

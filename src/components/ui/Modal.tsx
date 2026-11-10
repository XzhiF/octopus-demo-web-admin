'use client'

import { useEffect, type ReactNode } from 'react'

export interface ModalProps {
  open: boolean
  title?: ReactNode
  onClose: () => void
  children?: ReactNode
  footer?: ReactNode
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  confirmLoading?: boolean
  danger?: boolean
  width?: number
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
  confirmLoading = false,
  danger = false,
  width = 520,
}: ModalProps) {
  const handleCancel = onCancel ?? onClose

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, handleCancel])

  if (!open) return null

  const showDefaultFooter = footer === undefined && (onConfirm !== undefined || onCancel !== undefined)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div
        className="absolute inset-0"
        onClick={confirmLoading ? undefined : handleCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{ width, maxWidth: '100%' }}
        className="relative flex max-h-[90vh] flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="关闭"
            className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-slate-200">{children}</div>

        {footer !== undefined ? (
          <div className="border-t border-white/5 px-5 py-3">{footer}</div>
        ) : showDefaultFooter ? (
          <div className="flex justify-end gap-2 border-t border-white/5 px-5 py-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={confirmLoading}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              {cancelText}
            </button>
            {onConfirm ? (
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirmLoading}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                  danger ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {confirmLoading ? '处理中...' : confirmText}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
